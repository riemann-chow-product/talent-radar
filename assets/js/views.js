/* 才探 TalentRadar · 页面视图层 */
window.TR = window.TR || {};

(function (TR) {
  'use strict';

  var esc = TR.esc, icon = TR.icon, Store = TR.Store;
  var S = function () { return Store.state; };
  var U = TR.ui;

  var companyMails = {
    '星云智能': 'talent@xingyun-ai.com',
    '深蓝 AI': 'hr@deepblue.ai',
    '云帆科技': 'hr@yunfan-tech.com',
    '序列科技': 'join@xulie.com',
    '光影设计': 'hr@guangying.design',
    '元启智能': 'jobs@yuanqi.ai',
    '远望科技': 'hr@yuanwang.cn',
    '拾光网络': 'talent@shiguang.com'
  };
  function mailToFor(job) { return companyMails[job.company] || ('hr@' + (job.url.match(/\/\/([^/]+)/) || [, 'company.com'])[1].replace(/^www\./, '')); }
  TR.mailToFor = mailToFor;

  function head(title, sub, actions) {
    return '<div class="page-head"><div><h1 class="page-title">' + title + '</h1><p class="page-sub">' + sub + '</p></div>' +
      '<div class="page-actions">' + (actions || '') + '</div></div>';
  }
  function cardHead(title, sub, actions, noBorder) {
    return '<div class="card-head' + (noBorder ? ' no-border' : '') + '"><div><h3 class="card-title">' + title + '</h3>' +
      (sub ? '<p class="card-sub">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function stat(iconName, label, value, foot, color) {
    return '<div class="stat-card"><div class="stat-top"><span class="stat-label">' + label + '</span>' +
      '<span class="stat-icon ' + (color || '') + '">' + icon(iconName, 17) + '</span></div>' +
      '<div class="stat-value">' + value + '</div><div class="stat-foot">' + foot + '</div></div>';
  }
  function pageWrap(html) { return '<div class="page">' + html + '</div>'; }

  /* ================= 总览 ================= */
  function renderDashboard() {
    var st = S(), i;
    var today = st.trend[st.trend.length - 1] || { matches: 0, pushes: 0 };
    var pushed = st.mails.length;
    var high = 0;
    st.candidates.forEach(function (c) { if (TR.bestScoreFor(c.id) >= S().company.threshold) high++; });
    var opened = st.mails.filter(function (m) { return m.status === 'opened' || m.status === 'replied'; }).length;

    var html = head('工作台总览',
      '今天是 ' + TR.fmtDate(new Date().toISOString()) + '，采集到 ' + st.jobs.filter(function (j) { return Date.now() - new Date(j.collectedAt).getTime() < 86400000; }).length + ' 个新岗位，AI 已完成 ' + today.matches + ' 次匹配。',
      '<button class="btn btn-outline" data-action="crawl-all">' + icon('refresh', 15) + ' 立即采集</button>' +
      '<button class="btn btn-primary" data-action="goto" data-page="letters">' + icon('sparkles', 15) + ' 生成推荐语</button>');

    html += '<div class="grid g4 mb16">' +
      stat('users', '在库候选人', st.candidates.length, '<span class="trend-up">↑ +' + st.candidates.filter(function (c) { return Date.now() - new Date(c.uploadedAt).getTime() < 86400000; }).length + '</span> 今日新增', '') +
      stat('briefcase', '抓取岗位', st.jobs.length, '<span class="trend-up">↑ +' + st.jobs.filter(function (j) { return Date.now() - new Date(j.collectedAt).getTime() < 86400000; }).length + '</span> 来自 ' + st.sources.filter(function (s) { return s.enabled; }).length + ' 个数据源', 'cyan') +
      stat('target', '高匹配推荐', high, '匹配度 ≥ ' + st.company.threshold + '% 的候选人', 'green') +
      stat('send', '已推送邮件', pushed, '查看率 ' + (pushed ? Math.round(opened / pushed * 100) : 0) + '% · ' + st.mails.filter(function (m) { return m.status === 'replied'; }).length + ' 家已回复', 'amber') +
      '</div>';

    html += '<div class="grid g-2-1 mb16">' +
      '<div class="card">' + cardHead('近 7 天匹配与推送趋势', 'AI 匹配量与企业邮件推送量',
        '<div class="legend"><span><i style="background:#4F46E5"></i>智能匹配</span><span><i style="background:#0891B2"></i>邮件推送</span></div>') +
        '<div class="card-body"><div class="chart-wrap">' + TR.lineChart(st.trend) + '</div></div></div>' +
      '<div class="card">' + cardHead('今日采集概览', '按渠道统计岗位分布') + '<div class="card-body">';
    var types = ['企业官网', '微信公众号', '招聘平台'];
    var typeColors = { '企业官网': '#4F46E5', '微信公众号': '#059669', '招聘平台': '#0891B2' };
    types.forEach(function (t) {
      var n = st.jobs.filter(function (j) { return j.source === t; }).length;
      var pct = st.jobs.length ? Math.round(n / st.jobs.length * 100) : 0;
      html += '<div style="margin-bottom:14px"><div class="flex between center" style="font-size:12px;margin-bottom:6px">' +
        '<span>' + TR.sourceTag(t) + '</span><b>' + n + ' <span class="text-muted" style="font-weight:400">/ ' + pct + '%</span></b></div>' +
        '<div class="progress"><i style="width:' + pct + '%;background:' + typeColors[t] + '"></i></div></div>';
    });
    html += '<div class="divider"></div><div class="section-title">本周采集节奏</div><div class="mini-bars">';
    var bars = [42, 58, 49, 76, 63, 88, 100];
    bars.forEach(function (b, idx) { html += '<div class="bar' + (idx === 6 ? ' today' : '') + '" style="height:' + b + '%"></div>'; });
    html += '</div><div class="mini-bars-labels"><span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>今日</span></div>';
    html += '</div></div></div>';

    /* 高匹配 TOP5 */
    var ranked = [];
    st.candidates.forEach(function (c) {
      var t = TR.topMatches(c.id, 1)[0];
      if (t) ranked.push({ c: c, job: t.job, score: t.score });
    });
    ranked.sort(function (a, b) { return b.score - a.score; });
    ranked = ranked.slice(0, 5);
    html += '<div class="grid g-2-1 mb16">' +
      '<div class="card">' + cardHead('高匹配推荐 TOP 5', '按 AI 综合匹配度排序',
        '<button class="btn btn-sm btn-ghost" data-action="goto" data-page="matching">查看全部 ' + icon('chevronRight', 13) + '</button>') +
      '<div class="card-body tight"><div class="table-wrap"><table class="tbl"><thead><tr><th>候选人</th><th>推荐岗位</th><th>来源</th><th>匹配度</th><th></th></tr></thead><tbody>';
    ranked.forEach(function (r) {
      html += '<tr><td><div class="cell-person">' + TR.avatar(r.c.name) + '<div><div class="strong">' + esc(r.c.name) + '</div><div class="sub">' + esc(r.c.title) + ' · ' + r.c.years + '年</div></div></div></td>' +
        '<td><div class="strong">' + esc(r.job.title) + '</div><div class="sub">' + esc(r.job.company) + ' · ' + esc(r.job.city) + '</div></td>' +
        '<td>' + TR.sourceTag(r.job.source) + '</td>' +
        '<td><div class="score-wrap"><div class="progress" style="width:66px"><i style="width:' + r.score + '%"></i></div><span class="score-num">' + r.score + '</span></div></td>' +
        '<td class="nowrap" style="text-align:right"><button class="link-btn" data-action="open-letter" data-candidate="' + esc(r.c.id) + '" data-job="' + esc(r.job.id) + '">写推荐语</button></td></tr>';
    });
    html += '</tbody></table></div></div></div>';

    html += '<div class="card">' + cardHead('最新动态', '平台实时事件流',
      '<button class="btn btn-sm btn-ghost" data-action="notifications">' + icon('bell', 14) + '</button>') + '<div class="card-body tight"><div class="feed">';
    st.activities.slice(0, 6).forEach(function (a) {
      html += '<div class="feed-item">' + TR.feedIcon(a.type) + '<div class="feed-body"><div class="feed-text">' + TR.richText(a.text) + '</div><div class="feed-time">' + TR.timeAgo(a.time) + '</div></div></div>';
    });
    html += '</div></div></div></div>';

    /* 数据源状态条 */
    html += '<div class="card">' + cardHead('数据源运行状态', '共 ' + st.sources.length + ' 个采集源，' + st.sources.filter(function (s) { return s.enabled; }).length + ' 个运行中',
      '<button class="btn btn-sm btn-outline" data-action="goto" data-page="sources">管理数据源 ' + icon('chevronRight', 13) + '</button>') +
      '<div class="card-body"><div class="grid g4">';
    st.sources.slice(0, 8).forEach(function (s) {
      var col = TR.sourceColor(s.type);
      html += '<div class="flex center gap8" style="min-width:0"><div class="source-logo" style="width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:' + col[0] + ';color:' + col[1] + '">' + icon(s.type === '企业官网' ? 'globe' : s.type === '微信公众号' ? 'message' : 'briefcase', 15) + '</div>' +
        '<div style="min-width:0;flex:1"><div class="text-sm" style="font-weight:620;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.name) + '</div>' +
        '<div class="text-sm text-muted" style="font-size:11px">' + (s.enabled ? '<span class="trend-up">运行中</span> · ' + s.count + ' 条' : '<span class="text-muted">已暂停</span>') + '</div></div></div>';
    });
    html += '</div></div></div>';
    return pageWrap(html);
  }

  /* ================= 简历库 ================= */
  function renderCandidates() {
    var st = S();
    var list = st.candidates.filter(function (c) {
      if (U.candFilter !== 'all' && c.status !== U.candFilter) return false;
      if (U.candSearch) {
        var q = U.candSearch.toLowerCase();
        return (c.name + c.title + c.school + c.city + c.skills.join('')).toLowerCase().indexOf(q) !== -1;
      }
      return true;
    });
    var html = head('简历库', '上传简历后由 AI 自动解析技能、经验与求职意向，形成结构化人才画像。',
      '<button class="btn btn-outline" data-action="goto" data-page="matching">' + icon('target', 15) + ' 智能匹配</button>' +
      '<button class="btn btn-primary" data-action="pick-files">' + icon('upload', 15) + ' 上传简历</button>');

    html += '<div class="card mb16"><div class="card-body">' +
      '<div class="dropzone" id="dropzone" data-action="pick-files">' +
        '<div class="dz-icon">' + icon('upload', 24) + '</div>' +
        '<div class="dz-title">拖拽简历到此处，或点击选择文件</div>' +
        '<div class="dz-sub">AI 将自动提取姓名、职位、技能标签、工作年限与求职意向</div>' +
        '<div class="dz-formats">' +
          '<span class="tag tag-plain">PDF</span><span class="tag tag-plain">DOC / DOCX</span><span class="tag tag-plain">TXT / MD</span>' +
          '<span class="tag tag-gray">单个 ≤ 10 MB</span>' +
        '</div>' +
      '</div><div class="upload-queue" id="upload-queue"></div>' +
      '<input type="file" id="resume-input" multiple accept=".pdf,.doc,.docx,.txt,.md" style="display:none">' +
      '</div></div>';

    html += '<div class="filter-bar">' +
      '<div class="segmented">' +
        ['all:全部', 'parsed:已解析', 'matched:已匹配', 'pushed:已推送'].map(function (x) {
          var p = x.split(':');
          return '<button class="' + (U.candFilter === p[0] ? 'active' : '') + '" data-action="cand-filter" data-value="' + p[0] + '">' + p[1] + '</button>';
        }).join('') + '</div>' +
      '<div class="inline-search" style="margin-left:auto">' + icon('search', 15) +
        '<input id="cand-search" placeholder="搜索姓名 / 技能 / 城市" value="' + esc(U.candSearch) + '"></div>' +
      '<span class="text-sm text-muted">共 ' + list.length + ' 位候选人</span>' +
      '</div>';

    if (!list.length) {
      html += '<div class="card">' + TR.emptyState('users', '没有匹配的候选人', '换个筛选条件或搜索词试试，也可以上传一份新简历。') + '</div>';
      return pageWrap(html);
    }
    html += '<div class="cand-grid">';
    list.forEach(function (c) {
      var score = TR.bestScoreFor(c.id);
      html += '<div class="cand-card" data-action="cand-detail" data-id="' + esc(c.id) + '">' +
        '<div class="cand-head">' + TR.avatar(c.name, 'lg') +
          '<div class="grow"><div class="cand-name">' + esc(c.name) + ' <span style="margin-left:4px">' + TR.candTag(c.status) + '</span></div>' +
          '<div class="cand-title">' + esc(c.title) + ' · ' + esc(c.city) + '</div></div></div>' +
        '<div class="cand-meta">' +
          '<span>' + icon('clock', 13) + c.years + ' 年经验</span>' +
          '<span>' + icon('cap', 13) + esc(c.education) + '</span>' +
          '<span>' + icon('wallet', 13) + esc(c.salary) + '</span></div>' +
        '<div class="skills-line">' + c.skills.slice(0, 4).map(function (s) { return '<span class="skill">' + esc(s) + '</span>'; }).join('') +
          (c.skills.length > 4 ? '<span class="skill">+' + (c.skills.length - 4) + '</span>' : '') + '</div>' +
        '<div class="cand-foot"><span class="cand-score"><b>' + score + '</b>最佳匹配度</span>' +
          '<button class="btn btn-sm btn-soft" data-action="open-match" data-id="' + esc(c.id) + '">查看匹配 ' + icon('chevronRight', 13) + '</button></div>' +
      '</div>';
    });
    html += '</div>';
    return pageWrap(html);
  }

  /* ================= 岗位雷达 ================= */
  function renderJobs() {
    var st = S();
    var list = st.jobs.filter(function (j) {
      if (U.jobSource !== 'all' && j.source !== U.jobSource) return false;
      if (U.jobSearch) {
        var q = U.jobSearch.toLowerCase();
        return (j.title + j.company + j.city + j.tags.join('') + j.sourceName).toLowerCase().indexOf(q) !== -1;
      }
      return true;
    }).sort(function (a, b) { return new Date(b.collectedAt) - new Date(a.collectedAt); });

    var html = head('岗位雷达', '自动汇聚企业官网、微信公众号与招聘平台的公开职位，去重清洗后进入岗位库。',
      '<button class="btn btn-outline" data-action="goto" data-page="sources">' + icon('layers', 15) + ' 数据源配置</button>' +
      '<button class="btn btn-primary" data-action="crawl-all">' + icon('refresh', 15) + ' 立即采集</button>');

    html += '<div class="grid g4 mb16">' +
      stat('briefcase', '岗位总量', st.jobs.length, '覆盖 ' + new Set(st.jobs.map(function (j) { return j.company; })).size + ' 家企业', '') +
      stat('globe', '企业官网', st.jobs.filter(function (j) { return j.source === '企业官网'; }).length, '直连官方招聘页', 'cyan') +
      stat('message', '微信公众号', st.jobs.filter(function (j) { return j.source === '微信公众号'; }).length, '图文岗位信息抽取', 'green') +
      stat('layers', '招聘平台', st.jobs.filter(function (j) { return j.source === '招聘平台'; }).length, '关键词订阅采集', 'amber') +
      '</div>';

    html += '<div class="card">' +
      '<div class="filter-bar" style="padding:14px 18px 0">' +
        '<div class="segmented">' +
          ['all:全部岗位', '企业官网:企业官网', '微信公众号:公众号', '招聘平台:招聘平台'].map(function (x) {
            var p = x.split(':');
            return '<button class="' + (U.jobSource === p[0] ? 'active' : '') + '" data-action="job-source" data-value="' + p[0] + '">' + p[1] + '</button>';
          }).join('') + '</div>' +
        '<div class="inline-search" style="margin-left:auto">' + icon('search', 15) +
          '<input id="job-search" placeholder="搜索岗位 / 公司 / 技能" value="' + esc(U.jobSearch) + '"></div>' +
        '<span class="text-sm text-muted">' + list.length + ' 条结果</span>' +
      '</div>';
    if (!list.length) {
      html += TR.emptyState('briefcase', '没有找到岗位', '试试其它筛选条件，或点「立即采集」抓取最新职位。');
    } else {
      list.forEach(function (j) {
        html += '<div class="job-row" data-action="job-detail" data-id="' + esc(j.id) + '">' + TR.jobLogo(j.company) +
          '<div class="job-main"><div class="job-title">' + esc(j.title) +
            '<span class="tag tag-gray">' + j.headcount + ' 人</span>' + TR.sourceTag(j.source) + '</div>' +
            '<div class="job-company"><span>' + icon('building', 12) + esc(j.company) + '</span>' +
              '<span>' + icon('pin', 12) + esc(j.city) + '</span>' +
              '<span>' + icon('clock', 12) + '采集于 ' + TR.timeAgo(j.collectedAt) + '</span></div>' +
            '<div class="job-tags">' + j.tags.slice(0, 5).map(function (t) { return '<span class="skill">' + esc(t) + '</span>'; }).join('') + '</div></div>' +
          '<div class="job-side"><div class="job-salary">' + esc(j.salary) + '</div>' +
            '<div class="job-time">' + esc(j.sourceName) + '</div>' +
            '<button class="btn btn-sm btn-soft" data-action="job-detail" data-id="' + esc(j.id) + '">查看 JD</button></div></div>';
      });
    }
    html += '</div>';
    return pageWrap(html);
  }

  /* ================= 智能匹配 ================= */

  /** 多公司 Top100 排行榜：按综合匹配度降序、公司多样性限额、分页展示 */
  var MARKET_TYPES = [
    ['all', '全部公司'], ['互联网大厂', '互联网大厂'], ['独角兽', '独角兽'],
    ['融资期公司', '融资期公司'], ['上市公司', '上市公司'], ['其它', '其它公司']
  ];
  var MARKET_SOURCES = [
    ['all', '全部来源'], ['企业官网', '企业官网'], ['招聘平台', '招聘平台'], ['微信公众号', '微信公众号']
  ];

  function renderMarketRanking(c, list, allList, statsList) {
    var pool = allList || list;
    var stats = statsList || pool;
    var sourceCounts = {};
    stats.forEach(function (m) {
      var s = m.job.source || '企业官网';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    var pageSize = 20;
    var pages = Math.max(1, Math.ceil(list.length / pageSize));
    if (U.marketPage > pages) U.marketPage = pages;
    if (U.marketPage < 1) U.marketPage = 1;
    var start = (U.marketPage - 1) * pageSize;
    var rows = list.slice(start, start + pageSize);

    var counts = {}, companies = {};
    pool.forEach(function (m) {
      var t = m.job.companyType || '其它';
      counts[t] = (counts[t] || 0) + 1;
      companies[TR.companyKey(m.job)] = 1;
    });

    var html = '<div class="card mb16"><div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
      '<div class="grow"><b>全网匹配排行榜</b> <span class="text-sm text-muted">按 ' + esc(c.name) + ' 的五维综合匹配度降序 · 共 ' + list.length + ' 个岗位 · 覆盖 ' + Object.keys(companies).length + ' 家公司</span></div>' +
      '<span class="text-sm text-muted">三类渠道 JD 链接均逐条校验</span></div>' +
      '<div class="market-filters market-filters-source">' + MARKET_SOURCES.map(function (t) {
        var n = t[0] === 'all' ? stats.length : (sourceCounts[t[0]] || 0);
        return '<button class="market-filter' + (U.marketSource === t[0] ? ' active' : '') + '" data-action="market-source" data-value="' + t[0] + '">' +
          esc(t[1]) + '<span>' + n + '</span></button>';
      }).join('') + '</div>' +
      '<div class="market-filters">' + MARKET_TYPES.map(function (t) {
        var n = t[0] === 'all' ? pool.length : (counts[t[0]] || 0);
        return '<button class="market-filter' + (U.marketFilter === t[0] ? ' active' : '') + '" data-action="market-filter" data-value="' + t[0] + '">' +
          esc(t[1]) + '<span>' + n + '</span></button>';
      }).join('') + '</div>' +
      '<div class="market-note">来源覆盖企业官网 / 招聘平台 / 微信公众号；公司类型 / 融资阶段为公开资料整理，仅供筛选参考；为保证多公司与多渠道覆盖，每家公司最多展示 10 个岗位。</div>' +
      '</div>';

    if (!list.length) {
      return html + '<div class="card">' + TR.emptyState('target', '该分类下暂无匹配结果', '切换上方来源或公司类型，或点击「捞取全网最匹配 Top 100」重新扫描。') + '</div>';
    }
    html += '<div class="market-list">';
    rows.forEach(function (m, i) {
      var j = m.job, rank = start + i + 1;
      html += '<div class="market-row' + (rank === 1 ? ' best' : '') + '">' +
        '<div class="market-rank">' + rank + '</div>' +
        '<div class="market-score"><b>' + m.score + '</b><span>分</span></div>' +
        '<div class="grow"><div class="market-title">' + esc(j.title) +
          (rank === 1 ? '<span class="tag tag-amber">' + icon('zap', 12) + ' 最佳匹配</span>' : '') + '</div>' +
          '<div class="market-company">' + esc(j.company) +
            (j.companyType ? '<span class="co-type">' + esc(j.companyType) + '</span>' : '') +
            (j.fundingStage ? '<span class="co-stage">' + esc(j.fundingStage) + '</span>' : '') + '</div>' +
          '<div class="market-sub">' + esc(j.city) + ' · ' + esc(j.salary) +
            ' · 命中 ' + m.hits.length + '/' + j.tags.length + ' 项技能 · ' + TR.sourceTag(j.source) +
            ' <span class="text-muted">' + esc(j.sourceName || '') + '</span></div>' +
          '<div class="hit-skills">' + j.tags.map(function (t) {
            return '<span class="skill ' + (m.hits.indexOf(t) !== -1 ? 'hit' : '') + '">' + (m.hits.indexOf(t) !== -1 ? '✓ ' : '') + esc(t) + '</span>';
          }).join('') + '</div></div>' +
        '<div class="market-actions">' +
          '<button class="btn btn-sm btn-outline" data-action="job-detail" data-id="' + esc(j.id) + '">查看 JD</button>' +
          '<button class="btn btn-sm btn-primary" data-action="open-letter" data-candidate="' + esc(c.id) + '" data-job="' + esc(j.id) + '">' + icon('sparkles', 13) + ' 写推荐语</button>' +
        '</div></div>';
    });
    html += '</div>';
    html += '<div class="market-pager">' +
      '<button class="btn btn-sm btn-outline" data-action="market-page" data-value="prev"' + (U.marketPage <= 1 ? ' disabled' : '') + '>上一页</button>' +
      '<span class="text-sm text-muted">第 ' + U.marketPage + ' / ' + pages + ' 页 · 每页 20 条</span>' +
      '<button class="btn btn-sm btn-outline" data-action="market-page" data-value="next"' + (U.marketPage >= pages ? ' disabled' : '') + '>下一页</button>' +
      '</div>';
    return html;
  }

  function renderMatches() {
    var st = S();
    var c = Store.candidate(U.matchCandidate) || st.candidates[0];
    if (!c) return pageWrap(head('智能匹配', '') + '<div class="card">' + TR.emptyState('users', '还没有候选人', '先去简历库上传一份简历。') + '</div>');
    U.matchCandidate = c.id;
    var isMarket = U.marketMode === 'top100';
    var all = TR.topMatches(c.id);
    var list = U.matchOnlyHigh ? all.filter(function (m) { return m.score >= st.company.threshold; }) : all.slice(0, 6);
    /* 排行榜：先按来源筛选，再取最匹配前 100 名（三类渠道配额 + 每家公司最多 10 个） */
    var sourceAll = U.marketSource === 'all' ? all : all.filter(function (m) {
      return (m.job.source || '企业官网') === U.marketSource;
    });
    var marketAll = TR.diversify(sourceAll, 100, 10);
    /* 来源计数始终基于未筛选的 Top100，避免切换筛选后数字跳动 */
    var marketBase = U.marketSource === 'all' ? marketAll : TR.diversify(all, 100, 10);
    var marketFiltered = U.marketFilter === 'all' ? marketAll : marketAll.filter(function (m) {
      return (m.job.companyType || '其它') === U.marketFilter;
    });
    var marketList = (U.matchOnlyHigh ? marketFiltered.filter(function (m) { return m.score >= st.company.threshold; }) : marketFiltered).slice(0, 100);

    var poolCompanies = {};
    (TR.marketJobs || []).forEach(function (j) { poolCompanies[TR.companyKey(j)] = 1; });
    var covCompanies = (U.marketCoverage && U.marketCoverage.companies) || Object.keys(poolCompanies).length;

    var html = head('智能匹配',
      isMarket ? '从企业官网 / 招聘平台 / 微信公众号三类渠道捞取最匹配的 100 个岗位，按五维综合匹配度降序排序。'
               : 'AI 从技能、经验、学历、城市与薪资五个维度计算匹配度，并给出可解释的推荐理由。',
      '<button class="btn btn-outline" data-action="goto" data-page="candidates">' + icon('users', 15) + ' 简历库</button>' +
      (isMarket ? '<button class="btn btn-outline" data-action="market-back">' + icon('chevronLeft', 15) + ' 详情视图</button>' : '') +
      '<button class="btn btn-primary" data-action="market-scan">' + icon('target', 15) + ' 捞取全网最匹配 Top 100</button>');

    html += '<div class="callout blue">' + icon('info', 16) + '<div>' +
      (isMarket
        ? '已扫描 <b>' + (U.marketPool || (TR.marketJobs || []).length) + '</b> 个公开职位，覆盖 <b>' + covCompanies + '</b> 家公司，来源含 <b>企业官网 / 招聘平台 / 微信公众号</b> 三类渠道，岗位库现有 <b>' + st.jobs.length + '</b> 个岗位；下方按当前候选人的五维匹配度降序展示最匹配的 <b>' + marketList.length + '</b> 个，每条「查看 JD」都指向已逐条校验、可真实打开的职位页面。'
        : '点击「捞取全网最匹配 Top 100」，系统会扫描全渠道公开职位池（企业官网：腾讯、字节、得物、MiniMax、智元等；招聘平台：实习僧、智联招聘、猎聘；微信公众号招聘推文），按 <b>技能覆盖 / 经验 / 学历 / 城市 / 薪资</b> 五维打分，取最匹配的前 100 名排序并捞入岗位库。阈值当前为 ' + st.company.threshold + '%。') +
      '</div></div>';

    html += '<div class="match-layout">' +
      '<div class="card">' + cardHead('选择候选人', st.candidates.length + ' 位在库人才') +
        '<div class="pick-list">' + st.candidates.map(function (x) {
          return '<div class="pick-item ' + (x.id === c.id ? 'active' : '') + '" data-action="pick-candidate" data-id="' + esc(x.id) + '">' +
            TR.avatar(x.name) + '<div class="pick-meta"><div class="pick-name">' + esc(x.name) + '</div>' +
            '<div class="pick-sub">' + esc(x.title) + ' · ' + x.years + '年</div></div>' +
            '<span class="score-num" style="font-size:12px;color:var(--primary)">' + TR.bestScoreFor(x.id) + '</span></div>';
        }).join('') + '</div></div>';

    html += '<div class="grow">' +
      '<div class="card mb16"><div class="card-body" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
        TR.avatar(c.name, 'lg') +
        '<div class="grow"><div style="font-size:16px;font-weight:700">' + esc(c.name) + ' <span class="text-sm text-muted" style="font-weight:400">' + esc(c.title) + '</span></div>' +
        '<div class="text-sm text-muted mt8">' + esc(c.school) + ' · ' + esc(c.education) + ' · ' + c.years + ' 年经验 · ' + esc(c.city) + ' · 期望 ' + esc(c.salary) + '</div></div>' +
        '<div class="flex gap8 wrap" style="justify-content:flex-end">' +
          '<label class="text-sm flex center gap8" style="cursor:pointer"><span class="switch ' + (U.matchOnlyHigh ? 'on' : '') + '" data-action="toggle-high"></span> 仅看 ≥ ' + st.company.threshold + '%</label>' +
        '</div></div></div>';

    if (isMarket) {
      html += renderMarketRanking(c, marketList, marketAll, marketBase);
    } else {
    if (!list.length) {
      html += '<div class="card">' + TR.emptyState('target', '暂无达到阈值的岗位', '降低匹配阈值，或采集更多岗位后再试。') + '</div>';
    }
    list.forEach(function (m, idx) {
      var j = m.job, d = m.dims;
      var dims = [['技能覆盖', d.skill], ['经验年限', d.exp], ['学历要求', d.edu], ['城市匹配', d.city], ['薪资适配', d.salary]];
      html += '<div class="match-card' + (idx === 0 ? ' best' : '') + '">' +
        '<div class="match-top">' + TR.ring(m.score) +
          '<div class="match-info"><div class="match-title">' + esc(j.title) +
            (idx === 0 ? '<span class="tag tag-amber">' + icon('zap', 12) + ' 最佳匹配</span>' : '') + '</div>' +
            '<div class="match-company">' + esc(j.company) + ' · ' + esc(j.city) + ' · ' + esc(j.salary) + ' · ' + TR.sourceTag(j.source) + '</div></div>' +
          '<div style="text-align:right"><div class="text-sm text-muted">综合匹配度</div><div style="font-size:12px;color:var(--text-3)">5 维加权</div></div></div>' +
        '<div class="dim-grid">' + dims.map(function (x) {
          return '<div><div class="dim-label"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>' +
            '<div class="progress thin"><i style="width:' + x[1] + '%"></i></div></div>';
        }).join('') + '</div>' +
        '<div class="hit-skills">' + j.tags.map(function (t) {
          return '<span class="skill ' + (m.hits.indexOf(t) !== -1 ? 'hit' : '') + '">' + (m.hits.indexOf(t) !== -1 ? '✓ ' : '') + esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="reason-box mt12"><span class="ai-label">' + icon('sparkles', 13) + ' AI 推荐理由</span>' + esc(TR.matchReason(c, j, m)) + '</div>' +
        '<div class="match-actions">' +
          '<button class="btn btn-sm btn-outline" data-action="job-detail" data-id="' + esc(j.id) + '">查看 JD</button>' +
          '<button class="btn btn-sm btn-primary" data-action="open-letter" data-candidate="' + esc(c.id) + '" data-job="' + esc(j.id) + '">' + icon('sparkles', 13) + ' 生成推荐语</button>' +
        '</div></div>';
    });
    }
    html += '</div></div>';
    return pageWrap(html);
  }

  /* ================= 推荐语工坊 ================= */
  function ensureLetter() {
    var st = S();
    var c = Store.candidate(U.letterCandidate) || st.candidates[0];
    var j = Store.job(U.letterJob) || st.jobs[0];
    if (!c || !j) return null;
    U.letterCandidate = c.id; U.letterJob = j.id;
    var key = c.id + '|' + j.id + '|' + U.letterTone + '|' + U.letterVariant;
    if (U.letterKey !== key) {
      U.letterText = TR.generateLetter(c, j, TR.matchScore(c, j).total, U.letterTone, U.letterVariant);
      U.letterKey = key;
      U.letterTo = '';
    }
    return { c: c, j: j, score: TR.matchScore(c, j).total };
  }

  function renderLetters() {
    var st = S();
    var ctx = ensureLetter();
    if (!ctx) return pageWrap(head('推荐语工坊', '') + '<div class="card">' + TR.emptyState('sparkles', '缺少候选人或岗位', '请先上传简历并采集岗位。') + '</div>');
    var c = ctx.c, j = ctx.j;

    var html = head('推荐语工坊', 'AI 结合候选人亮点与岗位 JD 撰写个性化推荐语，确认后一键推送到企业招聘邮箱。',
      '<button class="btn btn-outline" data-action="goto" data-page="mails">' + icon('inbox', 15) + ' 推送记录</button>');

    html += '<div class="callout">' + icon('info', 16) +
      '<div><b>演示模式</b>：邮件发送仅写入本地推送记录并模拟投递状态，不会真实发出。接入 SMTP / 邮件服务后即可启用真实投递与回执追踪。</div></div>';

    html += '<div class="letter-layout">' +
      '<div class="card">' + cardHead('撰写推荐语', '选择候选人与目标岗位，AI 自动生成文案') +
        '<div class="card-body">' +
          '<div class="grid g2 mb16">' +
            '<div class="field"><label>候选人</label><select class="select" id="letter-candidate">' +
              st.candidates.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === c.id ? ' selected' : '') + '>' + esc(x.name) + ' · ' + esc(x.title) + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="field"><label>目标岗位</label><select class="select" id="letter-job">' +
              st.jobs.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === j.id ? ' selected' : '') + '>' + esc(x.title) + ' · ' + esc(x.company) + '</option>'; }).join('') +
            '</select></div></div>' +
          '<div class="section-title">文案语气</div><div class="tone-row">' +
            Object.keys(TR.toneLabels).map(function (k) {
              return '<button class="tone-opt ' + (U.letterTone === k ? 'active' : '') + '" data-action="letter-tone" data-value="' + k + '">' + TR.toneLabels[k] + '</button>';
            }).join('') + '</div>' +
          '<div class="section-title flex between center"><span>推荐语正文</span>' +
            '<span class="text-sm text-muted" style="font-weight:400">可直接编辑</span></div>' +
          '<textarea class="textarea" id="letter-text" data-model="letterText" style="min-height:320px;font-size:13px">' + esc(U.letterText) + '</textarea>' +
          '<div class="letter-count" id="letter-count">' + U.letterText.length + ' 字</div>' +
          '<div class="flex gap8 wrap mt12">' +
            '<button class="btn btn-outline" data-action="regen-letter">' + icon('rotate', 15) + ' 重新生成</button>' +
            '<button class="btn btn-outline" data-action="copy-letter">' + icon('copy', 15) + ' 复制文案</button>' +
            '<button class="btn btn-outline" data-action="goto" data-page="matching">' + icon('target', 15) + ' 换个岗位</button>' +
          '</div>' +
        '</div></div>';

    html += '<div>' +
      '<div class="card mb16">' + cardHead('邮件预览', '投递到企业招聘邮箱') + '<div class="card-body">' +
        '<div class="field"><label>收件邮箱</label><input class="input" id="letter-to" data-model="letterTo" value="' + esc(U.letterTo || mailToFor(j)) + '" placeholder="hr@company.com"></div>' +
        '<div class="field"><label>邮件主题</label><input class="input" id="letter-subject" value="' + esc(TR.letterSubject(c, j, ctx.score)) + '" readonly></div>' +
        '<div class="mail-preview"><div class="mail-head">' +
          '<div class="mh-row"><span class="mh-key">收件人</span><span class="mh-val" id="preview-to">' + esc(U.letterTo || mailToFor(j)) + '</span></div>' +
          '<div class="mh-row"><span class="mh-key">发件人</span><span class="mh-val">' + esc(st.company.senderEmail) + '</span></div>' +
          '<div class="mh-row"><span class="mh-key">抄送</span><span class="mh-val">' + esc(st.company.cc) + '</span></div>' +
          '<div class="mh-row"><span class="mh-key">主题</span><span class="mh-val">' + esc(TR.letterSubject(c, j, ctx.score)) + '</span></div>' +
        '</div><div class="mail-body" id="preview-body">' + esc(U.letterText) + '</div>' +
        '<div class="mail-foot"><span class="text-sm text-muted grow" style="font-size:11px">附件：' + esc(c.resume) + '</span></div></div>' +
        '<div class="flex gap8 mt16"><button class="btn btn-primary btn-lg grow" data-action="send-mail">' + icon('send', 15) + ' 发送推荐邮件</button></div>' +
        '<div class="hint-inline mt8">' + icon('shield', 13) + ' 发送前会二次确认，投递状态可追踪</div>' +
      '</div></div>' +
      '<div class="card">' + cardHead('推送链路', '从抓取到触达') + '<div class="card-body tight">' +
        [['radar', '岗位采集', '官网 / 公众号 / 招聘平台'], ['file', '简历解析', '结构化人才画像'],
         ['sparkles', 'AI 匹配与文案', '五维评分 + 个性化推荐语'], ['send', '邮件推送', '企业邮箱 + 回执追踪']].map(function (x, i) {
          return '<div class="rank-row"><div class="rank-num">' + (i + 1) + '</div><div class="rank-main">' +
            '<div class="rank-title">' + x[1] + '</div><div class="rank-sub">' + x[2] + '</div></div>' +
            '<span style="color:var(--primary)">' + icon(x[0], 15) + '</span></div>';
        }).join('') + '</div></div>' +
      '</div></div>';
    return pageWrap(html);
  }

  /* ================= 推送记录 ================= */
  function renderMails() {
    var st = S();
    var list = st.mails.filter(function (m) { return U.mailFilter === 'all' || m.status === U.mailFilter; });
    var opened = st.mails.filter(function (m) { return m.status === 'opened' || m.status === 'replied'; }).length;
    var replied = st.mails.filter(function (m) { return m.status === 'replied'; }).length;
    var total = st.mails.length || 1;

    var html = head('推送记录', '追踪每封推荐邮件的投递、查看与回复状态，及时向企业招聘负责人同步进展。',
      '<button class="btn btn-outline" data-action="goto" data-page="settings">' + icon('settings', 15) + ' 邮箱配置</button>' +
      '<button class="btn btn-primary" data-action="goto" data-page="letters">' + icon('sparkles', 15) + ' 新建推荐语</button>');

    html += '<div class="grid g4 mb16">' +
      stat('send', '累计推送', st.mails.length, '覆盖 ' + new Set(st.mails.map(function (m) { return m.to; })).size + ' 个企业邮箱', '') +
      stat('eye', '邮件查看率', Math.round(opened / total * 100) + '%', opened + ' 封已被打开', 'cyan') +
      stat('reply', '企业回复率', Math.round(replied / total * 100) + '%', replied + ' 家明确回复', 'green') +
      stat('alert', '待处理异常', st.mails.filter(function (m) { return m.status === 'failed'; }).length, '失败邮件可一键重发', 'amber') +
      '</div>';

    html += '<div class="card">' +
      '<div class="filter-bar" style="padding:14px 18px 0">' +
        '<div class="segmented">' +
          ['all:全部', 'sent:已送达', 'opened:已查看', 'replied:已回复', 'failed:发送失败'].map(function (x) {
            var p = x.split(':');
            return '<button class="' + (U.mailFilter === p[0] ? 'active' : '') + '" data-action="mail-filter" data-value="' + p[0] + '">' + p[1] + '</button>';
          }).join('') + '</div><span class="text-sm text-muted" style="margin-left:auto">' + list.length + ' 条记录</span></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
        '<th>候选人</th><th>推荐岗位 / 企业</th><th>收件邮箱</th><th>投递状态</th><th>发送时间</th><th></th></tr></thead><tbody>';
    if (!list.length) {
      html += '<tr><td colspan="6">' + TR.emptyState('inbox', '暂无推送记录', '去推荐语工坊生成并发送第一封推荐邮件。') + '</td></tr>';
    }
    list.forEach(function (m) {
      var c = Store.candidate(m.candidateId), j = Store.job(m.jobId);
      html += '<tr><td><div class="cell-person">' + (c ? TR.avatar(c.name) : '') +
        '<div><div class="strong">' + esc(c ? c.name : '—') + '</div><div class="sub">' + esc(c ? c.title : '') + '</div></div></div></td>' +
        '<td><div class="strong">' + esc(j ? j.title : '—') + '</div><div class="sub">' + esc(j ? j.company : '') + '</div></td>' +
        '<td class="nowrap">' + esc(m.to) + '</td>' +
        '<td>' + TR.mailTag(m.status) + '</td>' +
        '<td class="nowrap text-muted">' + TR.fmtDateTime(m.sentAt) + '</td>' +
        '<td><div class="tbl-actions">' +
          '<button class="link-btn" data-action="mail-detail" data-id="' + esc(m.id) + '">详情</button>' +
          (m.status === 'failed' ? '<button class="link-btn" data-action="resend-mail" data-id="' + esc(m.id) + '">重发</button>' :
            m.status === 'sent' ? '<button class="link-btn muted" data-action="mock-open" data-id="' + esc(m.id) + '">模拟查看</button>' :
            m.status === 'opened' ? '<button class="link-btn muted" data-action="mock-reply" data-id="' + esc(m.id) + '">模拟回复</button>' : '') +
        '</div></td></tr>';
    });
    html += '</tbody></table></div></div>';
    return pageWrap(html);
  }

  /* ================= 数据源 ================= */
  function renderSources() {
    var st = S();
    var list = st.sources.filter(function (s) { return U.sourceType === 'all' || s.type === U.sourceType; });
    var html = head('数据源配置', '管理企业官网、微信公众号与招聘平台的采集任务，设置频率与启停策略。',
      '<button class="btn btn-outline" data-action="crawl-all">' + icon('refresh', 15) + ' 全网采集一次</button>' +
      '<button class="btn btn-primary" data-action="add-source">' + icon('plus', 15) + ' 新增数据源</button>');

    html += '<div class="grid g3 mb16">' +
      ['企业官网', '微信公众号', '招聘平台'].map(function (t) {
        var arr = st.sources.filter(function (s) { return s.type === t; });
        var col = TR.sourceColor(t);
        return '<div class="stat-card" style="padding:15px 18px"><div class="stat-top"><span class="stat-label">' + t + '</span>' +
          '<span class="stat-icon" style="background:' + col[0] + ';color:' + col[1] + '">' + icon(t === '企业官网' ? 'globe' : t === '微信公众号' ? 'message' : 'briefcase', 17) + '</span></div>' +
          '<div class="stat-value">' + arr.length + '</div><div class="stat-foot">' + arr.filter(function (s) { return s.enabled; }).length + ' 个运行中 · 累计采集 ' + arr.reduce(function (n, s) { return n + s.count; }, 0) + ' 条</div></div>';
      }).join('') + '</div>';

    html += '<div class="filter-bar"><div class="segmented">' +
      ['all:全部', '企业官网:企业官网', '微信公众号:微信公众号', '招聘平台:招聘平台'].map(function (x) {
        var p = x.split(':');
        return '<button class="' + (U.sourceType === p[0] ? 'active' : '') + '" data-action="source-type" data-value="' + p[0] + '">' + p[1] + '</button>';
      }).join('') + '</div></div>';

    html += '<div class="source-grid mb16">';
    list.forEach(function (s) {
      var col = TR.sourceColor(s.type);
      html += '<div class="source-card"><div class="source-top">' +
        '<div class="source-logo" style="background:' + col[0] + ';color:' + col[1] + '">' + icon(s.type === '企业官网' ? 'globe' : s.type === '微信公众号' ? 'message' : 'briefcase', 20) + '</div>' +
        '<div class="grow"><div class="source-name">' + esc(s.name) + '</div><div class="source-url">' + esc(s.url) + '</div></div>' +
        TR.sourceTag(s.type) + '</div>' +
        '<div class="source-stats">' +
          '<div class="source-stat"><b>' + s.count + '</b><span>累计采集</span></div>' +
          '<div class="source-stat"><b>' + esc(s.frequency) + '</b><span>采集频率</span></div>' +
          '<div class="source-stat"><b>' + TR.timeAgo(s.lastRun) + '</b><span>最近运行</span></div></div>' +
        '<div class="source-foot"><div class="last">' + icon('clock', 12) + ' ' + TR.fmtDateTime(s.lastRun) + '</div>' +
          '<div class="flex gap8 center">' +
            '<button class="btn btn-sm btn-outline" data-action="crawl-one" data-id="' + esc(s.id) + '" title="立即采集">' + icon('play', 12) + '</button>' +
            '<span class="switch ' + (s.enabled ? 'on' : '') + '" data-action="toggle-source" data-id="' + esc(s.id) + '" title="启停"></span>' +
            '<button class="icon-btn" data-action="delete-source" data-id="' + esc(s.id) + '" title="移除">' + icon('trash', 14) + '</button>' +
          '</div></div></div>';
    });
    html += '</div>';

    html += '<div class="card">' + cardHead('采集运行日志', '最近 ' + st.logs.length + ' 条任务记录',
      '<span class="tag tag-green"><span class="dot"></span> 调度正常</span>') +
      '<div class="card-body">' + st.logs.map(function (l) {
        return '<div class="log-line"><span class="log-time">' + TR.fmtDateTime(l.time) + '</span>' +
          '<span class="' + (l.level === 'ok' ? 'log-ok' : 'log-info') + '">' + esc(l.text) + '</span></div>';
      }).join('') + '</div></div>';
    return pageWrap(html);
  }

  /* ================= 系统设置 ================= */
  function renderSettings() {
    var co = S().company;
    var html = head('系统设置', '配置企业信息、发件邮箱、AI 模型与匹配策略，这些参数会作用于推荐语与推送流程。',
      '<button class="btn btn-primary" data-action="save-settings">' + icon('check', 15) + ' 保存设置</button>');

    html += '<div class="settings-layout"><div>' +
      '<div class="card mb16">' + cardHead('企业与发件信息', '用于推荐语署名与邮件投递') + '<div class="card-body" style="padding-top:8px">' +
        formRow('企业名称', '推荐语署名与平台标识', input('co-name', co.name)) +
        formRow('招聘负责人', '邮件签名中的联系人', input('co-hrName', co.hrName)) +
        formRow('负责人职务', '', input('co-hrTitle', co.hrTitle)) +
        formRow('联系邮箱', '企业回复将发送至此', input('co-hrEmail', co.hrEmail)) +
        formRow('发件邮箱', '推荐邮件 From 地址', input('co-senderEmail', co.senderEmail)) +
        formRow('默认抄送', '每封推荐邮件自动抄送', input('co-cc', co.cc)) +
        formRow('SMTP 服务器', '演示环境不会真实连接', '<div class="form-inline">' + input('co-smtpHost', co.smtpHost) + '<input class="input" id="co-smtpPort" style="max-width:100px" value="' + esc(co.smtpPort) + '"></div>') +
      '</div></div>' +
      '<div class="card">' + cardHead('AI 与匹配策略', '控制推荐质量门槛') + '<div class="card-body" style="padding-top:8px">' +
        formRow('文案模型', '生成推荐语所用的大模型', '<select class="select" id="co-model">' +
          ['Hunyuan-T1', 'Hunyuan-Standard', 'DeepSeek-V3', 'GPT-4o'].map(function (m) { return '<option' + (co.model === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>') +
        formRow('生成温度', '越低越稳定、越高越有创意', input('co-temperature', co.temperature)) +
        formRow('推荐阈值', '仅推送匹配度不低于该值的岗位', '<div class="form-inline"><input class="input" id="co-threshold" type="number" min="50" max="99" value="' + esc(co.threshold) + '"><span class="text-sm text-muted">%</span></div>' +
          '<div class="progress mt8"><i style="width:' + co.threshold + '%"></i></div>') +
      '</div></div></div>';

    html += '<div>' +
      '<div class="card">' + cardHead('自动化策略', '') + '<div class="card-body" style="padding-top:4px">' +
        toggleRow('自动推送高匹配推荐', '匹配度超过阈值时自动发信', co.autoPush, 'autoPush') +
        toggleRow('每日推荐摘要', '每天 09:00 汇总当日新匹配', co.dailyDigest, 'dailyDigest') +
        toggleRow('邮件回执追踪', '记录打开与回复状态', true, 'trackOpen') +
        toggleRow('岗位去重', '跨平台相同职位自动合并', true, 'dedupe') +
      '</div></div>' +
      '</div></div>';
    return pageWrap(html);
  }

  function input(id, val) { return '<input class="input" id="' + id + '" value="' + esc(val) + '">'; }
  function formRow(label, desc, control) {
    return '<div class="form-row"><div class="form-label">' + label + (desc ? '<div class="desc">' + desc + '</div>' : '') + '</div>' +
      '<div class="form-control">' + control + '</div></div>';
  }
  function toggleRow(title, desc, on, key) {
    return '<div class="toggle-row"><div><div class="tr-title">' + title + '</div><div class="tr-desc">' + desc + '</div></div>' +
      '<span class="switch ' + (on ? 'on' : '') + '" data-action="toggle-setting" data-key="' + key + '"></span></div>';
  }

  TR.ensureLetter = ensureLetter;
  TR.views = {
    dashboard: renderDashboard,
    candidates: renderCandidates,
    jobs: renderJobs,
    matching: renderMatches,
    letters: renderLetters,
    mails: renderMails,
    sources: renderSources,
    settings: renderSettings
  };
})(window.TR);
