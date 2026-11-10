/* 才探 TalentRadar · 登录 / 注册门禁
 *
 * - 服务模式：调用 Spring Boot 的 /api/auth/*，账号写入 MySQL，密码 PBKDF2 哈希
 * - 演示模式（file:// 或后端不可达）：账号仅存当前浏览器，内置演示账号始终可用
 * - 登录态存在 localStorage（记住我）或 sessionStorage；未登录时工作台完全隐藏
 */
window.TR = window.TR || {};

(function (TR) {
  'use strict';

  var SESSION_KEY = 'tr-auth-session';
  var DEMO_USERS_KEY = 'tr-demo-users';
  var DEMO = {
    email: 'demo@caitan.ai',
    password: '123456',
    name: '才探体验官',
    company: '才探演示团队'
  };

  function $(sel) { return document.querySelector(sel); }
  function val(sel) { var el = $(sel); return el ? el.value.trim() : ''; }
  function setText(sel, s) { var el = $(sel); if (el) el.textContent = s || ''; }
  function parse(s) { try { return JSON.parse(s || 'null'); } catch (e) { return null; } }
  function readLS(key) { try { return parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function writeLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  function initial(name) { return (String(name || 'U').trim().charAt(0) || 'U').toUpperCase(); }

  var tab = 'login';
  var busy = false;

  function getSession() {
    try {
      var s = parse(localStorage.getItem(SESSION_KEY));
      if (s && s.email) return s;
      s = parse(sessionStorage.getItem(SESSION_KEY));
      if (s && s.email) return s;
    } catch (e) { /* 隐私模式下忽略 */ }
    return null;
  }

  function saveSession(user, remember) {
    var s = {
      id: user.id || '', email: user.email, name: user.name || user.email.split('@')[0],
      company: user.company || '', token: user.token || '', mode: TR.api.mode,
      loginAt: new Date().toISOString()
    };
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(s));
    } catch (e) { /* ignore */ }
  }

  function renderUser(s) {
    setText('#side-user-name', s.name);
    setText('#side-user-role', s.company || '招聘负责人');
    setText('#side-avatar', initial(s.name));
    setText('#top-avatar', initial(s.name));
  }

  function applyGate() {
    var s = getSession();
    document.body.classList.toggle('auth-locked', !s);
    if (s) renderUser(s);
    return !!s;
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    location.reload();
  }

  /* ---------------- 表单 UI ---------------- */

  function showError(msg) {
    var el = $('#auth-error');
    if (el) { el.textContent = msg || '操作失败，请重试'; el.hidden = false; }
  }
  function clearError() {
    var el = $('#auth-error'); if (el) el.hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll('.auth-input.invalid'), function (n) { n.classList.remove('invalid'); });
  }
  function setBusy(on) {
    busy = on;
    var btn = $('#auth-submit'), demo = $('#auth-demo');
    if (btn) { btn.disabled = on; btn.textContent = on ? '请稍候…' : (tab === 'login' ? '登录' : '创建账号'); }
    if (demo) demo.disabled = on;
  }

  function switchTab(next) {
    tab = next;
    Array.prototype.forEach.call(document.querySelectorAll('[data-auth-tab]'), function (b) {
      b.classList.toggle('on', b.dataset.authTab === next);
    });
    var reg = next === 'register';
    ['#field-name', '#field-company', '#field-confirm'].forEach(function (sel) {
      var el = $(sel); if (el) el.hidden = !reg;
    });
    setText('#auth-title', reg ? '创建你的账号' : '欢迎回来');
    setText('#auth-subtitle', reg ? '30 秒开启才探智能招聘工作台' : '登录你的才探工作台，继续发现合适的人');
    var submit = $('#auth-submit'); if (submit) submit.textContent = reg ? '创建账号' : '登录';
    var pwd = $('#auth-password'); if (pwd) pwd.setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
    clearError();
  }

  /* ---------------- 演示模式账号（本地） ---------------- */

  function localUsers() {
    var list = readLS(DEMO_USERS_KEY);
    return Array.isArray(list) ? list : [];
  }

  function localAuth(kind, payload) {
    var users = localUsers();
    var email = payload.email;
    if (kind === 'register') {
      if (email === DEMO.email || users.some(function (u) { return u.email === email; })) {
        return Promise.resolve({ ok: false, error: '该邮箱已注册，请直接登录' });
      }
      var user = {
        id: 'local' + Date.now(), email: email, name: payload.name || email.split('@')[0],
        company: payload.company || '', password: payload.password
      };
      users.push(user); writeLS(DEMO_USERS_KEY, users);
      return Promise.resolve({ ok: true, user: { id: user.id, email: email, name: user.name, company: user.company, token: 'demo' } });
    }
    var found = null;
    if (email === DEMO.email && payload.password === DEMO.password) {
      found = { id: 'demo-local', email: DEMO.email, name: DEMO.name, company: DEMO.company, token: 'demo' };
    } else {
      var u = users.filter(function (x) { return x.email === email; })[0];
      if (u && u.password === payload.password) {
        found = { id: u.id, email: u.email, name: u.name, company: u.company, token: 'demo' };
      }
    }
    return Promise.resolve(found
      ? { ok: true, user: found }
      : { ok: false, error: '邮箱或密码不正确，请重试' });
  }

  /* ---------------- 认证动作 ---------------- */

  function doAuth(kind, payload, remember) {
    setBusy(true); clearError();
    return TR.api.ready().then(function () {
      if (TR.api.mode === 'server') {
        var call = kind === 'login' ? TR.api.authLogin(payload) : TR.api.authRegister(payload);
        return call;
      }
      return localAuth(kind, payload);
    }).then(function (res) {
      setBusy(false);
      if (!res || !res.ok) { showError((res && res.error) || '认证失败，请重试'); return; }
      saveSession(res.user, remember);
      location.reload();
    }).catch(function (e) {
      setBusy(false);
      showError((e && e.message) || '认证失败，请重试');
    });
  }

  function validate(kind, payload) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.email || !emailRe.test(payload.email)) return { msg: '请输入有效的邮箱地址', sel: '#auth-email' };
    if (!payload.password || payload.password.length < 6) return { msg: '密码至少 6 位', sel: '#auth-password' };
    if (kind === 'register') {
      if (!payload.name) return { msg: '请输入姓名', sel: '#auth-name' };
      if (payload.password !== payload.confirm) return { msg: '两次输入的密码不一致', sel: '#auth-confirm' };
    }
    return null;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    var payload = {
      email: val('#auth-email').toLowerCase(), password: val('#auth-password'),
      name: val('#auth-name'), company: val('#auth-company'), confirm: val('#auth-confirm')
    };
    var bad = validate(tab, payload);
    if (bad) {
      var el = $(bad.sel); if (el) el.classList.add('invalid');
      showError(bad.msg); return;
    }
    var remember = !!($('#auth-remember') && $('#auth-remember').checked);
    doAuth(tab, payload, remember);
  }

  function demoLogin() {
    if (busy) return;
    var emailEl = $('#auth-email'), pwdEl = $('#auth-password');
    if (emailEl) emailEl.value = DEMO.email;
    if (pwdEl) pwdEl.value = DEMO.password;
    doAuth('login', { email: DEMO.email, password: DEMO.password }, true);
  }

  /* ---------------- 事件绑定与启动 ---------------- */

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-auth-tab],[data-auth-eye],[data-auth-forgot]') : null;
    if (!t) return;
    if (t.dataset.authTab) { switchTab(t.dataset.authTab); return; }
    if (t.dataset.authEye) {
      var pwd = $('#auth-password');
      if (pwd) { var show = pwd.type === 'password'; pwd.type = show ? 'text' : 'password'; t.textContent = show ? '隐藏' : '显示'; }
      return;
    }
    if (t.dataset.authForgot) {
      e.preventDefault();
      showError('密码找回功能暂未开放，请联系管理员');
    }
  });

  var form = $('#auth-form');
  if (form) form.addEventListener('submit', onSubmit);
  var demoBtn = $('#auth-demo');
  if (demoBtn) demoBtn.addEventListener('click', demoLogin);
  Array.prototype.forEach.call(document.querySelectorAll('.auth-input'), function (input) {
    input.addEventListener('input', function () { input.classList.remove('invalid'); clearError(); });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { /* form 会统一提交 */ } });
  });

  applyGate();

  TR.auth = {
    applyGate: applyGate,
    isAuthed: function () { return !!getSession(); },
    session: getSession,
    logout: logout,
    demoAccount: DEMO
  };
})(window.TR);
