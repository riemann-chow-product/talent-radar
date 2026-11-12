/* 才探 TalentRadar · 后端 API 客户端与「演示 / 服务」双模式切换
 *
 * demo   —— 纯静态原型，数据写入浏览器 localStorage，可 file:// 直接打开
 * server —— 服务端 API，数据来自 /api/bootstrap，变更回写 /api/state
 *
 * 写入类动作（上传简历 / 采集 / 发信）走后端细粒度 REST，成功后重新拉取
 * 全量快照并取消尚未发出的旧快照推送，避免前端过期数据覆盖后端刚写入的记录。
 */
window.TR = window.TR || {};

(function (TR) {
  'use strict';

  var cfg = window.TR_CONFIG || {};
  var FORCE_DEMO_KEY = 'tr-force-demo';
  var SESSION_KEY = 'tr-auth-session';
  var SHADOW_KEY = 'tr-pending-state';
  var MAX_RETRIES = 5;

  function signal(ms) {
    return (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(ms) : undefined;
  }

  /** Read the bearer token saved by auth.js; the demo token is never sent. */
  function authToken() {
    try {
      var raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      var s = raw ? JSON.parse(raw) : null;
      return (s && typeof s.token === 'string' && s.token && s.token !== 'demo') ? s.token : '';
    } catch (e) { return ''; }
  }

  function handleUnauthorized() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    if (TR.toast) TR.toast('登录已过期，请重新登录', 'warn');
  }

  function snapshot(state) {
    return {
      version: 1,
      company: state.company,
      candidates: state.candidates,
      jobs: state.jobs,
      sources: state.sources,
      mails: state.mails,
      letters: state.letters,
      activities: state.activities,
      trend: state.trend,
      logs: state.logs,
      seq: state.seq
    };
  }

  var api = {
    mode: 'demo',              // demo = localStorage | server = backend API
    // 空串是有效配置（与页面同源），不能用 || 兜底吞掉，否则局域网访问会连到客户端自己的 localhost
    base: cfg.apiBase == null ? 'http://localhost:8080' : cfg.apiBase,
    autoDetect: cfg.autoDetect !== false,
    status: '正在连接服务…',
    storage: '本地存储',
    lastError: '',
    serverInfo: null,
    _timer: null,
    _pushing: false,
    _dirty: false,
    _initPromise: null,

    /** 共享一次后端探测：登录页与工作台都会调用，避免重复 bootstrap */
    ready: function () {
      if (!this._initPromise) this._initPromise = this.init();
      return this._initPromise;
    },

    url: function (p, base) {
      var b = (base === undefined ? this.base : base) || '';
      return b.replace(/\/$/, '') + p;
    },

    /** 设置页展示用：同源部署时 base 为空串，改显示当前站点地址 */
    displayBase: function () {
      if (this.base) return this.base;
      try { return location.origin; } catch (e) { return '同源服务'; }
    },

    /** 通用请求：注入 Bearer token；非 2xx 抛出带响应正文的 Error */
    request: function (path, opts) {
      opts = opts || {};
      var headers = {};
      Object.keys(opts.headers || {}).forEach(function (k) { headers[k] = opts.headers[k]; });
      var token = authToken();
      if (token && !headers.Authorization) headers.Authorization = 'Bearer ' + token;
      var init = {
        method: opts.method || 'GET',
        headers: headers,
        signal: opts.signal || signal(opts.timeout || 6000)
      };
      if (opts.body !== undefined) init.body = opts.body;
      if (opts.keepalive) init.keepalive = true;
      return fetch(this.url(path, opts.base), init).then(function (r) {
        if (r.status === 401) {
          handleUnauthorized();
          return r.text().then(function (t) {
            var brief = '';
            try { brief = (JSON.parse(t).message || '').slice(0, 120); } catch (e) { /* ignore */ }
            throw new Error('HTTP 401' + (brief ? ' · ' + brief : ''));
          });
        }
        if (r.ok) return r.json();
        return r.text().then(function (t) {
          var brief = '';
          try { brief = (JSON.parse(t).message || '').slice(0, 120); }
          catch (e) { brief = (t || '').slice(0, 120); }
          throw new Error('HTTP ' + r.status + (brief ? ' · ' + brief : ''));
        });
      });
    },

    /** 启动时探测后端：同源优先，失败再回退到独立后端地址；成功则拉全量快照覆盖内存状态 */
    init: function () {
      var self = this;
      var forced = false;
      try { forced = sessionStorage.getItem(FORCE_DEMO_KEY) === '1'; } catch (e) { /* ignore */ }
      if (forced || !this.autoDetect || location.protocol === 'file:') {
        this.mode = 'demo';
        this.storage = '本地存储';
        this.status = location.protocol === 'file:' ? '演示数据（本地文件打开）' : '演示数据（手动指定）';
        this.lastError = '';
        this.updateBadges();
        return Promise.resolve(false);
      }

      var bases = [this.base];
      var fallback = cfg.fallbackBase;
      if (fallback && bases.indexOf(fallback) < 0) bases.push(fallback);

      function probe(i) {
        if (i >= bases.length) return Promise.reject(new Error('后端不可达'));
        var base = bases[i];
        return self.request('/api/health', { timeout: cfg.timeout || 1500, base: base })
          .then(function (h) {
            self.base = base;
            self.serverInfo = h;
            self.storage = '服务端存储';
            self.lastError = '';
            // Not logged in yet: the service is reachable, but /api/bootstrap
            // requires a token. Keep the local view and let the post-login
            // reload pull the server snapshot.
            if (!authToken()) return null;
            return self.bootstrap();
          })
          .catch(function (e) {
            if (e && e.message) self._probeError = e.message;
            return probe(i + 1);
          });
      }

      this._probeError = '';
      return probe(0)
        .then(function () {
          self.mode = 'server';
          self.status = '已连接';
          self.updateBadges();
          self.resumePending();
          return true;
        })
        .catch(function (e) {
          self.mode = 'demo';
          self.serverInfo = null;
          self.storage = '本地存储';
          self.lastError = self._probeError || (e && e.message) || '服务不可达';
          self.status = '服务未启动，已切换为演示数据';
          self.updateBadges();
          return false;
        });
    },

    /** 拉取与 Store.state 同构的全量快照 */
    bootstrap: function () {
      return this.request('/api/bootstrap', { timeout: 8000 }).then(function (snap) {
        if (!snap || !Array.isArray(snap.candidates)) throw new Error('bootstrap 数据格式异常');
        TR.Store.replace(snap);
        return snap;
      });
    },

    /** 细粒度接口写入后刷新；同时丢弃待发送的旧快照 */
    refresh: function () {
      this.cancelPush();
      return this.bootstrap();
    },

    cancelPush: function () {
      clearTimeout(this._timer);
      this._timer = null;
      this._dirty = false;
      // Abort an in-flight PUT so a stale full snapshot cannot land after a
      // fine-grained REST write and overwrite the freshly created record.
      if (this._controller) {
        this._controller._cancelled = true;
        try { this._controller.abort(); } catch (e) { /* ignore */ }
        this._controller = null;
      }
    },

    /** 防抖把前端状态快照写回服务端（原型桥接接口 PUT /api/state） */
    pushState: function (state) {
      if (this.mode !== 'server') return;
      // Keep a local shadow copy until the server confirms the write, so a
      // refresh/close inside the debounce window cannot lose the change.
      try { localStorage.setItem(SHADOW_KEY, JSON.stringify(snapshot(state))); } catch (e) { /* ignore */ }
      clearTimeout(this._timer);
      var self = this;
      this._timer = setTimeout(function () { self._push(state); }, cfg.syncDebounce || 450);
    },

    _push: function (state, attempt) {
      if (this.mode !== 'server') return;
      if (this._pushing) { this._dirty = true; return; }
      attempt = attempt || 0;
      var self = this;
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      ctrl && (ctrl._cancelled = false);
      this._controller = ctrl;
      var timedOut = setTimeout(function () {
        if (ctrl && !ctrl._cancelled) { try { ctrl.abort(); } catch (e) { /* ignore */ } }
      }, 10000);

      this._pushing = true;
      this.status = '正在同步数据…';
      this.updateBadges();
      this.request('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot(state)),
        signal: ctrl ? ctrl.signal : signal(10000)
      }).then(function () {
        self.status = '数据已同步';
        self.lastError = '';
        self._retries = 0;
        try { localStorage.removeItem(SHADOW_KEY); } catch (e) { /* ignore */ }
      }).catch(function (e) {
        clearTimeout(timedOut);
        if (ctrl && ctrl._cancelled) return;   // intentionally cancelled by refresh()
        var reason = (e && e.message) || '同步失败';
        self.lastError = reason;
        if (reason.indexOf('HTTP 401') === 0) return;   // session expired; do not retry
        var next = attempt + 1;
        if (next <= MAX_RETRIES) {
          self._retries = next;
          self.status = '同步失败，正在重试（' + next + '/' + MAX_RETRIES + '）';
          var delay = Math.min(30000, 1000 * Math.pow(2, attempt));
          setTimeout(function () { self._push(TR.Store.state, next); }, delay);
        } else {
          self.status = '同步失败，数据已保存在本地';
          if (TR.toast) TR.toast('数据同步失败，已保存在本地，稍后会自动重试', 'warn');
        }
      }).then(function () {
        clearTimeout(timedOut);
        self._pushing = false;
        self._controller = null;
        self.updateBadges();
        if (self._dirty) { self._dirty = false; self.pushState(TR.Store.state); }
      });
    },

    /** 页面隐藏/卸载前尽力冲刷一次；失败时影子副本留到下次启动重推 */
    flushOnHide: function () {
      if (this.mode !== 'server') return;
      var pending = null;
      try { pending = localStorage.getItem(SHADOW_KEY); } catch (e) { return; }
      if (!pending) return;
      clearTimeout(this._timer);
      this._timer = null;
      this._push(TR.Store.state);
    },

    /** 启动后发现上次未同步的影子副本，立即重推 */
    resumePending: function () {
      if (this.mode !== 'server') return;
      var pending = null;
      try { pending = localStorage.getItem(SHADOW_KEY); } catch (e) { return; }
      if (pending) this._push(TR.Store.state);
    },

    /** 注册账号：写入服务端用户表，返回 { id, name, email, company, token } */
    authRegister: function (payload) {
      var self = this;
      return this.request('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name, email: payload.email,
          password: payload.password, company: payload.company || ''
        }), timeout: 12000
      }).then(function (u) { return { ok: true, user: u }; })
        .catch(function (e) { return self._authFail(e); });
    },

    /** 登录：校验 PBKDF2 密码哈希；demo@caitan.ai 由后端懒创建，便于一键体验 */
    authLogin: function (payload) {
      var self = this;
      return this.request('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.password }), timeout: 12000
      }).then(function (u) { return { ok: true, user: u }; })
        .catch(function (e) { return self._authFail(e); });
    },

    _authFail: function (e) {
      var msg = (e && e.message) || '认证失败';
      // HTTP 400/409 的错误正文里带有后端给出的中文原因
      var m = msg.match(/HTTP \d+ · (.+)$/);
      return { ok: false, error: m ? m[1] : msg };
    },

    /** 上传简历交给后端解析（PDF / DOCX / TXT）；失败时由调用方降级到本地演示解析 */
    uploadResume: function (file) {
      var self = this, fd = new FormData();
      fd.append('file', file, file.name);
      return this.request('/api/candidates/upload', { method: 'POST', body: fd, timeout: 20000 })
        .then(function (c) {
          return self.refresh().then(function () { return { ok: true, candidate: c }; });
        })
        .catch(function (e) { return { ok: false, error: (e && e.message) || '上传失败' }; });
    },

    /** 调用后端采集任务，返回新增岗位 */
    collect: function (sourceId) {
      var self = this;
      return this.request('/api/jobs/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: sourceId || null }),
        timeout: 20000
      }).then(function (jobs) {
        return self.refresh().then(function () {
          return { ok: true, jobs: Array.isArray(jobs) ? jobs : [] };
        });
      }).catch(function (e) { return { ok: false, error: (e && e.message) || '采集失败' }; });
    },

    /** 扫描全网公开职位池，把与候选人最匹配的 Top N 岗位捞入岗位库 */
    marketImport: function (candidateId, topN) {
      var self = this;
      var q = '?candidateId=' + encodeURIComponent(candidateId) + '&topN=' + (topN || 100);
      return this.request('/api/matches/market/import' + q, { method: 'POST', timeout: 20000 })
        .then(function (data) {
          return self.refresh().then(function () { return { ok: true, data: data }; });
        })
        .catch(function (e) { return { ok: false, error: (e && e.message) || '全网捞取失败' }; });
    },

    /** 后端生成并保存推送记录（MAIL_ENABLED=false 时只落库、不连 SMTP） */
    sendMail: function (payload) {
      var self = this;
      return this.request('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 20000
      }).then(function (mail) {
        return self.refresh().then(function () { return { ok: true, mail: mail }; });
      }).catch(function (e) { return { ok: false, error: (e && e.message) || '发送失败' }; });
    },

    /** 服务端重置为初始种子数据 */
    reset: function () {
      var self = this;
      this.cancelPush();
      return this.request('/api/reset', { method: 'POST', timeout: 10000 })
        .then(function (snap) {
          TR.Store.replace(snap);
          return { ok: true };
        })
        .catch(function (e) { return { ok: false, error: (e && e.message) || '重置失败' }; });
    },

    reconnect: function () {
      try { sessionStorage.removeItem(FORCE_DEMO_KEY); } catch (e) { /* ignore */ }
      this._initPromise = null;
      return this.ready();
    },

    forceDemo: function () {
      try { sessionStorage.setItem(FORCE_DEMO_KEY, '1'); } catch (e) { /* ignore */ }
      this.cancelPush();
      this.mode = 'demo';
      this.serverInfo = null;
      this.storage = '本地存储';
      this.status = '演示数据（手动指定）';
      TR.Store.restoreLocal();
      this.updateBadges();
    },

    updateBadges: function () {
      var chip = document.getElementById('mode-chip');
      if (chip) {
        var dot = '<span class="pulse-dot"></span>';
        chip.innerHTML = this.mode === 'server'
          ? dot + ' 在线 · 数据已同步'
          : dot + ' 演示数据 · 本地存储';
        chip.style.background = this.mode === 'server' ? '#ECFDF5' : '';
        chip.style.borderColor = this.mode === 'server' ? '#A7F3D0' : '';
        chip.style.borderStyle = this.mode === 'server' ? 'solid' : '';
      }
      var pill = document.getElementById('service-pill');
      if (pill) {
        pill.innerHTML = this.mode === 'server'
          ? '<span class="pulse-dot"></span> 服务运行中'
          : '<span class="pulse-dot" style="background:#D97706;box-shadow:0 0 0 3px rgba(217,119,6,.14)"></span> 演示模式';
        pill.style.background = this.mode === 'server' ? '#ECFDF5' : '#FFFBEB';
        pill.style.borderColor = this.mode === 'server' ? '#D1FAE5' : '#FDE68A';
      }
      var nodes = document.querySelectorAll('[data-service-status]');
      Array.prototype.forEach.call(nodes, function (n) { n.textContent = api.status; });
      var details = document.querySelectorAll('[data-service-detail]');
      Array.prototype.forEach.call(details, function (n) {
        n.textContent = api.mode === 'server'
          ? api.displayBase() + ' · ' + api.status + (api.lastError ? ' · ' + api.lastError : '')
          : api.lastError ? ('未连接：' + api.lastError) : api.displayBase() + ' 服务未启动';
      });
      var errs = document.querySelectorAll('[data-service-error]');
      Array.prototype.forEach.call(errs, function (n) {
        n.textContent = api.lastError || '';
        n.style.display = api.lastError ? '' : 'none';
      });
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Best-effort flush before the page goes away. The shadow copy in
   * localStorage survives even if this request is cancelled, and
   * resumePending() replays it on the next load. */
  try {
    window.addEventListener('pagehide', function () { api.flushOnHide(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') api.flushOnHide();
    });
  } catch (e) { /* ignore */ }

  TR.api = api;
})(window.TR);
