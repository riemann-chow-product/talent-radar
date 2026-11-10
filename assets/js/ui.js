/* 才探 TalentRadar · UI 组件层：图标、图表、弹层、提示 */
window.TR = window.TR || {};

(function (TR) {
  'use strict';

  var P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6.4-6.4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/><path d="M5 15l.6 1.6L7.2 17l-1.6.6L5 19l-.6-1.4L2.8 17l1.6-.4L5 15z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.09A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.72 15a1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.72a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.14.62.68 1.07 1.31 1.09H21a2 2 0 1 1 0 4h-.09a1.6 1.6 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    upload: '<path d="M16 16l-4-4-4 4M12 12v9"/><path d="M20.4 14.5A5 5 0 0 0 18 5h-1.3A8 8 0 1 0 3 12.8"/><path d="M4 20h16"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M21 2v6h-6M3 22v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L21 8M21 16a9 9 0 0 1-14.9 3.4L3 16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    arrowUp: '<path d="M7 17L17 7M8 7h9v9"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.3 2.3 4.7-4.7"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h14v4zM3 5v14a2 2 0 0 0 2 2h16V7H5"/><path d="M16 14h2"/>',
    cap: '<path d="M22 9L12 4 2 9l10 5 10-5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/>',
    rss: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    play: '<path d="M7 4l12 8-12 8V4z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6l3.5-7z"/>',
    reply: '<path d="M9 17l-6-5 6-5"/><path d="M3 12h10a6 6 0 0 1 6 6v2"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1L11 5"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1L13 19"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    more: '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
  };

  function icon(name, size, extra) {
    var s = size || 16;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="' + s + '" height="' + s + '"' + (extra ? ' class="' + extra + '"' : '') + '>' + (P[name] || P.info) + '</svg>';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    var ic = type === 'error' ? 'alert' : type === 'warn' ? 'alert' : type === 'info' ? 'info' : 'checkCircle';
    t.innerHTML = icon(ic, 16) + '<span>' + esc(msg) + '</span>';
    root.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 2800);
  }

  function closeOverlay() {
    document.getElementById('drawer-root').innerHTML = '';
    document.getElementById('modal-root').innerHTML = '';
  }

  function openDrawer(opts) {
    var root = document.getElementById('drawer-root');
    root.innerHTML = '<div class="mask" data-close="1"></div>' +
      '<div class="drawer-panel">' +
        '<div class="drawer-head"><div><div class="drawer-title">' + esc(opts.title || '') + '</div>' +
        (opts.subtitle ? '<div class="card-sub">' + esc(opts.subtitle) + '</div>' : '') + '</div>' +
        '<button class="icon-btn" data-close="1" aria-label="关闭">' + icon('x', 18) + '</button></div>' +
        '<div class="drawer-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="drawer-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    root.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = closeOverlay; });
    if (opts.onMount) opts.onMount(root);
  }

  function openModal(opts) {
    var root = document.getElementById('modal-root');
    root.innerHTML = '<div class="mask" data-close="1"></div>' +
      '<div class="modal-panel">' +
        '<div class="modal-head">' + esc(opts.title || '') + '</div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    root.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = closeOverlay; });
    if (opts.onMount) opts.onMount(root);
  }

  function confirmModal(title, text, onOk, okLabel) {
    openModal({
      title: title,
      body: '<div class="text-sm" style="color:var(--text-2);line-height:1.75;padding:4px 0 10px">' + text + '</div>',
      footer: '<button class="btn btn-outline" data-close="1">取消</button>' +
              '<button class="btn btn-primary" id="confirm-ok">' + esc(okLabel || '确认') + '</button>',
      onMount: function (root) {
        root.querySelector('.modal-foot .btn-outline').onclick = closeOverlay;
        root.querySelector('#confirm-ok').onclick = function () { closeOverlay(); onOk(); };
      }
    });
  }

  /* SVG 双系列折线图 */
  function lineChart(data) {
    var W = 640, H = 200, L = 36, R = 12, T = 14, B = 28;
    var max = 10;
    data.forEach(function (d) { max = Math.max(max, d.matches, d.pushes); });
    max = Math.ceil(max * 1.18 / 5) * 5;
    var iw = W - L - R, ih = H - T - B;
    function x(i) { return L + (data.length === 1 ? iw / 2 : iw * i / (data.length - 1)); }
    function y(v) { return T + ih - (v / max) * ih; }
    function path(key) {
      return data.map(function (d, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d[key]).toFixed(1); }).join(' ');
    }
    var grid = '', i;
    for (i = 0; i <= 4; i++) {
      var gy = T + ih * i / 4;
      var gv = Math.round(max * (4 - i) / 4);
      grid += '<line x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '" stroke="#EEF1F7" stroke-width="1"/>' +
              '<text x="' + (L - 9) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#939DAD">' + gv + '</text>';
    }
    var xlabels = data.map(function (d, i) {
      return '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10.5" fill="#939DAD">' + esc(d.date) + '</text>';
    }).join('');
    var area = path('matches') + ' L' + x(data.length - 1).toFixed(1) + ' ' + (T + ih) + ' L' + x(0).toFixed(1) + ' ' + (T + ih) + ' Z';
    var dotsM = data.map(function (d, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.matches).toFixed(1) + '" r="3.4" fill="#fff" stroke="#4F46E5" stroke-width="2"/>'; }).join('');
    var dotsP = data.map(function (d, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.pushes).toFixed(1) + '" r="2.8" fill="#fff" stroke="#0891B2" stroke-width="2"/>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="近 7 天匹配与推送趋势">' +
      '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#6366F1" stop-opacity=".20"/><stop offset="100%" stop-color="#6366F1" stop-opacity="0"/>' +
      '</linearGradient></defs>' + grid +
      '<path d="' + area + '" fill="url(#areaGrad)"/>' +
      '<path d="' + path('matches') + '" fill="none" stroke="#4F46E5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + path('pushes') + '" fill="none" stroke="#0891B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 4"/>' +
      dotsM + dotsP + xlabels + '</svg>';
  }

  function ring(score, small) {
    var color = score >= 85 ? '#4F46E5' : score >= 70 ? '#0891B2' : score >= 60 ? '#D97706' : '#939DAD';
    return '<div class="ring' + (small ? ' sm' : '') + '" style="--p:' + score + ';--c:' + color + '"><span>' + score + '</span></div>';
  }

  function emptyState(ic, title, sub) {
    return '<div class="empty">' + icon(ic, 40) + '<div class="empty-title">' + esc(title) + '</div>' +
      (sub ? '<div class="empty-sub">' + esc(sub) + '</div>' : '') + '</div>';
  }

  var sourceMeta = {
    '企业官网': { cls: 'tag-primary', icon: 'globe', color: '#EEF0FF|#4F46E5' },
    '微信公众号': { cls: 'tag-green', icon: 'message', color: '#ECFDF5|#059669' },
    '招聘平台': { cls: 'tag-cyan', icon: 'briefcase', color: '#ECFEFF|#0891B2' }
  };
  function sourceTag(s) {
    var m = sourceMeta[s] || sourceMeta['招聘平台'];
    return '<span class="tag ' + m.cls + '">' + icon(m.icon, 12) + esc(s) + '</span>';
  }
  function sourceColor(s) {
    var m = sourceMeta[s] || sourceMeta['招聘平台'];
    return m.color.split('|');
  }

  var mailStatus = {
    sent: { label: '已送达', cls: 'tag-primary' },
    opened: { label: '已查看', cls: 'tag-cyan' },
    replied: { label: '已回复', cls: 'tag-green' },
    failed: { label: '发送失败', cls: 'tag-red' },
    draft: { label: '草稿', cls: 'tag-gray' }
  };
  function mailTag(s) {
    var m = mailStatus[s] || mailStatus.sent;
    return '<span class="tag ' + m.cls + '"><span class="dot"></span>' + m.label + '</span>';
  }
  var candStatus = {
    parsed: { label: '已解析', cls: 'tag-gray' },
    matched: { label: '已匹配', cls: 'tag-primary' },
    pushed: { label: '已推送', cls: 'tag-green' }
  };
  function candTag(s) {
    var m = candStatus[s] || candStatus.parsed;
    return '<span class="tag ' + m.cls + '"><span class="dot"></span>' + m.label + '</span>';
  }

  function avatar(name, size) {
    var c = TR.colorOf(name);
    var cls = size === 'lg' ? 'avatar avatar-lg' : size === 'sm' ? 'avatar avatar-sm' : 'avatar';
    return '<div class="' + cls + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name.slice(0, 1)) + '</div>';
  }
  function jobLogo(company) {
    var c = TR.colorOf(company);
    return '<div class="job-logo" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(company.slice(0, 1)) + '</div>';
  }

  function feedIcon(type) {
    var map = {
      mail: ['mail', '#EEF0FF', '#4F46E5'],
      parse: ['file', '#ECFDF5', '#059669'],
      crawl: ['radar', '#ECFEFF', '#0891B2'],
      match: ['sparkles', '#F5F3FF', '#7C3AED'],
      reply: ['reply', '#FFFBEB', '#D97706']
    };
    var m = map[type] || map.match;
    return '<div class="feed-icon" style="background:' + m[1] + ';color:' + m[2] + '">' + icon(m[0], 15) + '</div>';
  }

  TR.icon = icon;
  TR.esc = esc;
  TR.toast = toast;
  TR.openDrawer = openDrawer;
  TR.openModal = openModal;
  TR.confirmModal = confirmModal;
  TR.closeOverlay = closeOverlay;
  TR.lineChart = lineChart;
  TR.ring = ring;
  TR.emptyState = emptyState;
  TR.sourceTag = sourceTag;
  TR.sourceColor = sourceColor;
  TR.mailTag = mailTag;
  TR.candTag = candTag;
  TR.avatar = avatar;
  TR.jobLogo = jobLogo;
  TR.feedIcon = feedIcon;
})(window.TR);
