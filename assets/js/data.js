/* 才探 TalentRadar · 数据层：演示种子数据、本地持久化、匹配与文案生成 */
window.TR = window.TR || {};

(function (TR) {
  'use strict';

  var KEY = 'talent-radar-state-v2';
  var HOUR = 3600 * 1000;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function hoursAgo(h) { return new Date(Date.now() - h * HOUR).toISOString(); }
  function daysAgo(d) { return new Date(Date.now() - d * 24 * HOUR).toISOString(); }
  function dayLabel(d) {
    var dt = new Date(Date.now() - d * 24 * HOUR);
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  }

  var companyColors = ['#EEF0FF|#4F46E5', '#ECFEFF|#0891B2', '#ECFDF5|#059669', '#FFFBEB|#D97706', '#F5F3FF|#7C3AED', '#FEF2F2|#DC2626'];
  function colorOf(name) {
    var s = 0, i;
    for (i = 0; i < name.length; i++) s += name.charCodeAt(i);
    return companyColors[s % companyColors.length].split('|');
  }

  function seed() {
    return {
      version: 1,
      company: {
        name: '星河人才科技',
        hrName: '林悦',
        hrTitle: '招聘负责人',
        hrEmail: 'hr@xinghe-talent.com',
        senderEmail: 'radar@xinghe-talent.com',
        smtpHost: 'smtp.exmail.qq.com',
        smtpPort: '465',
        model: 'Hunyuan-T1',
        temperature: '0.4',
        threshold: 75,
        autoPush: false,
        dailyDigest: true,
        cc: 'talent@xinghe-talent.com'
      },
      candidates: [
        { id: 'c1', name: '陈思远', title: '高级前端工程师', years: 6, education: '本科', school: '浙江大学', city: '上海', salary: '35-45K', phone: '138****6021', email: 'chensy@example.com', skills: ['React', 'TypeScript', 'Next.js', '微前端', 'Node.js', '性能优化'], status: 'matched', resume: '陈思远_高级前端工程师.pdf', intent: '看好 AI + 前端方向，希望加入有技术氛围的团队', highlight: '主导过 3 个百万级 DAU 产品的前端架构升级，首屏性能提升 42%', uploadedAt: hoursAgo(52) },
        { id: 'c2', name: '林知夏', title: 'AI 算法工程师', years: 4, education: '硕士', school: '上海交通大学', city: '北京', salary: '40-55K', phone: '139****3388', email: 'linzx@example.com', skills: ['PyTorch', 'LLM', 'RAG', 'Python', 'Transformer', '模型微调'], status: 'matched', resume: '林知夏_算法工程师简历.pdf', intent: '专注大模型落地，期望参与核心模型研发', highlight: '负责企业知识库 RAG 系统，问答准确率从 71% 提升至 93%', uploadedAt: hoursAgo(46) },
        { id: 'c3', name: '王浩然', title: 'Go 后端工程师', years: 5, education: '本科', school: '华中科技大学', city: '深圳', salary: '30-42K', phone: '137****9145', email: 'wanghr@example.com', skills: ['Go', '微服务', 'K8s', 'MySQL', 'Redis', '高并发'], status: 'pushed', resume: '王浩然_后端开发.pdf', intent: '寻找高并发业务场景，偏好基础设施方向', highlight: '支撑日均 8 亿次请求的交易网关，完成服务治理与全链路压测', uploadedAt: hoursAgo(40) },
        { id: 'c4', name: '赵一诺', title: 'B 端产品经理', years: 4, education: '本科', school: '南京大学', city: '上海', salary: '25-35K', phone: '136****7712', email: 'zhaoyn@example.com', skills: ['B端产品', '需求分析', 'SaaS', '数据分析', 'Axure'], status: 'matched', resume: '赵一诺_产品经理.pdf', intent: '希望负责从 0 到 1 的企业级产品线', highlight: '主导 SaaS 产品从 0 到 1，上线 10 个月ARR 突破 800 万', uploadedAt: hoursAgo(34) },
        { id: 'c5', name: '苏晚', title: 'UI / UX 设计师', years: 3, education: '本科', school: '中国美术学院', city: '杭州', salary: '20-30K', phone: '135****2046', email: 'suwan@example.com', skills: ['Figma', '设计系统', '交互设计', '用户研究', '原型'], status: 'parsed', resume: '苏晚_作品集与简历.pdf', intent: '关注 B 端设计体系与 AI 产品体验', highlight: '搭建公司级设计系统，覆盖 6 条产品线，交付效率提升 35%', uploadedAt: hoursAgo(28) },
        { id: 'c6', name: '周子墨', title: '数据分析师', years: 3, education: '硕士', school: '复旦大学', city: '上海', salary: '22-32K', phone: '188****4409', email: 'zhouzm@example.com', skills: ['SQL', 'Python', 'Tableau', 'BI', '指标体系', 'AB测试'], status: 'parsed', resume: '周子墨_数据分析.pdf', intent: '希望深入业务决策与增长分析', highlight: '构建增长指标体系，推动实验效率提升 2 倍', uploadedAt: hoursAgo(21) },
        { id: 'c7', name: '吴嘉懿', title: '大模型应用工程师', years: 5, education: '硕士', school: '北京航空航天大学', city: '北京', salary: '45-60K', phone: '186****8823', email: 'wujy@example.com', skills: ['LLM', 'Agent', 'LangChain', 'RAG', 'Prompt', '向量数据库'], status: 'matched', resume: '吴嘉懿_LLM应用.pdf', intent: '想做真正落地的 Agent 产品', highlight: '落地企业级多 Agent 客服系统，人工转接率下降 58%', uploadedAt: hoursAgo(14) },
        { id: 'c8', name: '郑雨桐', title: '测试开发工程师', years: 4, education: '本科', school: '电子科技大学', city: '深圳', salary: '22-32K', phone: '159****1270', email: 'zhengyt@example.com', skills: ['自动化测试', 'Pytest', 'CI-CD', 'Python', '性能测试'], status: 'parsed', resume: '郑雨桐_测开简历.pdf', intent: '关注质量工程与研发效能', highlight: '搭建自动化测试平台，回归测试耗时由 6 小时降至 40 分钟', uploadedAt: hoursAgo(6) }
      ],
      jobs: [
        { id: 'j1', title: '微信小程序-前端开发工程师-开发者方向', company: '腾讯·WXG', city: '广州', salary: '35-50K', minSalary: 35, maxSalary: 50, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=1891443603608215552', tags: ['React', 'TypeScript', 'Next.js', '微前端', 'Node.js'], minYears: 5, minEdu: '本科', jd: '1. 负责小程序开发者生态 & 服务商相关项目的前端开发工作 2. 负责 AI 技术与小程序开发生态结合的相关工作，通过 AI 给开发者和商家提效、赋能 3. 参与技术基建，持续优化研发效能，提升团队工程效率', publishedAt: hoursAgo(9), collectedAt: hoursAgo(8) },
        { id: 'j2', title: '金融大模型-算法工程师', company: '腾讯·CDG', city: '深圳', salary: '45-70K', minSalary: 45, maxSalary: 70, headcount: 3, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2101507113946886144', tags: ['PyTorch', 'LLM', 'RAG', 'Python', 'Transformer', '模型微调'], minYears: 3, minEdu: '硕士', jd: '1.负责金融领域大模型预训练与后训练工作，包括但不限于持续预训练、强化学习、模型结构优化等关键环节，提升模型在金融领域的专业性与泛化能力； 2.主导后训练对齐算法的技术实践，包括但不限于设计奖励机制、训练策略等，大幅度提升金融场景下的用户偏好和深度需求满足； 3.聚焦金融核心业务场景，构建大模型驱动的解决方案，推动技术成果产品化，构建端到端金融智能应用系统。', publishedAt: hoursAgo(13), collectedAt: hoursAgo(11) },
        { id: 'j3', title: 'AI后台开发工程师', company: '腾讯·TEG', city: '深圳', salary: '30-45K', minSalary: 30, maxSalary: 45, headcount: 4, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2066810094796058624', tags: ['Go', '微服务', 'K8s', 'Redis', '高并发', 'MySQL'], minYears: 4, minEdu: '本科', jd: '1.参与游戏 AI 应用的基础设施建设，负责 GameAgent 后台系统核心框架组件开发；支持游戏智能 NPC、UGC 等 LLM 驱动的 GameAgent 业务落地，并完善 GameAgent 统一基础设施； 2.负责大模型应用的全链路工程化与开发运营体系建设，通过自动化、平台化、智能化（AI 提效）推动团队研发效能系统性提升； 3.负责后台架构和性能优化工作，保障服务高并发、低延迟、高可用…', publishedAt: hoursAgo(20), collectedAt: hoursAgo(19) },
        { id: 'j4', title: 'AI产品经理', company: '腾讯·TEG', city: '深圳', salary: '25-38K', minSalary: 25, maxSalary: 38, headcount: 1, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2092538895714664448', tags: ['B端产品', 'SaaS', '需求分析', '数据分析'], minYears: 3, minEdu: '本科', jd: '1.负责企业 AI Agent 平台产品规划与建设，推动核心产品能力设计、研发协同及版本迭代； 2.负责 IMate 相关产品方向，包括基础能力建设、研发工作流集成、开放平台能力建设等； 3.结合企业内部研发和办公场景，洞察用户需求，探索 AI Agent 提升工作效率的新模式，并推动产品落地； 4.持续跟踪 AI 技术和行业发展趋势，推动产品能力、用户体验及应用规模持续提升。', publishedAt: hoursAgo(26), collectedAt: hoursAgo(25) },
        { id: 'j5', title: '《逆战：未来》交互设计师', company: '腾讯·IEG', city: '深圳', salary: '22-35K', minSalary: 22, maxSalary: 35, headcount: 1, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2077217624193937408', tags: ['Figma', '设计系统', '交互设计', '用户研究', '原型'], minYears: 3, minEdu: '本科', jd: '1.根据现有版本内容框架，负责游戏的交互设计拓展及战斗玩法体验的持续优化； 2.与跨职能团队合作，从交互专业角度创新高效地提出游戏设计方案； 3.跟进UI界面设计的各阶段，从方案概念到视觉设计，从界面开发到最终的功能验证； 4.运用线框图、故事板、用户流程等工具，有效传达交互和设计思路； 5.持续对游戏内容进行用户研究，收集体验反馈并输出优化方案，以提升玩家体验； 6.完善交互规范细则，持续提升项…', publishedAt: hoursAgo(31), collectedAt: hoursAgo(30) },
        { id: 'j6', title: 'ima-数据分析师', company: '腾讯·CSIG', city: '深圳', salary: '22-32K', minSalary: 22, maxSalary: 32, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2112491755923484672', tags: ['SQL', 'Python', 'BI', '指标体系', 'AB测试', 'Tableau'], minYears: 2, minEdu: '本科', jd: '1.负责腾讯ima产品的核心业务数据的分析与监控，搭建并维护关键数据指标体系； 2.深入理解业务逻辑，通过数据分析挖掘潜在问题，提出优化建议； 3.支持团队的数据分析需求，负责业务的经营分析，协助团队看清业务经营现状。', publishedAt: hoursAgo(38), collectedAt: hoursAgo(37) },
        { id: 'j7', title: 'AI智能体评测高级工程师', company: '腾讯·CSIG', city: '北京', salary: '45-65K', minSalary: 45, maxSalary: 65, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2054531247396532224', tags: ['LLM', 'Agent', 'LangChain', 'RAG', '向量数据库', 'Prompt'], minYears: 3, minEdu: '本科', jd: '1.负责腾讯自研龙虾WorkBuddy/腾讯AI IDE CodeBuddy产品质量保障及AI评测工作，推动产品质量体系，生成效果提升； 2.负责大语言模型（LLM）及Agent系统的评测体系设计与持续演进，覆盖模型能力评测、Agent任务评测、端到端产品功能评测等，构建Benchmark； 3.跟踪业界评测基准动态（如 SWE-bench、HumanEval、MMLU、AgentBench 等）…', publishedAt: hoursAgo(5), collectedAt: hoursAgo(4) },
        { id: 'j8', title: '腾讯云-平台测试工程师', company: '腾讯·CSIG', city: '深圳', salary: '22-35K', minSalary: 22, maxSalary: 35, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2095053968454627328', tags: ['自动化测试', 'Pytest', 'CI-CD', 'Python', '性能测试'], minYears: 3, minEdu: '本科', jd: '1.负责腾讯云计费、交易，身份中心相关业务系统的测试工作，保障核心链路的产品质量； 2.独立承担测试计划制定、用例设计与执行，跟进缺陷并推动修复闭环； 3.参与团队质量能力建设，包括自动化测试、测试工具开发、测试环境搭建维护、性能压测等方向，持续提升研发与测试效率； 4.关注线上质量，参与线上问题分析、复盘与改进，持续优化测试策略。', publishedAt: hoursAgo(44), collectedAt: hoursAgo(43) },
        { id: 'j9', title: '腾讯AI网盘全栈开发高级工程师', company: '腾讯·CSIG', city: '深圳', salary: '50-70K', minSalary: 50, maxSalary: 70, headcount: 1, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2112898585224982528', tags: ['React', 'TypeScript', '微前端', '性能优化', '架构设计'], minYears: 7, minEdu: '本科', jd: '1.负责腾讯AI网盘核心产品 Web 端及桌面客户端（Windows / Mac）的研发与迭代，包括文件管理、分享协作、搜索预览等核心功能，保障多端功能一致性与极致用户体验； 2.借助 AI 辅助编程工具，独立完成从前端交互、客户端到 BFF / 后台接口的全栈功能落地，持续提升研发效率； 3.参与网盘权限管理与资产管理相关功能的研发，涵盖组织架构、成员与角色权限、文件/目录访问控制、分享权限、空…', publishedAt: hoursAgo(50), collectedAt: hoursAgo(49) },
        { id: 'j10', title: '机器学习平台SRE工程师（深圳/北京）', company: '腾讯·TEG', city: '深圳', salary: '40-60K', minSalary: 40, maxSalary: 60, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2117825039658299392', tags: ['PyTorch', 'Python', 'K8s', '模型部署', 'MLOps'], minYears: 4, minEdu: '本科', jd: '1.负责机器学习平台的整体 SLA/SLO 定义、监控告警体系建设与故障应急响应，持续提升系统可用性，保障平台各个链路的稳定通畅； 2.负责机器学习平台的架构治理，容灾设计，性能调优。对接AI训练链路、资源调度与存储能力，参与业务和系统的问题排查工作； 3.负责运维运营工作自动化，借助AI能力来解决日常工作问题，包括资源管理、变更管理、故障恢复、用户工具诊断接口/mcp等。', publishedAt: hoursAgo(58), collectedAt: hoursAgo(57) },
        { id: 'j11', title: '增长产品经理（AI/Agent 方向）', company: '腾讯·PCG', city: '深圳', salary: '24-36K', minSalary: 24, maxSalary: 36, headcount: 1, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2089943379306786816', tags: ['数据分析', 'AB测试', '增长', '需求分析', 'SaaS'], minYears: 3, minEdu: '本科', jd: '1.增长产品建设：负责AI产品海外增长相关功能的设计与迭代，围绕 SEO（搜索引擎优化）、GEO（生成式引擎优化）、社媒达人合作、广告投放等场景，建设可复用的增长工具与能力，提升获客和转化效率； 2.AI 产品设计与迭代：参与 AI 产品的功能设计与优化，包括 Agent 的需求分析、功能定义和体验优化；结合用户反馈与使用数据，持续提升产品价值，促进用户转化与留存； 3.增长数据体系搭建：建立增长…', publishedAt: hoursAgo(66), collectedAt: hoursAgo(65) },
        { id: 'j12', title: '证券-AI全栈开发专家', company: '腾讯·CDG', city: '深圳', salary: '30-45K', minSalary: 30, maxSalary: 45, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2104513138056675328', tags: ['React', 'Node.js', 'TypeScript', 'MySQL', 'Go'], minYears: 4, minEdu: '本科', jd: '1.负责 腾讯证券体系 AI研发工作，覆盖 自选股APP / 微证券小程序/ 问元宝智能体、智能体套件、运营平台等； 2.负责系统架构的设计与演进，负责产品标准化、多产品融合等方向的技术方案规划，输出高质量设计文档，协调各团队落地； 3.推动 AI 研发流程标准化，制定迭代计划并把控交付节奏，保证功能在多客户、多环境下按时高质量交付； 4.构建 AI 研发质量监控体系，主导性能容量、稳定性治理与体…', publishedAt: hoursAgo(72), collectedAt: hoursAgo(71) }
      ],
      sources: [
        { id: 's1', name: '腾讯招聘 · 社招', type: '企业官网', url: 'https://careers.tencent.com/search.html', enabled: true, frequency: '每 2 小时', lastRun: hoursAgo(1), count: 128, status: 'ok' },
        { id: 's2', name: '字节跳动 · 社招', type: '企业官网', url: 'https://jobs.bytedance.com/experienced/position', enabled: true, frequency: '每 4 小时', lastRun: hoursAgo(2), count: 86, status: 'ok' },
        { id: 's3', name: '网易 · 社会招聘', type: '企业官网', url: 'https://hr.163.com/', enabled: true, frequency: '每 2 小时', lastRun: hoursAgo(1), count: 54, status: 'ok' },
        { id: 's4', name: '美团招聘', type: '企业官网', url: 'https://zhaopin.meituan.com/', enabled: true, frequency: '每日 09:00', lastRun: hoursAgo(9), count: 213, status: 'ok' },
        { id: 's5', name: '小米招聘', type: '企业官网', url: 'https://hr.xiaomi.com/', enabled: true, frequency: '每日 09:00', lastRun: hoursAgo(9), count: 97, status: 'ok' },
        { id: 's6', name: '华为招聘', type: '企业官网', url: 'https://career.huawei.com/', enabled: true, frequency: '每 1 小时', lastRun: hoursAgo(1), count: 462, status: 'ok' },
        { id: 's7', name: '猎聘 · 职位订阅', type: '招聘平台', url: 'https://www.liepin.com/', enabled: false, frequency: '每 4 小时', lastRun: hoursAgo(30), count: 176, status: 'paused' },
        { id: 's8', name: 'BOSS直聘 · 职位订阅', type: '招聘平台', url: 'https://www.zhipin.com/', enabled: true, frequency: '每 6 小时', lastRun: hoursAgo(3), count: 141, status: 'ok' }
      ],
      mails: [
        { id: 'm1', candidateId: 'c3', jobId: 'j3', to: 'hr@tencent.com', subject: '【才探 TalentRadar 推荐】王浩然 · AI后台开发工程师｜匹配度 96%', body: '', status: 'replied', sentAt: hoursAgo(30) },
        { id: 'm2', candidateId: 'c1', jobId: 'j1', to: 'hr@tencent.com', subject: '【才探 TalentRadar 推荐】陈思远 · 微信小程序-前端开发工程师-开发者方向｜匹配度 94%', body: '', status: 'opened', sentAt: hoursAgo(22) },
        { id: 'm3', candidateId: 'c7', jobId: 'j7', to: 'hr@tencent.com', subject: '【才探 TalentRadar 推荐】吴嘉懿 · AI智能体评测高级工程师｜匹配度 95%', body: '', status: 'opened', sentAt: hoursAgo(17) },
        { id: 'm4', candidateId: 'c2', jobId: 'j2', to: 'hr@tencent.com', subject: '【才探 TalentRadar 推荐】林知夏 · 金融大模型-算法工程师｜匹配度 91%', body: '', status: 'sent', sentAt: hoursAgo(11) },
        { id: 'm5', candidateId: 'c4', jobId: 'j4', to: 'hr@tencent.com', subject: '【才探 TalentRadar 推荐】赵一诺 · AI产品经理｜匹配度 89%', body: '', status: 'sent', sentAt: hoursAgo(6) },
        { id: 'm6', candidateId: 'c6', jobId: 'j6', to: 'hr@tencent.com', subject: '【才探 TalentRadar 推荐】周子墨 · ima-数据分析师｜匹配度 87%', body: '', status: 'failed', sentAt: hoursAgo(3) }
      ],
      letters: [],
      activities: [
        { id: 'a1', type: 'mail', text: '推荐邮件已送达 <b>星云智能</b>，候选人 周子墨 · 数据分析师', time: hoursAgo(3) },
        { id: 'a2', type: 'parse', text: 'AI 完成简历解析：<b>郑雨桐_测开简历.pdf</b>，抽取 5 项技能', time: hoursAgo(6) },
        { id: 'a3', type: 'mail', text: '向 <b>序列科技</b> 推送候选人 赵一诺 · B 端产品经理', time: hoursAgo(6) },
        { id: 'a4', type: 'crawl', text: '企业官网采集完成，新增 <b>3</b> 个岗位（元启智能）', time: hoursAgo(8) },
        { id: 'a5', type: 'mail', text: '<b>深蓝 AI</b> 已打开推荐邮件：林知夏 · 大模型算法工程师', time: hoursAgo(10) },
        { id: 'a6', type: 'match', text: 'AI 生成 <b>18</b> 条新的候选人-岗位匹配', time: hoursAgo(12) },
        { id: 'a7', type: 'crawl', text: '公众号「AI 招聘观察」采集到 <b>5</b> 条招聘信息', time: hoursAgo(14) },
        { id: 'a8', type: 'match', text: '<b>云帆科技</b> 回复：希望安排 王浩然 的面试', time: hoursAgo(30) }
      ],
      trend: [
        { date: dayLabel(6), matches: 12, pushes: 3 },
        { date: dayLabel(5), matches: 18, pushes: 5 },
        { date: dayLabel(4), matches: 15, pushes: 4 },
        { date: dayLabel(3), matches: 26, pushes: 7 },
        { date: dayLabel(2), matches: 22, pushes: 6 },
        { date: dayLabel(1), matches: 31, pushes: 9 },
        { date: dayLabel(0), matches: 38, pushes: 11 }
      ],
      logs: [
        { time: hoursAgo(0.2), level: 'info', text: '[scheduler] 下一轮采集任务已排期 · 60min 后' },
        { time: hoursAgo(1), level: 'ok', text: '[官网] careers.tencent.com/search.html → 2 条新增 / 0 条更新' },
        { time: hoursAgo(1.1), level: 'ok', text: '[平台] BOSS直聘 关键词订阅 → 7 条新增，去重 3 条' },
        { time: hoursAgo(2), level: 'ok', text: '[官网] jobs.bytedance.com/experienced/position → 1 条新增 / 1 条下架' },
        { time: hoursAgo(3), level: 'info', text: '[邮件] hr@tencent.com 投递失败重试队列已清空' },
        { time: hoursAgo(4), level: 'ok', text: '[官网] hr.163.com → 3 条新增（AI Agent ×2）' }
      ],
      seq: 100
    };
  }

  var memoryFallback = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) return parsed;
      }
    } catch (e) { /* file:// 或隐私模式下 localStorage 不可用，降级内存 */ }
    var s = seed();
    memoryFallback = s;
    return s;
  }

  /* 初始状态也要走 normalize：否则演示模式内置种子岗位 / 旧版本 localStorage
   * 快照会缺少 companyType、fundingStage 等新字段，排行榜公司画像标签为空。 */
  var state = normalize(load());

  /* ---------- 后端快照 → 前端 state 的规范化 ----------
   * Spring Boot 返回的是 JPA 实体的 JSON，字段可能与演示 seed 略有差异
   * （例如 null 值被 Jackson 省略）。这里补齐默认值，保证视图层永不读到 undefined。
   * 采用「原地替换字段」而不是换掉 state 引用，页面里已持有的 st 变量仍指向同一对象。 */
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d || 0); }
  function nowIso() { return new Date().toISOString(); }

  function normalize(snap) {
    var base = seed(), co = {};
    Object.keys(base.company).forEach(function (k) { co[k] = base.company[k]; });
    if (snap.company && typeof snap.company === 'object') {
      Object.keys(snap.company).forEach(function (k) {
        if (snap.company[k] !== null && snap.company[k] !== undefined) co[k] = snap.company[k];
      });
    }
    var trendRaw = arr(snap.trend).length ? arr(snap.trend) : base.trend;
    return {
      version: 1,
      company: co,
      candidates: arr(snap.candidates).map(function (c, i) {
        return {
          id: c.id || 'c' + (i + 1), name: c.name || '未命名候选人', title: c.title || '候选人',
          years: num(c.years), education: c.education || '本科', school: c.school || '待补充',
          city: c.city || '—', salary: c.salary || '', phone: c.phone || '', email: c.email || '',
          skills: arr(c.skills), status: c.status || 'parsed', resume: c.resume || '',
          intent: c.intent || '', highlight: c.highlight || '', uploadedAt: c.uploadedAt || nowIso()
        };
      }),
      jobs: arr(snap.jobs).map(function (j, i) {
        return {
          id: j.id || 'j' + (i + 1), title: j.title || '岗位', company: j.company || '企业',
          city: j.city || '—', salary: j.salary || '', minSalary: num(j.minSalary),
          maxSalary: num(j.maxSalary), headcount: num(j.headcount, 1),
          source: j.source || '企业官网', sourceName: j.sourceName || '采集源', url: j.url || '',
          /* 早期种子岗位都是腾讯官方 JD，补上公司画像，保证筛选口径一致 */
          companyType: j.companyType || (String(j.company || '').indexOf('腾讯') === 0 ? '互联网大厂' : ''),
          fundingStage: j.fundingStage || (String(j.company || '').indexOf('腾讯') === 0 ? '已上市' : ''),
          tags: arr(j.tags), minYears: num(j.minYears), minEdu: j.minEdu || '本科',
          jd: j.jd || '', publishedAt: j.publishedAt || nowIso(), collectedAt: j.collectedAt || nowIso()
        };
      }),
      sources: arr(snap.sources).map(function (s, i) {
        return {
          id: s.id || 's' + (i + 1), name: s.name || '数据源', type: s.type || '企业官网',
          url: s.url || '', enabled: s.enabled !== false, frequency: s.frequency || '每 60 分钟',
          lastRun: s.lastRun || null, count: num(s.count), status: s.status || 'ok'
        };
      }),
      mails: arr(snap.mails).map(function (m, i) {
        return {
          id: m.id || 'm' + (i + 1), candidateId: m.candidateId || '', jobId: m.jobId || '',
          to: m.to || '', subject: m.subject || '', body: m.body || '',
          status: m.status || 'sent', sentAt: m.sentAt || nowIso()
        };
      }),
      letters: arr(snap.letters).map(function (l, i) {
        return {
          id: l.id || 'l' + (i + 1), candidateId: l.candidateId || '', jobId: l.jobId || '',
          tone: l.tone || 'professional', subject: l.subject || '', body: l.body || '',
          createdAt: l.createdAt || nowIso()
        };
      }),
      activities: arr(snap.activities).map(function (a, i) {
        return { id: a.id || 'a' + (i + 1), type: a.type || 'crawl', text: a.text || '', time: a.time || nowIso() };
      }),
      trend: trendRaw.map(function (t) {
        return { date: t.date || '', matches: num(t.matches), pushes: num(t.pushes) };
      }),
      logs: arr(snap.logs).map(function (l) {
        return { time: l.time || nowIso(), level: l.level || 'ok', text: l.text || '' };
      }),
      seq: num(snap.seq, base.seq)
    };
  }

  function assignState(next) {
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.keys(next).forEach(function (k) { state[k] = next[k]; });
    return state;
  }

  var Store = {
    get state() { return state; },
    /** 演示模式写 localStorage；服务模式防抖回写 Spring Boot / MySQL */
    save: function () {
      if (TR.api && TR.api.mode === 'server') { TR.api.pushState(state); return; }
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { memoryFallback = state; }
    },
    /** 用后端 /api/bootstrap 快照覆盖内存状态（不污染本地演示副本） */
    replace: function (snap) { return assignState(normalize(snap || {})); },
    /** 切回演示模式时恢复浏览器本地副本 */
    restoreLocal: function () { return assignState(normalize(load())); },
    reset: function () {
      assignState(normalize(seed()));
      this.save();
      return state;
    },
    uid: function (p) { state.seq += 1; return (p || 'x') + state.seq; },
    byId: function (list, id) {
      for (var i = 0; i < state[list].length; i++) if (state[list][i].id === id) return state[list][i];
      return null;
    },
    candidate: function (id) { return this.byId('candidates', id); },
    job: function (id) { return this.byId('jobs', id); },
    log: function (type, text) {
      state.activities.unshift({ id: this.uid('a'), type: type, text: text, time: new Date().toISOString() });
      if (state.activities.length > 40) state.activities.length = 40;
      this.save();
    },
    addLog: function (text, level) {
      state.logs.unshift({ time: new Date().toISOString(), level: level || 'ok', text: text });
      if (state.logs.length > 30) state.logs.length = 30;
      this.save();
    },
    bumpTrend: function (kind, n) {
      var t = state.trend[state.trend.length - 1];
      if (!t) return;
      t[kind] = (t[kind] || 0) + (n || 1);
      this.save();
    }
  };

  /* ---------- 匹配算法（可解释的加权评分） ---------- */
  function eduLevel(e) { return { '大专': 1, '本科': 2, '硕士': 3, '博士': 4 }[e] || 2; }

  function matchScore(c, j) {
    var hits = [], i;
    for (i = 0; i < j.tags.length; i++) if (c.skills.indexOf(j.tags[i]) !== -1) hits.push(j.tags[i]);
    var skill = Math.round(100 * hits.length / Math.max(1, j.tags.length));
    skill = Math.min(96, skill + Math.min(6, Math.round((c.skills.length - hits.length) * 2)));

    var exp;
    if (c.years >= j.minYears) exp = Math.min(92, 82 + (c.years - j.minYears) * 4);
    else exp = Math.max(40, 82 - (j.minYears - c.years) * 13);

    var edu = c.education === j.minEdu || eduLevel(c.education) >= eduLevel(j.minEdu) ? 92 : 64;
    var city = c.city === j.city ? 100 : 55;

    var cMin = parseInt(c.salary, 10) || 0;
    var salary = (cMin <= j.maxSalary && cMin >= j.minSalary - 8) ? 90 : (cMin < j.minSalary ? 70 : 64);

    var total = Math.round(skill * .38 + exp * .21 + edu * .09 + city * .16 + salary * .16);
    /* 稳定折损：语义匹配中与显式标签无关的细微差异，保证同一对结果始终一致 */
    var key = c.id + '|' + j.id, hash = 0;
    for (i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 1013;
    var penalty = hash % 9;
    total = Math.max(46, Math.min(97, total - penalty));
    return {
      total: total,
      dims: { skill: skill, exp: exp, edu: edu, city: city, salary: salary },
      hits: hits
    };
  }

  function topMatches(candidateId, limit) {
    var c = Store.candidate(candidateId);
    if (!c) return [];
    var out = [];
    for (var i = 0; i < state.jobs.length; i++) {
      var m = matchScore(c, state.jobs[i]);
      out.push({ job: state.jobs[i], score: m.total, dims: m.dims, hits: m.hits });
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return limit ? out.slice(0, limit) : out;
  }

  function bestScoreFor(candidateId) {
    var t = topMatches(candidateId, 1);
    return t.length ? t[0].score : 0;
  }

  /* 公司画像：「腾讯·WXG」→「腾讯」，用于多公司筛选与多样性统计 */
  function companyKey(j) {
    var s = (j && j.company) || '其它', i = s.indexOf('·');
    return (i > 0 ? s.slice(0, i) : s).trim();
  }

  /** 与后端 MatchingService.diversify 同规则：
   *  每家公司最多 cap 个；同时按「企业官网 / 招聘平台 / 微信公众号」分配名额，
   *  保证 Top100 三类来源都有覆盖，名额不足再按分数补齐；最终仍按分数降序。 */
  var SOURCE_QUOTA = [['企业官网', 0.5], ['招聘平台', 0.3], ['微信公众号', 0.2]];
  function diversify(list, limit, cap) {
    cap = cap || 10;
    var buckets = { '企业官网': [], '招聘平台': [], '微信公众号': [], '其它': [] };
    list.forEach(function (m) {
      var s = (m.job && m.job.source) || '其它';
      (buckets[s] || buckets['其它']).push(m);
    });
    var used = {}, picked = [], taken = {};
    function key(m) { return (m.job.id || '') + '|' + (m.job.url || ''); }
    function add(m) {
      if (picked.length >= limit || taken[key(m)]) return false;
      var k = companyKey(m.job), n = used[k] || 0;
      if (n >= cap) return false;
      picked.push(m); used[k] = n + 1; taken[key(m)] = 1;
      return true;
    }
    SOURCE_QUOTA.forEach(function (q) {
      var want = Math.round(limit * q[1]), n = 0, arr = buckets[q[0]] || [];
      for (var i = 0; i < arr.length && n < want; i++) if (add(arr[i])) n++;
    });
    list.forEach(function (m) { if (picked.length < limit) add(m); });
    /* 公司限额导致名额仍不足时，按分数放宽补齐（与原 overflow 语义一致） */
    list.forEach(function (m) {
      if (picked.length >= limit || taken[key(m)]) return;
      picked.push(m); taken[key(m)] = 1;
    });
    picked.sort(function (a, b) { return b.score - a.score; });
    return picked;
  }

  function matchReason(c, j, m) {
    var hit = m.hits.slice(0, 3).join('、') || '相关技术栈';
    var parts = [
      '候选人的「' + hit + '」与该岗位核心要求直接吻合，技能覆盖率 ' + m.dims.skill + '%；' +
      c.years + ' 年' + c.title + '经验' + (c.years >= j.minYears ? '达到并略高于岗位 ' + j.minYears + ' 年门槛' : '略低于岗位 ' + j.minYears + ' 年门槛，但项目复杂度可补足') + '。',
      '候选人长期深耕「' + hit + '」，与「' + j.title + '」的技术栈高度重合；其' + c.highlight + '，可直接迁移到该岗位的核心场景。',
      '从' + c.title + '到「' + j.title + '」属于同方向平移，' + hit + ' 经验可无缝衔接；' +
      (c.city === j.city ? '两者同在' + c.city + '，无需异地搬迁。' : '候选人意向城市为' + c.city + '，建议确认异地或远程可能性。')
    ];
    var i = (c.id.charCodeAt(1) + j.id.charCodeAt(1)) % parts.length;
    var extra = c.city === j.city ? '' : ' 需留意城市偏好差异。';
    return parts[i] + extra;
  }

  /* ---------- 推荐语生成（模板 + 变体，模拟 AI 文案） ---------- */
  var toneLabels = { professional: '专业正式', warm: '亲和推荐', concise: '简洁高效' };

  function generateLetter(c, j, score, tone, variant) {
    var v = (variant || 0) % 3;
    var hit = [];
    for (var i = 0; i < j.tags.length; i++) if (c.skills.indexOf(j.tags[i]) !== -1) hit.push(j.tags[i]);
    var hitText = hit.slice(0, 4).join('、') || '岗位相关技术栈';
    var co = state.company;
    var mm = matchScore(c, j);
    var openings = {
      professional: [
        '尊敬的 ' + j.company + ' 招聘团队：\n\n您好！基于才探 TalentRadar 的岗位与人才画像比对，谨向贵司推荐一位与「' + j.title + '」高度契合的候选人。',
        '尊敬的 ' + j.company + ' 人力资源部：\n\n您好！我们注意到贵司正在招募「' + j.title + '」，经 AI 匹配评估，现向您推荐下列人选。'
      ],
      warm: [
        '您好，' + j.company + ' 的招聘伙伴：\n\n发现一位和「' + j.title + '」特别合拍的候选人，想第一时间分享给您。',
        'Hi，' + j.company + ' 团队：\n\n刚完成一轮人才筛选，有位候选人和贵司「' + j.title + '」的画像非常贴近，推荐给您看看。'
      ],
      concise: [
        '您好，推荐「' + j.title + '」候选人 ' + c.name + '（匹配度 ' + score + '%）。',
        '贵司「' + j.title + '」岗位匹配到人选：' + c.name + '，匹配度 ' + score + '%。'
      ]
    };
    var bodies = [
      '\n\n【候选人】' + c.name + '｜' + c.title + '｜' + c.years + ' 年经验｜' + c.education + ' · ' + c.school + '｜现居 ' + c.city +
      '\n【匹配度】' + score + '%（技能覆盖 ' + mm.dims.skill + '% / 经验年限 ' + mm.dims.exp + '% / 城市与薪资适配）' +
      '\n【核心能力】' + hitText + '，与岗位要求的 ' + j.tags.slice(0, 4).join('、') + ' 高度重合。' +
      '\n【代表成果】' + c.highlight + '。' +
      '\n【推荐理由】' + matchReason(c, j, mm),
      '\n\n' + c.name + ' 现任' + c.title + '，' + c.years + ' 年相关经验，毕业于 ' + c.school + '。其最亮眼的一段经历是：' + c.highlight + '。' +
      '\n\n对照贵司 JD 中「' + j.jd.slice(0, 42) + '…」的职责描述，候选人在 ' + hitText + ' 上有直接的项目沉淀，预计上手周期较短。' +
      '\n\n候选人当前期望 ' + c.salary + '，与岗位 ' + j.salary + ' 的区间基本吻合；求职意向为「' + c.intent + '」，与团队方向一致。'
    ];
    var closes = {
      professional: '\n\n如贵司认为合适，我们可协助安排初步沟通，并提供完整简历与作品/项目材料。\n\n顺颂商祺\n' + co.hrName + '｜' + co.hrTitle + '\n' + co.name + '\n' + co.hrEmail,
      warm: '\n\n如果您对这位候选人感兴趣，回一封邮件或直接告诉我，我马上把完整简历发过来，也可以帮忙约个时间聊一聊。\n\n祝招聘顺利！\n' + co.hrName + '\n' + co.hrEmail,
      concise: '\n\n简历与联系方式见附件，如需安排面试请回复本邮件。\n\n' + co.hrName + '｜' + co.hrEmail
    };
    var open = openings[tone][v % openings[tone].length];
    var body = bodies[v % bodies.length];
    if (tone === 'concise') body = bodies[0];
    return open + body + closes[tone];
  }

  function letterSubject(c, j, score) {
    return '【才探 TalentRadar 推荐】' + c.name + ' · ' + j.title + '｜匹配度 ' + score + '%';
  }

  /* ---------- 时间格式化 ---------- */
  function fmtDate(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function fmtDateTime(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function timeAgo(iso) {
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
    return fmtDate(iso);
  }

  /* 视图交互状态（不持久化） */
  TR.ui = {
    page: 'dashboard',
    candFilter: 'all', candSearch: '',
    jobSource: 'all', jobSearch: '',
    matchCandidate: 'c1', matchOnlyHigh: false,
    marketMode: 'detail', marketPage: 1, marketPool: 0, marketScanning: false,
    marketFilter: 'all', marketSource: 'all', marketCoverage: null,
    letterCandidate: 'c1', letterJob: 'j1', letterTone: 'professional',
    letterVariant: 0, letterKey: '', letterText: '', letterTo: '',
    mailFilter: 'all', sourceType: 'all',
    toggles: { trackOpen: true, dedupe: true }
  };

  TR.seed = seed;
  TR.Store = Store;
  TR.colorOf = colorOf;
  TR.matchScore = matchScore;
  TR.topMatches = topMatches;
  TR.bestScoreFor = bestScoreFor;
  TR.companyKey = companyKey;
  TR.diversify = diversify;
  TR.matchReason = matchReason;
  TR.generateLetter = generateLetter;
  TR.letterSubject = letterSubject;
  TR.toneLabels = toneLabels;
  TR.fmtDate = fmtDate;
  TR.fmtDateTime = fmtDateTime;
  TR.timeAgo = timeAgo;
})(window.TR);
