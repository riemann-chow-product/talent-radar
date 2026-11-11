/* 才探 TalentRadar · 应用入口：路由、事件与业务流程 */
(function (TR) {
  'use strict';

  var esc = TR.esc, icon = TR.icon, Store = TR.Store;
  var U = TR.ui;

  var NAV = [
    { group: '工作台', items: [{ id: 'dashboard', label: '总览', icon: 'dashboard' }] },
    { group: '招聘业务', items: [
      { id: 'candidates', label: '简历库', icon: 'users', badge: 'candidates' },
      { id: 'jobs', label: '岗位雷达', icon: 'briefcase', badge: 'jobs' },
      { id: 'matching', label: '智能匹配', icon: 'target' },
      { id: 'letters', label: '推荐语工坊', icon: 'sparkles' },
      { id: 'mails', label: '推送记录', icon: 'inbox', badge: 'mails' }
    ] },
    { group: '系统配置', items: [
      { id: 'sources', label: '数据源', icon: 'layers' },
      { id: 'settings', label: '系统设置', icon: 'settings' }
    ] }
  ];
  var META = {
    dashboard: ['工作台', '总览'], candidates: ['招聘业务', '简历库'], jobs: ['招聘业务', '岗位雷达'],
    matching: ['招聘业务', '智能匹配'], letters: ['招聘业务', '推荐语工坊'], mails: ['招聘业务', '推送记录'],
    sources: ['系统配置', '数据源'], settings: ['系统配置', '系统设置']
  };

  /* ---------------- 渲染 ---------------- */
  var currentRendered = null;

  function renderNav() {
    var st = Store.state;
    var html = NAV.map(function (g) {
      return '<div class="nav-group"><div class="nav-label">' + g.group + '</div>' +
        g.items.map(function (it) {
          var n = it.badge ? st[it.badge].length : null;
          return '<button class="nav-item ' + (U.page === it.id ? 'active' : '') + '" data-action="goto" data-page="' + it.id + '">' +
            '<span class="nav-icon">' + icon(it.icon, 18) + '</span>' + it.label +
            (n !== null ? '<span class="nav-badge">' + n + '</span>' : '') + '</button>';
        }).join('') + '</div>';
    }).join('');
    document.getElementById('nav').innerHTML = html;
    document.getElementById('crumb').innerHTML = esc(META[U.page][0]) + ' <span>/</span> <b>' + esc(META[U.page][1]) + '</b>';
  }

  function render(opts) {
    opts = opts || {};
    var y = window.scrollY;
    document.getElementById('view').innerHTML = TR.views[U.page]();
    currentRendered = U.page;
    renderNav();
    bindPage();
    if (!opts.keepScroll) window.scrollTo(0, 0);
    else window.scrollTo(0, y);
  }

  function go(page) {
    if (!TR.views[page]) return;
    U.page = page;
    document.getElementById('sidebar').classList.remove('open');
    if (location.hash !== '#/' + page) location.hash = '#/' + page;
    render();
  }

  function restoreFocus(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.focus();
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* search/type=number */ }
  }

  /* ---------------- 页面内绑定 ---------------- */
  function bindPage() {
    var dz = document.getElementById('dropzone');
    if (dz) {
      dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', function () { dz.classList.remove('dragover'); });
      dz.addEventListener('drop', function (e) {
        e.preventDefault(); dz.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      });
    }
    var bell = document.getElementById('btn-bell');
    if (bell) bell.innerHTML = icon('bell', 17) + '<span class="bell-dot"></span>';
    var searchIcon = document.getElementById('search-icon');
    if (searchIcon) searchIcon.innerHTML = icon('search', 15);
    var menu = document.getElementById('btn-menu');
    if (menu) menu.innerHTML = icon('menu', 18);
    var shortcut = document.getElementById('btn-settings-shortcut');
    if (shortcut) shortcut.innerHTML = icon('settings', 16);
    var logout = document.getElementById('btn-logout');
    if (logout) logout.innerHTML = icon('logout', 16);
  }

  /* ---------------- 简历上传与解析 ---------------- */
  var SKILL_HINT = ['沟通协作', '项目管理', '数据分析'];

  function handleFiles(files) {
    var arr = Array.prototype.slice.call(files || []);
    if (!arr.length) return;
    if (U.page !== 'candidates') { go('candidates'); }
    var queue = document.getElementById('upload-queue');
    var items = [];
    arr.forEach(function (f, i) {
      var id = 'uf-' + Date.now() + '-' + i;
      items.push({ id: id, file: f });
      if (queue) queue.insertAdjacentHTML('beforeend',
        '<div class="upload-file" id="' + esc(id) + '"><div class="file-ic" style="background:#EEF0FF;color:#4F46E5">' + icon('file', 15) + '</div>' +
        '<div class="grow"><div class="file-name">' + esc(f.name) + '</div><div class="file-state">等待 AI 解析…</div></div>' +
        '<span class="spinner"></span></div>');
    });
    var done = 0;
    items.forEach(function (it, i) {
      setTimeout(function () {
        var node = document.getElementById(it.id);
        if (node) node.querySelector('.file-state').textContent = 'AI 正在提取技能、经验与求职意向…';
      }, 260 + i * 180);
      setTimeout(function () {
        createCandidateFromFile(it.file, function () {
          done += 1;
          var node2 = document.getElementById(it.id);
          if (node2) {
            node2.querySelector('.file-state').textContent = '解析完成，已加入人才库';
            node2.querySelector('.file-state').style.color = 'var(--green)';
            node2.querySelector('.spinner').outerHTML = '<span style="color:var(--green)">' + icon('checkCircle', 16) + '</span>';
          }
          if (done === items.length) {
            setTimeout(function () {
              render({ keepScroll: true });
              TR.toast('已解析 ' + items.length + ' 份简历并生成人才画像');
            }, 420);
          }
        });
      }, 1250 + i * 420);
    });
  }

  /** 在线模式交给服务端解析（PDF/DOCX/TXT）；解析失败自动降级到本地演示解析 */
  function createCandidateFromFile(file, done) {
    if (TR.api && TR.api.mode === 'server') {
      TR.api.uploadResume(file).then(function (res) {
        if (!res.ok) {
          localCreateCandidate(file);
          TR.toast('后端解析失败，已降级为本地演示解析：' + res.error, 'warn');
        } else {
          TR.toast('简历解析完成，已写入人才库', 'info');
        }
        if (done) done();
      });
      return;
    }
    localCreateCandidate(file);
    if (done) done();
  }

  function localCreateCandidate(file) {
    var st = Store.state;
    var base = file.name.replace(/\.[^.]+$/, '');
    var name = base.split(/[_\-\s（(【]/)[0].replace(/简历|个人|求职|应聘|的/g, '').trim();
    if (!name || name.length > 10) name = '新候选人' + (st.candidates.length + 1);
    var j = st.jobs[(st.seq + file.name.length) % st.jobs.length];
    var skills = j.tags.slice(0, 5).concat(SKILL_HINT.slice(0, 1));
    var years = j.minYears + (file.name.length % 3);
    var min = j.minSalary - 3, max = j.minSalary + 12;
    st.candidates.unshift({
      id: Store.uid('c'), name: name,
      title: j.title.replace(/高级|资深|高级|AI /g, '') || '研发工程师',
      years: years, education: j.minEdu === '硕士' ? '硕士' : '本科',
      school: '待补充', city: j.city, salary: min + '-' + max + 'K',
      phone: '1' + (3 + file.name.length % 6) + '****' + (1000 + file.name.length * 7) % 10000,
      email: 'candidate' + st.seq + '@example.com',
      skills: skills, status: 'parsed', resume: file.name,
      intent: '期望在' + j.city + '从事' + j.title + '相关工作，关注技术成长与业务落地',
      highlight: '具备 ' + j.tags.slice(0, 2).join('、') + ' 项目落地经验，曾主导核心模块从设计到上线的完整交付',
      uploadedAt: new Date().toISOString()
    });
    Store.log('parse', 'AI 完成简历解析：<b>' + esc(file.name) + '</b>，抽取 ' + skills.length + ' 项技能');
    Store.addLog('[parse] ' + file.name + ' → ' + skills.length + ' skills extracted');
    Store.bumpTrend('matches', 2);
    Store.save();
  }

  /* ---------------- 岗位采集 ---------------- */
  /** 在线模式调用服务端采集任务；失败时降级到本地演示采集 */
  function crawl(source) {
    if (TR.api && TR.api.mode === 'server') {
      TR.api.collect(source ? source.id : null).then(function (res) {
        if (!res.ok) {
          localCrawl(source);
          TR.toast('后端采集失败，已降级为演示采集：' + res.error, 'warn');
          return;
        }
        render({ keepScroll: true });
        TR.toast((source ? esc(source.name) : '全网') + ' 采集完成，后端新增 ' + res.jobs.length + ' 个岗位');
      });
      return;
    }
    localCrawl(source);
  }

  function localCrawl(source) {
    var st = Store.state;
    var n = 1 + (Date.now() % 3);
    var type = source ? source.type : ['企业官网', '微信公众号', '招聘平台'][Date.now() % 3];
    /* 采集结果使用已校验的真实公开 JD 池，不再编造不存在的职位链接 */
    var pool = TR.realJobs || [];
    if (!pool.length) { TR.toast('真实 JD 池未加载，暂时无法采集', 'warn'); return; }
    var added = [];
    for (var i = 0; i < n; i++) {
      var tpl = pool[(st.seq + i * 3) % pool.length];
      var j = JSON.parse(JSON.stringify(tpl));
      j.id = Store.uid('j');
      j.source = tpl.source || type;
      j.sourceName = tpl.sourceName || (source ? source.name : '全网即时采集');
      j.url = tpl.url || '';
      j.collectedAt = new Date().toISOString();
      j.publishedAt = new Date(Date.now() - (2 + i) * 3600000).toISOString();
      st.jobs.unshift(j);
      added.push(j);
    }
    if (source) {
      source.lastRun = new Date().toISOString();
      source.count += n;
      source.status = 'ok';
    } else {
      st.sources.forEach(function (s) { if (s.enabled) { s.lastRun = new Date().toISOString(); s.count += n; } });
    }
    Store.log('crawl', (source ? '<b>' + esc(source.name) + '</b>' : '全网采集') + '完成，新增 <b>' + n + '</b> 个岗位');
    Store.addLog('[' + (source ? '采集' : 'scheduler') + '] ' + (source ? source.name : 'all sources') + ' → ' + n + ' jobs, dedupe 1');
    Store.bumpTrend('matches', n * 2);
    Store.save();
    render({ keepScroll: true });
    TR.toast((source ? esc(source.name) : '全网') + ' 采集完成，新增 ' + n + ' 个岗位');
  }

  /* ---------------- 全网职位池：演示模式本地捞取 ---------------- */
  /** 与服务端 importMarketTop 等价：扫描全网池 → 五维打分 → 取最匹配 Top N → 去重入库 */
  function localMarketScan(candidateId, topN) {
    var st = Store.state, pool = TR.marketJobs || [];
    if (!pool.length) { TR.toast('全网职位池未加载', 'warn'); return; }
    var c = Store.candidate(candidateId);
    var ranked = TR.diversify(pool.map(function (j) {
      var m = TR.matchScore(c, j);
      return { job: j, score: m.total, dims: m.dims, hits: m.hits };
    }).sort(function (a, b) { return b.score - a.score; }), topN, 10);

    var urls = {};
    st.jobs.forEach(function (j) { if (j.url) urls[j.url] = 1; });
    var added = 0;
    ranked.forEach(function (r) {
      if (!r.job.url || urls[r.job.url]) return;
      var j = JSON.parse(JSON.stringify(r.job));
      j.collectedAt = new Date().toISOString();
      j.publishedAt = new Date(Date.now() - 3 * 86400000).toISOString();
      st.jobs.unshift(j);
      urls[r.job.url] = 1;
      added++;
    });
    Store.log('match', '全网职位池捞入 <b>' + added + '</b> 个最匹配岗位（Top ' + ranked.length + '）');
    Store.save();
    U.marketMode = 'top100';
    U.marketPage = 1;
    U.marketPool = pool.length;
    render({ keepScroll: true });
    TR.toast('扫描 ' + pool.length + ' 个公开职位，按匹配度排序 Top ' + ranked.length);
  }

  /* ---------------- 详情抽屉 ---------------- */
  function candidateDrawer(id) {
    var st = Store.state, c = Store.candidate(id);
    if (!c) return;
    var tops = TR.topMatches(id, 3);
    var body = '<div class="flex center gap12 mb16">' + TR.avatar(c.name, 'lg') +
      '<div class="grow"><div style="font-size:17px;font-weight:700">' + esc(c.name) + ' <span style="margin-left:6px">' + TR.candTag(c.status) + '</span></div>' +
      '<div class="text-sm text-muted">' + esc(c.title) + ' · ' + esc(c.city) + '</div></div>' + TR.ring(TR.bestScoreFor(id)) + '</div>' +
      '<div class="section-title">AI 解析结果</div>' +
      '<div class="kv"><span class="k">工作年限</span><span class="v">' + c.years + ' 年</span></div>' +
      '<div class="kv"><span class="k">学历院校</span><span class="v">' + esc(c.education) + ' · ' + esc(c.school) + '</span></div>' +
      '<div class="kv"><span class="k">期望薪资</span><span class="v">' + esc(c.salary) + '</span></div>' +
      '<div class="kv"><span class="k">联系方式</span><span class="v">' + esc(c.phone) + ' · ' + esc(c.email) + '</span></div>' +
      '<div class="kv"><span class="k">简历文件</span><span class="v">' + esc(c.resume) + '</span></div>' +
      '<div class="divider"></div><div class="section-title">技能标签</div><div>' +
        c.skills.map(function (s) { return '<span class="skill hit">' + esc(s) + '</span>'; }).join('') + '</div>' +
      '<div class="divider"></div><div class="section-title">核心亮点</div>' +
      '<div class="reason-box">' + esc(c.highlight) + '</div>' +
      '<div class="section-title mt16">求职意向</div><div class="reason-box">' + esc(c.intent) + '</div>' +
      '<div class="divider"></div><div class="section-title">最匹配的 3 个岗位</div>' +
      tops.map(function (m, i) {
        return '<div class="rank-row"><div class="rank-num ' + (i === 0 ? 'top' : '') + '">' + (i + 1) + '</div>' +
          '<div class="rank-main"><div class="rank-title">' + esc(m.job.title) + ' · ' + esc(m.job.company) + '</div>' +
          '<div class="rank-sub">' + esc(m.job.city) + ' · ' + esc(m.job.salary) + '</div></div>' +
          '<b style="color:var(--primary);font-size:14px">' + m.score + '</b></div>';
      }).join('');
    TR.openDrawer({
      title: '候选人画像', subtitle: '简历解析时间 ' + TR.fmtDateTime(c.uploadedAt),
      body: body,
      footer: '<button class="btn btn-outline" data-x="match">查看全部匹配</button>' +
              '<button class="btn btn-primary" data-x="letter">' + icon('sparkles', 15) + ' 生成推荐语</button>',
      onMount: function (root) {
        root.querySelector('[data-x="match"]').onclick = function () { U.matchCandidate = c.id; TR.closeOverlay(); go('matching'); };
        root.querySelector('[data-x="letter"]').onclick = function () {
          prepareLetter(c.id, tops.length ? tops[0].job.id : st.jobs[0].id);
          TR.closeOverlay(); go('letters');
        };
      }
    });
  }

  function jobDrawer(id) {
    var st = Store.state, j = Store.job(id);
    if (!j) return;
    var tops = st.candidates.map(function (c) {
      return { c: c, score: TR.matchScore(c, j).total };
    }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    var body = '<div class="flex center gap12 mb16">' + TR.jobLogo(j.company) +
      '<div class="grow"><div style="font-size:16px;font-weight:700">' + esc(j.title) + '</div>' +
      '<div class="text-sm text-muted">' + esc(j.company) + ' · ' + esc(j.city) + '</div></div>' +
      '<span class="tag tag-amber">' + esc(j.salary) + '</span></div>' +
      '<div class="kv"><span class="k">采集来源</span><span class="v">' + TR.sourceTag(j.source) + ' ' + esc(j.sourceName) + '</span></div>' +
      '<div class="kv"><span class="k">招聘人数</span><span class="v">' + j.headcount + ' 人</span></div>' +
      '<div class="kv"><span class="k">经验 / 学历</span><span class="v">' + j.minYears + ' 年以上 · ' + esc(j.minEdu) + '</span></div>' +
      '<div class="kv"><span class="k">发布 / 采集</span><span class="v">' + TR.timeAgo(j.publishedAt) + ' / ' + TR.timeAgo(j.collectedAt) + '</span></div>' +
      '<div class="kv"><span class="k">原始链接</span><span class="v mono" style="font-size:11px;word-break:break-all">' +
        (j.url && /^https?:\/\//.test(j.url)
          ? '<a href="' + esc(j.url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:none">' + esc(j.url) + ' ↗</a>'
          : '<span class="text-muted">暂无原始链接</span>') +
      '</span></div>' +
      '<div class="divider"></div><div class="section-title">岗位描述 JD</div>' +
      '<div class="reason-box">' + esc(j.jd) + '</div>' +
      '<div class="section-title mt16">技能要求</div><div>' +
        j.tags.map(function (t) { return '<span class="skill hit">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="divider"></div><div class="section-title">匹配度最高的候选人</div>' +
      tops.map(function (x, i) {
        return '<div class="rank-row"><div class="rank-num ' + (i === 0 ? 'top' : '') + '">' + (i + 1) + '</div>' +
          '<div class="rank-main"><div class="rank-title">' + esc(x.c.name) + ' · ' + esc(x.c.title) + '</div>' +
          '<div class="rank-sub">' + x.c.years + ' 年经验 · ' + esc(x.c.city) + '</div></div>' +
          '<b style="color:var(--primary);font-size:14px">' + x.score + '</b></div>';
      }).join('');
    TR.openDrawer({
      title: '岗位详情', subtitle: j.sourceName,
      body: body,
      footer: '<button class="btn btn-outline" data-x="copy"' + (j.url ? '' : ' disabled') + '>' + icon('copy', 15) + ' 复制链接</button>' +
              '<button class="btn btn-primary" data-x="letter">' + icon('sparkles', 15) + ' 为该岗位写推荐语</button>',
      onMount: function (root) {
        var copyBtn = root.querySelector('[data-x="copy"]');
        if (copyBtn) copyBtn.onclick = function () { if (j.url) copyText(j.url); };
        root.querySelector('[data-x="letter"]').onclick = function () {
          prepareLetter(tops[0].c.id, j.id);
          TR.closeOverlay(); go('letters');
        };
      }
    });
  }

  function prepareLetter(cId, jId) {
    U.letterCandidate = cId; U.letterJob = jId;
    U.letterVariant = 0; U.letterKey = ''; U.letterText = ''; U.letterTo = '';
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { TR.toast('已复制到剪贴板'); }, function () { TR.toast('复制失败，请手动选择', 'warn'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); TR.toast('已复制到剪贴板'); } catch (e) { TR.toast('复制失败，请手动选择', 'warn'); }
      document.body.removeChild(ta);
    }
  }

  /* ---------------- 邮件推送 ---------------- */
  function sendMail(btn) {
    var st = Store.state;
    var c = Store.candidate(U.letterCandidate) || st.candidates[0];
    var j = Store.job(U.letterJob) || st.jobs[0];
    var score = TR.matchScore(c, j).total;
    var to = (U.letterTo || TR.mailToFor(j)).trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) { TR.toast('请填写有效的收件邮箱', 'warn'); return; }
    var subject = TR.letterSubject(c, j, score);
    TR.confirmModal('确认发送推荐邮件',
      '将向 <b>' + esc(to) + '</b> 发送关于 <b>' + esc(c.name) + '</b> 应聘 <b>' + esc(j.title) + '</b> 的推荐邮件。<br><br>' +
      '<span class="text-muted">主题：' + esc(subject) + '</span><br>' +
      '<span class="text-muted">附件：' + esc(c.resume) + '</span>',
      function () {
        var btnHtml = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 发送中…'; }
        var body = U.letterText || TR.generateLetter(c, j, score, U.letterTone, U.letterVariant);
        var restoreBtn = function () { if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; } };

        /* 在线模式：交给服务端落库（MAIL_ENABLED=false 时不会真实投递 SMTP） */
        if (TR.api && TR.api.mode === 'server') {
          TR.api.sendMail({
            candidateId: c.id, jobId: j.id, to: to, subject: subject, body: body
          }).then(function (res) {
            if (!res.ok) { restoreBtn(); TR.toast('后端发送失败：' + res.error, 'warn'); return; }
            U.mailFilter = 'all';
            TR.toast('推荐邮件已保存，可在推送记录中追踪状态');
            go('mails');
          });
          return;
        }

        setTimeout(function () {
          st.mails.unshift({
            id: Store.uid('m'), candidateId: c.id, jobId: j.id, to: to, subject: subject,
            body: body, status: 'sent', sentAt: new Date().toISOString()
          });
          c.status = 'pushed';
          Store.log('mail', '推荐邮件已送达 <b>' + esc(j.company) + '</b>，候选人 ' + esc(c.name) + ' · ' + esc(c.title));
          Store.addLog('[mail] ' + to + ' → delivered (200 OK)');
          Store.bumpTrend('pushes', 1);
          Store.save();
          U.mailFilter = 'all';
          TR.toast('推荐邮件已发送，可在推送记录中追踪状态');
          go('mails');
        }, 780);
      }, '确认发送');
  }

  function mailDrawer(id) {
    var m = Store.byId('mails', id);
    if (!m) return;
    var c = Store.candidate(m.candidateId), j = Store.job(m.jobId);
    var bodyText = m.body || (c && j ? TR.generateLetter(c, j, TR.matchScore(c, j).total, 'professional', 0) : '（无正文）');
    var body = '<div class="kv"><span class="k">投递状态</span><span class="v">' + TR.mailTag(m.status) + '</span></div>' +
      '<div class="kv"><span class="k">收件人</span><span class="v">' + esc(m.to) + '</span></div>' +
      '<div class="kv"><span class="k">发件人</span><span class="v">' + esc(Store.state.company.senderEmail) + '</span></div>' +
      '<div class="kv"><span class="k">发送时间</span><span class="v">' + TR.fmtDateTime(m.sentAt) + '</span></div>' +
      '<div class="kv"><span class="k">主题</span><span class="v">' + esc(m.subject) + '</span></div>' +
      (c ? '<div class="kv"><span class="k">附件</span><span class="v">' + esc(c.resume) + '</span></div>' : '') +
      '<div class="divider"></div><div class="section-title">邮件正文</div>' +
      '<div class="mail-preview"><div class="mail-body" style="max-height:none">' + esc(bodyText) + '</div></div>';
    TR.openDrawer({
      title: '推送详情', subtitle: '邮件 ID ' + m.id,
      body: body,
      footer: '<button class="btn btn-outline" data-x="copy">复制正文</button>' +
        '<button class="btn btn-primary" data-x="close">关闭</button>',
      onMount: function (root) {
        root.querySelector('[data-x="copy"]').onclick = function () { copyText(bodyText); };
        root.querySelector('[data-x="close"]').onclick = TR.closeOverlay;
      }
    });
  }

  /* ---------------- 数据源 ---------------- */
  function addSourceModal() {
    TR.openModal({
      title: '新增数据源',
      body: '<div class="field"><label>数据源名称</label><input class="input" id="ns-name" placeholder="例：某科技 · 招聘页"></div>' +
        '<div class="field"><label>渠道类型</label><select class="select" id="ns-type"><option>企业官网</option><option>微信公众号</option><option>招聘平台</option></select></div>' +
        '<div class="field"><label>采集地址 / 关键词</label><input class="input" id="ns-url" placeholder="https://careers.tencent.com/search.html 或 公众号名称"><div class="hint">官网填写招聘页 URL；公众号与平台填写关键词订阅。</div></div>' +
        '<div class="field"><label>采集频率</label><select class="select" id="ns-freq"><option>每 1 小时</option><option>每 2 小时</option><option>每 4 小时</option><option>每 6 小时</option><option>每日 09:00</option></select></div>',
      footer: '<button class="btn btn-outline" data-close="1">取消</button><button class="btn btn-primary" id="ns-save">添加并启用</button>',
      onMount: function (root) {
        root.querySelector('.modal-foot .btn-outline').onclick = TR.closeOverlay;
        root.querySelector('#ns-save').onclick = function () {
          var name = root.querySelector('#ns-name').value.trim();
          var url = root.querySelector('#ns-url').value.trim();
          if (!name || !url) { TR.toast('请填写名称与采集地址', 'warn'); return; }
          var type = root.querySelector('#ns-type').value;
          Store.state.sources.unshift({
            id: Store.uid('s'), name: name, type: type, url: url, enabled: true,
            frequency: root.querySelector('#ns-freq').value, lastRun: new Date().toISOString(), count: 0, status: 'ok'
          });
          Store.log('crawl', '新增采集源 <b>' + esc(name) + '</b>，已启用');
          Store.addLog('[' + type + '] ' + name + ' 已加入调度队列');
          Store.save();
          TR.closeOverlay(); U.sourceType = 'all'; render();
          TR.toast('数据源已添加并开始调度');
        };
      }
    });
  }

  /* ---------------- 系统设置 ---------------- */
  function saveSettings() {
    var co = Store.state.company;
    ['name', 'hrName', 'hrTitle', 'hrEmail', 'senderEmail', 'cc', 'smtpHost', 'smtpPort', 'temperature'].forEach(function (k) {
      var el = document.getElementById('co-' + k);
      if (el) co[k] = el.value.trim();
    });
    var model = document.getElementById('co-model'); if (model) co.model = model.value;
    var th = document.getElementById('co-threshold');
    if (th) co.threshold = Math.max(50, Math.min(99, parseInt(th.value, 10) || 75));
    Store.save();
    render({ keepScroll: true });
    TR.toast('设置已保存并生效');
  }

  /* ---------------- 搜索 / 通知 ---------------- */
  function showSearch(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return;
    var st = Store.state;
    var cs = st.candidates.filter(function (c) { return (c.name + c.title + c.skills.join('') + c.city).toLowerCase().indexOf(q) !== -1; }).slice(0, 5);
    var js = st.jobs.filter(function (j) { return (j.title + j.company + j.tags.join('') + j.city).toLowerCase().indexOf(q) !== -1; }).slice(0, 5);
    var body = '<div class="text-sm text-muted mb12">关键词「' + esc(q) + '」· 候选人 ' + cs.length + ' 条 / 岗位 ' + js.length + ' 条</div>';
    if (!cs.length && !js.length) {
      body += TR.emptyState('search', '没有找到相关内容', '试试候选人姓名、技能关键词或公司名称。');
    } else {
      if (cs.length) body += '<div class="section-title">候选人</div>' + cs.map(function (c) {
        return '<div class="rank-row"><div class="rank-main"><div class="rank-title">' + esc(c.name) + ' · ' + esc(c.title) + '</div>' +
          '<div class="rank-sub">' + esc(c.skills.slice(0, 3).join(' / ')) + '</div></div>' +
          '<button class="link-btn" data-action="search-cand" data-id="' + esc(c.id) + '">查看</button></div>';
      }).join('');
      if (js.length) body += '<div class="section-title mt16">岗位</div>' + js.map(function (j) {
        return '<div class="rank-row"><div class="rank-main"><div class="rank-title">' + esc(j.title) + ' · ' + esc(j.company) + '</div>' +
          '<div class="rank-sub">' + esc(j.city) + ' · ' + esc(j.salary) + '</div></div>' +
          '<button class="link-btn" data-action="search-job" data-id="' + esc(j.id) + '">查看</button></div>';
      }).join('');
    }
    TR.openModal({ title: '全局搜索', body: body, footer: '<button class="btn btn-outline" data-close="1">关闭</button>',
      onMount: function (root) { root.querySelector('.modal-foot .btn-outline').onclick = TR.closeOverlay; } });
  }

  function showNotifications() {
    var body = '<div class="feed">' + Store.state.activities.slice(0, 10).map(function (a) {
      return '<div class="feed-item">' + TR.feedIcon(a.type) + '<div class="feed-body"><div class="feed-text">' + TR.richText(a.text) + '</div>' +
        '<div class="feed-time">' + TR.timeAgo(a.time) + '</div></div></div>';
    }).join('') + '</div>';
    TR.openModal({ title: '最近动态', body: body, footer: '<button class="btn btn-primary" data-close="1">知道了</button>',
      onMount: function (root) { root.querySelector('.modal-foot .btn-primary').onclick = TR.closeOverlay; } });
  }

  /* ---------------- 动作分发 ---------------- */
  var H = {
    'goto': function (el) { go(el.dataset.page); },
    'pick-files': function () { var f = document.getElementById('resume-input'); if (f) f.click(); },
    'cand-filter': function (el) { U.candFilter = el.dataset.value; render({ keepScroll: true }); },
    'job-source': function (el) { U.jobSource = el.dataset.value; render({ keepScroll: true }); },
    'mail-filter': function (el) { U.mailFilter = el.dataset.value; render({ keepScroll: true }); },
    'source-type': function (el) { U.sourceType = el.dataset.value; render({ keepScroll: true }); },
    'cand-detail': function (el) { candidateDrawer(el.dataset.id); },
    'job-detail': function (el) { jobDrawer(el.dataset.id); },
    'open-match': function (el) { U.matchCandidate = el.dataset.id; go('matching'); },
    'pick-candidate': function (el) { U.matchCandidate = el.dataset.id; render({ keepScroll: true }); },
    'toggle-high': function () { U.matchOnlyHigh = !U.matchOnlyHigh; render({ keepScroll: true }); },
    'recompute-match': function () {
      Store.log('match', 'AI 重新计算全库匹配，共生成 <b>' + (Store.state.candidates.length * Store.state.jobs.length) + '</b> 条匹配');
      Store.save(); render({ keepScroll: true }); TR.toast('匹配结果已刷新');
    },
    'market-scan': function () {
      if (U.marketScanning) return;
      var c = Store.candidate(U.matchCandidate) || Store.state.candidates[0];
      if (!c) { TR.toast('请先上传一份简历', 'warn'); return; }
      var TOP = 100;
      U.marketScanning = true;
      if (TR.api && TR.api.mode === 'server') {
        TR.toast('正在扫描全网公开职位池…', 'info');
        TR.api.marketImport(c.id, TOP).then(function (res) {
          U.marketScanning = false;
          if (!res.ok) { TR.toast('全网捞取失败：' + res.error, 'warn'); return; }
          U.marketMode = 'top100';
          U.marketPage = 1;
          U.marketPool = res.data.scanned || 0;
          U.marketCoverage = res.data.coverage || null;
          render({ keepScroll: true });
          var imported = res.data.imported || 0;
          TR.toast(imported
            ? '扫描 ' + (res.data.scanned || 0) + ' 个公开职位，捞入 ' + imported + ' 个最匹配岗位'
            : '全网 Top 100 已在岗位库中，已按当前候选人重新排序');
        });
      } else {
        localMarketScan(c.id, TOP);
        U.marketScanning = false;
      }
    },
    'market-back': function () { U.marketMode = 'detail'; render({ keepScroll: true }); },
    'market-filter': function (el) {
      U.marketFilter = el.dataset.value || 'all';
      U.marketPage = 1;
      render({ keepScroll: true });
    },
    'market-source': function (el) {
      U.marketSource = el.dataset.value || 'all';
      U.marketPage = 1;
      render({ keepScroll: true });
    },
    'market-page': function (el) {
      U.marketPage += el.dataset.value === 'next' ? 1 : -1;
      if (U.marketPage < 1) U.marketPage = 1;
      render({ keepScroll: true });
    },
    'open-letter': function (el) {
      prepareLetter(el.dataset.candidate, el.dataset.job); go('letters');
    },
    'letter-tone': function (el) { U.letterTone = el.dataset.value; U.letterKey = ''; render({ keepScroll: true }); },
    'regen-letter': function () { U.letterVariant += 1; U.letterKey = ''; render({ keepScroll: true }); TR.toast('已换一种写法', 'info'); },
    'copy-letter': function () { copyText(U.letterText); },
    'send-mail': function (el) { sendMail(el); },
    'mail-detail': function (el) { mailDrawer(el.dataset.id); },
    'resend-mail': function (el) {
      var m = Store.byId('mails', el.dataset.id);
      if (!m) return;
      m.status = 'sent'; m.sentAt = new Date().toISOString();
      Store.log('mail', '失败邮件已重发至 <b>' + esc(m.to) + '</b>');
      Store.addLog('[mail] ' + m.to + ' → retry delivered'); Store.save(); render({ keepScroll: true }); TR.toast('邮件已重新投递');
    },
    'mock-open': function (el) {
      var m = Store.byId('mails', el.dataset.id); if (!m) return;
      m.status = 'opened'; Store.log('mail', '企业已打开推荐邮件：<b>' + esc(Store.job(m.jobId) ? Store.job(m.jobId).company : m.to) + '</b>');
      Store.save(); render({ keepScroll: true }); TR.toast('已标记为企业已查看', 'info');
    },
    'mock-reply': function (el) {
      var m = Store.byId('mails', el.dataset.id); if (!m) return;
      m.status = 'replied'; Store.log('reply', '企业回复：<b>希望安排 ' + esc(Store.candidate(m.candidateId) ? Store.candidate(m.candidateId).name : '候选人') + '</b> 的面试');
      Store.save(); render({ keepScroll: true }); TR.toast('已标记为企业已回复', 'info');
    },
    'crawl-all': function () { crawl(null); },
    'crawl-one': function (el) { var s = Store.byId('sources', el.dataset.id); if (s) crawl(s); },
    'add-source': addSourceModal,
    'delete-source': function (el) {
      var s = Store.byId('sources', el.dataset.id); if (!s) return;
      TR.confirmModal('移除数据源', '确认移除 <b>' + esc(s.name) + '</b> 吗？已采集的岗位不会删除，但后续不再调度该来源。', function () {
        Store.state.sources = Store.state.sources.filter(function (x) { return x.id !== s.id; });
        Store.log('crawl', '采集源 <b>' + esc(s.name) + '</b> 已移除'); Store.save(); render({ keepScroll: true }); TR.toast('数据源已移除');
      }, '确认移除');
    },
    'toggle-source': function (el) {
      var s = Store.byId('sources', el.dataset.id); if (!s) return;
      s.enabled = !s.enabled; s.status = s.enabled ? 'ok' : 'paused';
      Store.save(); render({ keepScroll: true }); TR.toast(s.name + (s.enabled ? ' 已启用' : ' 已暂停'), 'info');
    },
    'toggle-setting': function (el) {
      var key = el.dataset.key, co = Store.state.company;
      var on = !el.classList.contains('on');
      el.classList.toggle('on', on);
      if (key === 'autoPush') co.autoPush = on;
      else if (key === 'dailyDigest') co.dailyDigest = on;
      else U.toggles[key] = on;
      Store.save();
      TR.toast('策略已更新', 'info');
    },
    'save-settings': saveSettings,
    'reset-data': function () {
      var server = !!(TR.api && TR.api.mode === 'server');
      TR.confirmModal(server ? '重置服务端数据' : '重置演示数据',
        server
          ? '将清空 <b>服务端</b> 中的候选人、岗位、数据源、推送记录与设置，并恢复内置种子数据。此操作不可撤销。'
          : '将清空当前浏览器中的所有演示数据（候选人、岗位、推送记录、设置），并恢复初始状态。此操作不可撤销。',
        function () {
          var finish = function () {
            U.mailFilter = 'all'; U.candFilter = 'all'; U.jobSource = 'all';
            prepareLetter('c1', 'j1'); render(); TR.toast('数据已重置');
          };
          if (server) {
            TR.api.reset().then(function (res) {
              if (!res.ok) { TR.toast('服务端重置失败：' + res.error, 'warn'); return; }
              finish();
            });
          } else { Store.reset(); finish(); }
        }, '确认重置');
    },
    'reconnect': function () {
      TR.toast('正在连接服务…', 'info');
      TR.api.reconnect().then(function (ok) {
        if (!ok) { render(); TR.toast('服务未就绪，继续使用演示数据', 'warn'); return; }
        syncUiSelection();
        render({ keepScroll: true });
        TR.toast('已连接，数据来自服务端');
      });
    },
    'force-demo': function () {
      TR.api.forceDemo();
      syncUiSelection();
      render();
      TR.toast('已切换为演示模式（本标签页有效）', 'info');
    },
    'logout': function () {
      TR.confirmModal('退出登录', '退出后将返回登录页，工作台数据仍保留在服务端。', function () {
        TR.auth.logout();
      }, '确认退出');
    },
    'notifications': showNotifications,
    'search-cand': function (el) { TR.closeOverlay(); candidateDrawer(el.dataset.id); },
    'search-job': function (el) { TR.closeOverlay(); jobDrawer(el.dataset.id); }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (el && H[el.dataset.action]) { e.preventDefault(); H[el.dataset.action](el, e); return; }
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open') && !e.target.closest('.sidebar') && !e.target.closest('#btn-menu')) sidebar.classList.remove('open');
    if (e.target.id === 'btn-menu') document.getElementById('sidebar').classList.toggle('open');
    if (e.target.closest && e.target.closest('#btn-bell')) showNotifications();
    if (e.target.closest && e.target.closest('#btn-settings-shortcut')) go('settings');
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'resume-input') { handleFiles(t.files); t.value = ''; return; }
    if (t.id === 'letter-candidate') { prepareLetter(t.value, U.letterJob); render({ keepScroll: true }); return; }
    if (t.id === 'letter-job') { prepareLetter(U.letterCandidate, t.value); render({ keepScroll: true }); return; }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'cand-search') { U.candSearch = t.value; render({ keepScroll: true }); restoreFocus('cand-search'); return; }
    if (t.id === 'job-search') { U.jobSearch = t.value; render({ keepScroll: true }); restoreFocus('job-search'); return; }
    if (t.id === 'letter-text') {
      U.letterText = t.value;
      var pv = document.getElementById('preview-body'); if (pv) pv.textContent = t.value;
      var cnt = document.getElementById('letter-count'); if (cnt) cnt.textContent = t.value.length + ' 字';
      return;
    }
    if (t.id === 'letter-to') {
      U.letterTo = t.value;
      var pto = document.getElementById('preview-to'); if (pto) pto.textContent = t.value || '（未填写）';
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); var s = document.getElementById('global-search'); if (s) s.focus(); return;
    }
    if (e.key === 'Escape') TR.closeOverlay();
    if (e.key === 'Enter' && e.target.id === 'global-search') { e.preventDefault(); showSearch(e.target.value); }
  });

  window.addEventListener('hashchange', function () {
    var p = location.hash.replace('#/', '');
    if (TR.views[p] && p !== currentRendered) { U.page = p; render(); }
  });

  /* 切换模式后，若当前选中的候选人/岗位已不在库中，回落到第一条 */
  function syncUiSelection() {
    var st = Store.state;
    if (!Store.candidate(U.letterCandidate)) U.letterCandidate = (st.candidates[0] || {}).id || '';
    if (!Store.job(U.letterJob)) U.letterJob = (st.jobs[0] || {}).id || '';
    if (!Store.candidate(U.matchCandidate)) U.matchCandidate = U.letterCandidate;
    U.letterKey = ''; U.letterText = ''; U.letterTo = '';
  }

  /* 启动：先本地渲染保证秒开，再异步探测服务；连上后用服务端数据重绘 */
  var initial = location.hash.replace('#/', '');
  U.page = TR.views[initial] ? initial : 'dashboard';
  bindPage();
  render();
  TR.api.updateBadges();
  // 未登录时登录页遮住工作台：仍渲染但不要弹出「已连接」提示
  var authedAtBoot = !(TR.auth && !TR.auth.isAuthed());
  TR.api.ready().then(function (connected) {
    if (!connected || !authedAtBoot) return;
    syncUiSelection();
    render({ keepScroll: true });
    TR.toast('已连接，数据来自服务端');
  });
})(window.TR);
