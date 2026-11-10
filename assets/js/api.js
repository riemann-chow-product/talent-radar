/* 才探 TalentRadar · 后端 API 客户端与「演示 / 服务」双模式切换
 *
 * demo   —— 纯静态原型，数据写入浏览器 localStorage，可 file:// 直接打开
 * server —— Spring Boot + MySQL，数据来自 /api/bootstrap，变更回写 /api/state
 *
 * 写入类动作（上传简历 / 采集 / 发信）走后端细粒度 REST，成功后重新拉取
 * 全量快照并取消尚未发出的旧快照推送，避免前端过期数据覆盖后端刚写入的记录。
 */
window.TR = window.TR || {};

(function (TR) {
  'use strict';

  var cfg = window.TR_CONFIG || {};
  var FORCE_DEMO_KEY = 'tr-force-demo';

  function signal(ms) {
    return (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(ms) : undefined;
  }

  var api = {
    mode: 'demo',              // demo = localStorage | server = Spring Boot + MySQL
    // 空串是有效配置（与页面同源），不能用 || 兜底吞掉，否则局域网访问会连到客户端自己的 localhost
    base: cfg.apiBase == null ? 'http://localhost:8080' : cfg.apiBase,
    autoDetect: cfg.autoDetect !== false,
    status: '正在检测后端服务…',
    storage: '浏览器 localStorage',
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

    /** 通用请求：非 2xx 抛出带响应正文的 Error */
    request: function (path, opts) {
      opts = opts || {};
      var init = {
        method: opts.method || 'GET',
        headers: opts.headers || {},
        signal: signal(opts.timeout || 6000)
      };
      if (opts.body !== undefined) init.body = opts.body;
      return fetch(this.url(path, opts.base), init).then(function (r) {
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
        this.storage = '浏览器 localStorage';
        this.status = location.protocol === 'file:' ? '演示模式（本地文件打开）' : '演示模式（手动指定）';
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
            self.storage = (h && h.storage === 'MySQL') ? 'MySQL 数据库'
              : (h && h.storage) || '后端服务';
            self.lastError = '';
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
          self.status = '已连接 · ' + self.storage;
          self.updateBadges();
          return true;
        })
        .catch(function (e) {
          self.mode = 'demo';
          self.serverInfo = null;
          self.storage = '浏览器 localStorage';
          self.lastError = self._probeError || (e && e.message) || '后端不可达';
          self.status = '后端未启动，已降级为演示模式';
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
    },

    /** 防抖把前端状态快照写回 MySQL（原型桥接接口 PUT /api/state） */
    pushState: function (state) {
      if (this.mode !== 'server') return;
      clearTimeout(this._timer);
      var self = this;
      this._timer = setTimeout(function () { self._push(state); }, cfg.syncDebounce || 450);
    },

    _push: function (state) {
      if (this.mode !== 'server') return;
      if (this._pushing) { this._dirty = true; return; }
      var self = this;
      this._pushing = true;
      this.status = '正在同步到 ' + this.storage + '…';
      this.updateBadges();
      var payload = {
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
      this.request('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 10000
      }).then(function () {
        self.status = '已同步 · ' + self.storage;
        self.lastError = '';
      }).catch(function (e) {
        self.status = '同步失败，本地副本已保留';
        self.lastError = (e && e.message) || '同步失败';
      }).then(function () {
        self._pushing = false;
        self.updateBadges();
        if (self._dirty) { self._dirty = false; self.pushState(TR.Store.state); }
      });
    },

    /** 注册账号：写入 MySQL users 表，返回 { id, name, email, company, token } */
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
      this.storage = '浏览器 localStorage';
      this.status = '演示模式（手动指定）';
      TR.Store.restoreLocal();
      this.updateBadges();
    },

    updateBadges: function () {
      var chip = document.getElementById('mode-chip');
      if (chip) {
        var dot = '<span class="pulse-dot"></span>';
        chip.innerHTML = this.mode === 'server'
          ? dot + ' 服务模式 · ' + esc(this.storage)
          : dot + ' 演示模式 · 数据本地存储';
        chip.style.background = this.mode === 'server' ? '#ECFDF5' : '';
        chip.style.borderColor = this.mode === 'server' ? '#A7F3D0' : '';
        chip.style.borderStyle = this.mode === 'server' ? 'solid' : '';
      }
      var pill = document.getElementById('service-pill');
      if (pill) {
        pill.innerHTML = this.mode === 'server'
          ? '<span class="pulse-dot"></span> 已连接 Spring Boot'
          : '<span class="pulse-dot" style="background:#D97706;box-shadow:0 0 0 3px rgba(217,119,6,.14)"></span> 演示模式';
        pill.style.background = this.mode === 'server' ? '#ECFDF5' : '#FFFBEB';
        pill.style.borderColor = this.mode === 'server' ? '#D1FAE5' : '#FDE68A';
      }
      var nodes = document.querySelectorAll('[data-service-status]');
      Array.prototype.forEach.call(nodes, function (n) { n.textContent = api.status; });
      var details = document.querySelectorAll('[data-service-detail]');
      Array.prototype.forEach.call(details, function (n) {
        n.textContent = api.mode === 'server'
          ? api.displayBase() + ' · ' + api.storage + (api.lastError ? ' · ' + api.lastError : '')
          : api.lastError ? ('未连接：' + api.lastError) : api.displayBase() + ' 未启动';
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

  TR.api = api;
})(window.TR);
