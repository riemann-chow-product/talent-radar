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
        { id: 'j12', title: '证券-AI全栈开发专家', company: '腾讯·CDG', city: '深圳', salary: '30-45K', minSalary: 30, maxSalary: 45, headcount: 2, source: '企业官网', sourceName: '腾讯招聘 · 公开职位', url: 'https://careers.tencent.com/jobdesc.html?postId=2104513138056675328', tags: ['React', 'Node.js', 'TypeScript', 'MySQL', 'Go'], minYears: 4, minEdu: '本科', jd: '1.负责 腾讯证券体系 AI研发工作，覆盖 自选股APP / 微证券小程序/ 问元宝智能体、智能体套件、运营平台等； 2.负责系统架构的设计与演进，负责产品标准化、多产品融合等方向的技术方案规划，输出高质量设计文档，协调各团队落地； 3.推动 AI 研发流程标准化，制定迭代计划并把控交付节奏，保证功能在多客户、多环境下按时高质量交付； 4.构建 AI 研发质量监控体系，主导性能容量、稳定性治理与体…', publishedAt: hoursAgo(72), collectedAt: hoursAgo(71) },
        /* CHANNEL_JOBS_START */
        {"id": "mkt627", "title": "算法工程师", "company": "OPPO", "companyType": "", "fundingStage": "", "city": "上海", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_vwgya81lr0ve", "tags": ["PyTorch", "Python", "Transformer", "模型微调", "Prompt"], "minYears": 1, "minEdu": "硕士", "jd": "职位描述： 1. 负责对话场景专属数据集的构建，包括多轮对话数据的收集、清洗、去重、格式化及高质量标注（如意图、槽位、情感、安全性等）。 2. 负责大模型微调、对齐（如RLHF/DPO）相关实验代码的开发、复现与调试，参与Prompt工程及模型服务化工具链的搭建。 3. 跟踪领域的最新学术进展与技术动态，编写高质量的技术实验报告和项目文档。 1. 硕士及以上在校生，计算机科学、软件工程、人工智能、自然语言处理等相关专业优先。 2. 具备扎实的算法与数据结构基础，优秀的编程能力（Python），具备良好的代码风格和工程实践意识。 3. 熟悉机器学习和深度学习基本原理，对Transformer架构及主流大模型有深入理解。有对话系统、指令微调、人类反馈强化学习（RLHF）相关经验或研究背景者优先。 4. 熟练掌握Python，精通PyTorch或TensorFlow等至少一种主流深度学习框架。熟悉Hugging Face生态及相关工具库者加分。 5. 英语读写能力良好，能够快速阅读和消化中英文学术论文（如arXiv），具备独立开展算法调研和技术复现的能力。 6. 对人工智能技术，特别是大模型与对话AI，怀有强烈的好奇心和探索热情。自我驱动力强，具备出色的逻辑思维、沟通能力和团队协作精神。 投递要求", "publishedAt": "2026-11-10T10:37:24.112385Z", "collectedAt": "2026-11-10T12:37:24.113353Z"},
        {"id": "mkt628", "title": "算法工程师", "company": "纳米维景集团", "companyType": "", "fundingStage": "", "city": "上海", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_h0rrnhlvrilb", "tags": ["Python", "C++", "性能测试", "算法"], "minYears": 2, "minEdu": "本科", "jd": "职位描述： 岗位职责 1. 负责 CT 图像重建算法的设计、实现与优化，持续提升重建速度和图像质量； 2. 负责原始投影数据的预处理、校准和校正，分析并解决伪影及成像异常问题； 3. 负责算法的性能测试、评估和工程优化，推动算法在 CPU/GPU 等平台上的高性能实现； 4. 建立图像质量测试、评价和问题定位方法，推动问题闭环； 5. 与系统、软件和产品团队协作，完成算法集成、验证及产品化，并编写相关设计与开发文档； 6. 跟踪国内外计算成像、数值优化和高性能计算等领域的最新研究进展。 任职资格 1. 数学、应用数学、物理学、计算机、电子信息、医学影像等相关专业本科及以上学历； 2. 在至少一个相关方向具备业界领先的专业水平或有说服力的成果，例如计算成像、数字信号处理、图像处理、逆问题、数值优化或高性能计算； 3. 具备扎实的数学和算法基础，能从物理机制、数学建模和数值计算角度分析复杂问题，并快速将专业能力迁移至 CT 成像场景； 4. 熟练使用 C++、Python 或 MATLAB 开展算法设计与仿真，具备良好的工程实现能力； 5. 熟悉并行计算或 GPU 加速，能够使用 CUDA 等异构计算技术完成算法实现与优化； 6. 具备强烈的好奇心、自驱力和责任心，以及良好的英语读写、文献检索、沟通协作和复杂问题解决能力。 加分项（非硬性要求） 1. 有 CT、医学影像或其他物理成像系统的算法研发经验； 2. 了解 FBP、迭代重建等 CT 重建方法，或具备投影数据预处理、校准校正及伪影分析经验； 3. 有相关行业的算法研发、高性能实现或产品落地经验。 投递要求", "publishedAt": "2026-11-10T09:37:24.113371Z", "collectedAt": "2026-11-10T11:37:24.113379Z"},
        {"id": "mkt629", "title": "算法工程师", "company": "Flow++", "companyType": "", "fundingStage": "", "city": "北京", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_rxiqutimbdar", "tags": ["数据分析", "算法", "沟通协调"], "minYears": 2, "minEdu": "本科", "jd": "职位描述： 算法工程师（北京户口）：北京、深圳、广州 职责描述 1、利用数据挖掘、机器学习相关算法，解决产品业务需求； 2、调研新技术在数据分析领域的应用价值，以技术驱动产品。 职位要求", "publishedAt": "2026-11-10T08:37:24.113386Z", "collectedAt": "2026-11-10T10:37:24.113391Z"},
        {"id": "mkt630", "title": "算法工程师", "company": "柯西黎曼", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_fl2a0lrcodt4", "tags": ["机器人", "嵌入式", "算法"], "minYears": 2, "minEdu": "本科", "jd": "职位描述： 【职位概述】 你将参与真实业务场景水下机器人中的算法研发工作。主要工作内容为负责产品相关的技术算法概念验证（POC），协助资深算法工程师完成从数据、模型到系统落地的全流程参与，接触水下机器人巡检、嵌入式AI设备等前沿项目。 【岗位职责】 1.负责产品相关技术算法的概念验证（POC）、数据处理、模型训练与调优； 2.负责针对特定业务场景的算法效果验证与改进，输出可行性分析报告； 3.参与水下机器人相关实验，配合团队完成真实场景下的数据采集与处理； 4.负责算法的工程化移植与模块开发，协助完成算法在边缘设备上的初步部署。 【任职要求", "publishedAt": "2026-11-10T07:37:24.113405Z", "collectedAt": "2026-11-10T09:37:24.113415Z"},
        {"id": "mkt631", "title": "算法工程师", "company": "君子务本科技", "companyType": "", "fundingStage": "", "city": "武汉", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_putjdrnoctej", "tags": ["LLM", "原型", "Agent", "算法"], "minYears": 2, "minEdu": "本科", "jd": "岗位职责 参与 AI-Native 芯片软硬件研发体系建设，探索 LLM/Agent 在算子优化、推理系统及芯片设计流程中的自动化应用。 跟踪 AI for Systems、Kernel Synthesis、Agentic EDA、LLM Serving 等前沿方向，复现代表性论文与开源项目，开展技术原型验证。 结合自研 AI 加速器及真实工作负载，构建 AI-driven Optimization Pipeline、Agent Workflow、Benchmark 与自动化评测反馈体系。 沉淀可复用的研究工具、技术方案与实验成果，推动成果工程化落地及学术研究。 三、任职要求", "publishedAt": "2026-11-10T06:37:24.113423Z", "collectedAt": "2026-11-10T08:37:24.113428Z"},
        {"id": "mkt632", "title": "算法工程师", "company": "墨泊可士", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_w28toicdecjy", "tags": ["LLM", "RAG", "算法"], "minYears": 2, "minEdu": "本科", "jd": "职位描述： 岗位职责: 1、利用大模型及相关技术在人工重高服务场景中提升人工效率，实现部分自动化替代，构建智能化服务体系; 2、深度参与LLM应用场景的研究与探索，负责模型训练、SFT、DPO、RAG等具体任务; 3、跟踪和调研前沿技术，推动新技术在业务中的落地和应用，提升整体AI化能力; 岗位要求", "publishedAt": "2026-11-10T05:37:24.113453Z", "collectedAt": "2026-11-10T07:37:24.113460Z"},
        {"id": "mkt633", "title": "算法工程师", "company": "百度", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "招聘平台", "sourceName": "实习僧 · 公开实习职位", "url": "https://www.shixiseng.com/intern/inn_uweety1vj2uc", "tags": ["PyTorch", "LLM", "Python", "模型微调", "数据分析"], "minYears": 2, "minEdu": "硕士", "jd": "职位描述： 1.参与大模型在信息流推荐场景中的应用探索与落地，包括内容理解、用户兴趣建模、推荐策略优化等方向。 2.参与大模型相关算法方案设计与实验，包括Prompt设计、模型微调（SFT/蒸馏等）及效果评估。 3.基于离线数据与在线指标，对推荐效果进行分析与优化，推动模型能力在业务中的迭代。 4.与工程及产品团队协作，推动大模型能力在推荐系统中的工程化与规模化应用。 任职资格 1.计算机、人工智能、数据科学等相关专业硕士/博士在读，有推荐系统或大模型相关研究/实践经验优先。 2.熟悉机器学习或深度学习基础，了解LLM、推荐系统、NLP或多模态方向之一。 3.熟练使用Python，掌握至少一种深度学习框架（如PyTorch/TensorFlow），具备良好的数据分析与实验能力。 4.具备良好的学习能力与工程意识，能够主动推进问题分析与方案迭代。 投递要求", "publishedAt": "2026-11-10T04:37:24.113502Z", "collectedAt": "2026-11-10T06:37:24.113514Z"},
        {"id": "mkt707", "title": "后端开发工程师", "company": "山东卓泰电力科技有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "10-13K", "minSalary": 10, "maxSalary": 13, "headcount": 1, "source": "招聘平台", "sourceName": "智联招聘 · 公开职位", "url": "https://www.zhaopin.com/jobdetail/CCL1317827560J40932736503.htm", "tags": ["性能优化", "MySQL", "Redis", "Java", "SQL"], "minYears": 2, "minEdu": "本科", "jd": "职位描述 JavaScript Spring MySQL 熟悉应用AI优先 软件/IT服务 互联网电商 1. 本科及以上学历，计算机、软件工程等相关专业，具备扎实的计算机基础。 2. 5 年以上 Java 后端开发经验，熟悉常用开发框架及底层原理，有企业级系统（ERP/供应链/电商后台）经验优先。 3. 熟悉MySQL、Redis等常用数据库与缓存组件，具备SQL优化、索引设计及缓存策略落地经验，能独立处理复杂业务场景下的数据存储问题。 4. 熟悉和应用常见的网络安全与数据防护方案。 5. 具备良好的需求理解能力与逻辑思维，有供应链系统、B端贸易平台或工业领域相关系统开发经验者优先。 6. 具备较强的责任心与团队协作意识，能主动跟进项目进度，快速响应并解决线上生产问题。 7. 负责公司业务协同系统（合作商平台、供应商平台、运营后台）的后端设计、开发与维护；设计并优化数据库表结构、接口规范，保障系统稳定性与数据一致性；参与需求评审，与产品、前端协作，完成核心模块的技术方案设计与落地；参与工作流引擎、权限体系、主数据管理等基础能力的建设；编写技术文档，进行代码评审，保障代码质量；解决生产环境的技术问题，参与系统性能优化。 8. 负责系统与用友/金蝶等 ERP 系统的数据对接（接口开发、token 鉴权、数据同步）； 登录查看完整内容 工作地点", "publishedAt": "2026-11-10T03:37:24.113521Z", "collectedAt": "2026-11-10T05:37:24.113527Z"},
        {"id": "mkt708", "title": "Ai开发工程师【外派卓望】", "company": "鼎欣汇智科技（北京）股份有限公司", "companyType": "", "fundingStage": "", "city": "昆明", "salary": "8-10K", "minSalary": 8, "maxSalary": 10, "headcount": 1, "source": "招聘平台", "sourceName": "智联招聘 · 公开职位", "url": "https://www.zhaopin.com/jobdetail/CC120137340J40904617109.htm", "tags": ["架构设计", "RAG", "MySQL", "Redis", "高并发"], "minYears": 2, "minEdu": "本科", "jd": "职位描述 JavaScript Spring MySQL AI智能开发 通信运营商经验 人工智能 地址：云南省昆明市西山区广福路南悦城3号楼13楼 【岗位职责】 负责公司AI应用产品（如智能助手、知识库问答系统、AI应用）的前后端架构设计与核心功能开发； 独立完成Vue + Element UI前端页面开发，优化交互体验与响应性能； 基于 Java + Spring Boot 构建高可用后端服务，设计 MySQL 数据库表结构及 Redis 缓存策略； 参与 AI大模型（GLM、DeepSeek等） 的API集成与调优，实现 RAG（检索增强生成） 流程落地； 探索 Agent（智能体） 工作流设计，结合业务场景实现多工具调用与自主决策逻辑； 持续优化系统性能，解决高并发场景下的数据一致性及响应延迟问题。 【任职要求", "publishedAt": "2026-11-10T02:37:24.113534Z", "collectedAt": "2026-11-10T04:37:24.113540Z"},
        {"id": "mkt709", "title": "java全栈工程师", "company": "云南广众工程咨询有限公司", "companyType": "", "fundingStage": "", "city": "昆明", "salary": "6-8K", "minSalary": 6, "maxSalary": 8, "headcount": 1, "source": "招聘平台", "sourceName": "智联招聘 · 公开职位", "url": "https://www.zhaopin.com/jobdetail/CC380938480J40900150710.htm", "tags": ["MySQL", "Java", "需求分析", "SQL", "Vue"], "minYears": 2, "minEdu": "本科", "jd": "职位描述 JavaScript Vue Java MySQL SQL Server PostgreSQL JQuery CSS 岗位职责： 1、参与公司项目需求调研、需求分析、系统设计、开发执行、系统实施、文档编制及项目管理； 2、按计划完成功能模块的功能设计、代码编写、功能测试、单元测试、集成测试。 岗位要求", "publishedAt": "2026-11-10T01:37:24.113547Z", "collectedAt": "2026-11-10T03:37:24.113553Z"},
        {"id": "mkt710", "title": "研发工具链开发", "company": "广汽集团", "companyType": "", "fundingStage": "", "city": "广州", "salary": "10-20K", "minSalary": 10, "maxSalary": 20, "headcount": 1, "source": "招聘平台", "sourceName": "智联招聘 · 公开职位", "url": "https://www.zhaopin.com/jobdetail/CC131989270J40909647305.htm", "tags": ["Java", "Agent", "沟通协调"], "minYears": 2, "minEdu": "本科", "jd": "职位描述 AI Java 岗位职责 1.需求承接与方案设计：对接研发、质量、项目等业务方，承接工具链平台的新增与优化需求，参与需求澄清、边界确认、可行性评估与优先级排序，输出需求说明书、功能方案与接口设计文档，确保业务诉求可落地、可追溯。 2.功能开发与平台二次开发：基于 Java 技术栈完成工具链平台的功能开发与二次开发，包含自定义业务逻辑、工作流与字段权限模型扩展、报表与看板定制、插件与接口开发、与其他研发系统的集成适配，保障交付质量与代码可维护性。 3.系统与服务器运维：负责工具链平台及配套服务的部署、配置与日常运维，包含应用中间件、反向代理、定时任务与数据库维护，保障系统高效访问与数据安全。 4.AI 能力建设与智能化落地：推进部门AI 能力体系规划与建设，覆盖模型接入、数据处理、向量化与检索、提示词工程等基础能力，基于 MCP 等开放协议建设工具服务生态，实现大模型与研发工具链的互联互通，支持 Agent 编排与多工具协同；推动智能问答、需求相似检索、文档解析、研发辅助生成等场景落地。 任职要求", "publishedAt": "2026-11-10T00:37:24.113560Z", "collectedAt": "2026-11-10T02:37:24.113566Z"},
        {"id": "mkt711", "title": "Java后端开发工程师（设备接入/IOT方向）", "company": "合肥华致能源科技有限公司", "companyType": "", "fundingStage": "", "city": "合肥", "salary": "12-24K", "minSalary": 12, "maxSalary": 24, "headcount": 1, "source": "招聘平台", "sourceName": "智联招聘 · 公开职位", "url": "https://www.zhaopin.com/jobdetail/CCL1464701610J40919189113.htm", "tags": ["Java", "沟通协调", "文档撰写"], "minYears": 2, "minEdu": "本科", "jd": "岗位职责： 1、参与JAVA技术方向的产品项目研发工作； 2、参与项目业务需求讨论与功能实现方案； 3、按既定方案进行程序的编写工作； 4、编写、整理软件开发文档； 5、参与软件工程系统的设计、开发、测试等过程。 任职要求", "publishedAt": "2026-11-09T23:37:24.113577Z", "collectedAt": "2026-11-10T01:37:24.113587Z"},
        {"id": "mkt798", "title": "销售业务经理", "company": "卫星集团社会招聘", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "微信公众号", "sourceName": "微信公众号 · 卫星招聘", "url": "https://mp.weixin.qq.com/s/QoEcE5HarHF3BpjnYf5JJA", "tags": ["沟通协调", "文档撰写", "需求分析"], "minYears": 2, "minEdu": "本科", "jd": "【微信公众号招聘】卫星集团11月社会招聘岗位汇总｜岗位：销售业务经理。1 1 1 4 02 ·福利待遇· 基本福利 五险一金、工作餐补、节日/生日礼物、结婚/生育礼金、", "publishedAt": "2026-11-09T22:37:24.113598Z", "collectedAt": "2026-11-10T12:37:24.113610Z"},
        {"id": "mkt787", "title": "项目质量工程师", "company": "吉林市江机民科实业有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "4-8K", "minSalary": 4, "maxSalary": 8, "headcount": 1, "source": "微信公众号", "sourceName": "微信公众号 · 吉林市人才招聘", "url": "https://mp.weixin.qq.com/s?__biz=Mzg2MjY5NzI4MQ==&mid=2247511918&idx=5&sn=e7cde2bcc73de3acaa16d7d21771e3ec&chksm=cf0d1cb2f14275dce49e69c817ec4448c68849e8d6f7d0b6eb85e5ba7a3f0c0c3fa01182edbf&scene=27", "tags": ["自动化测试", "Python", "CI-CD", "性能测试"], "minYears": 2, "minEdu": "本科", "jd": "【微信公众号招聘】【​岗位推介】九解一协调——“职引未来”2026年全国城市联合招聘高校毕业生秋季专场活动微信岗位推介｜岗位：项目质量工程师。岗位要求：本科以上学历，理工类相关专业，有IE、检验、质量工作经验优先。性格稳定、思维逻辑能力强、能独立思考、具备心理承压能力。熟练使用办公软件、文字撰写表达能力强，掌握质量工具实操能力优先。具有沟通意愿及协调能力，能有效推动跨流程、跨部门的质量改进。 待遇及福利： 4000-8000元/月， 双休、法休、免费通勤车、职工宿舍、职工食堂、生日慰问、节日福利、五险一金。 2、", "publishedAt": "2026-11-09T21:37:24.113624Z", "collectedAt": "2026-11-10T11:37:24.113636Z"},
        {"id": "mkt788", "title": "研发技术员", "company": "吉林市江机民科实业有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "4-9K", "minSalary": 4, "maxSalary": 9, "headcount": 1, "source": "微信公众号", "sourceName": "微信公众号 · 吉林市人才招聘", "url": "https://mp.weixin.qq.com/s?__biz=Mzg2MjY5NzI4MQ==&mid=2247511918&idx=5&sn=e7cde2bcc73de3acaa16d7d21771e3ec&chksm=cf0d1cb2f14275dce49e69c817ec4448c68849e8d6f7d0b6eb85e5ba7a3f0c0c3fa01182edbf&scene=27", "tags": ["沟通协调", "文档撰写", "需求分析"], "minYears": 2, "minEdu": "本科", "jd": "【微信公众号招聘】【​岗位推介】九解一协调——“职引未来”2026年全国城市联合招聘高校毕业生秋季专场活动微信岗位推介｜岗位：研发技术员。岗位要求：本科及以上学历，电气自动化、电子信息相关专业1人，有一定弱电电路设计经验，有一定的动手能力；火工、引信相关专业1人，本科及以上学历。 待遇及福利： 4000-9000元/月， 双休、法休、免费通勤车、职工宿舍、职工食堂、生日慰问、节日福利、五险一金、项目资金。 3、", "publishedAt": "2026-11-09T20:37:24.113647Z", "collectedAt": "2026-11-10T10:37:24.113658Z"},
        {"id": "mkt790", "title": "国际贸易专员", "company": "山东鲁能泰山电力设备有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 5, "source": "微信公众号", "sourceName": "微信公众号 · 岱岳妇联", "url": "https://mp.weixin.qq.com/s?__biz=MzI1ODQyMjIyNQ==&mid=2247574808&idx=1&sn=b59096d184990daa27e0f70912bfd622&chksm=eb3be43c16e3ed444d5e3f27e70205a02552fc41a8d5ca69553bc7f9c8474ba20f9ce3acec02&scene=27", "tags": ["沟通协调", "文档撰写", "需求分析"], "minYears": 2, "minEdu": "本科", "jd": "【微信公众号招聘】她岗位 | 职等你来—招聘职位推介（第4期）｜岗位：国际贸易专员。本科及以上学历，国际贸易、市场营销等相关专业。有相关工作经验优先，月薪3500元+。 3.营销经理8名：本科及以上学历，不限专业。有相关工作经验优先，月薪3500元+。 福利待遇 缴纳五险、工作餐餐补、健康体检、工龄补贴、节日福利等。 [contact redacted] [phone redacted] 单位地址 泰山区上高街道天烛峰路中段。 4", "publishedAt": "2026-11-09T19:37:24.113670Z", "collectedAt": "2026-11-10T09:37:24.113676Z"},
        {"id": "mkt791", "title": "营销经理", "company": "山东鲁能泰山电力设备有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 8, "source": "微信公众号", "sourceName": "微信公众号 · 岱岳妇联", "url": "https://mp.weixin.qq.com/s?__biz=MzI1ODQyMjIyNQ==&mid=2247574808&idx=1&sn=b59096d184990daa27e0f70912bfd622&chksm=eb3be43c16e3ed444d5e3f27e70205a02552fc41a8d5ca69553bc7f9c8474ba20f9ce3acec02&scene=27", "tags": ["沟通协调", "文档撰写", "需求分析"], "minYears": 2, "minEdu": "本科", "jd": "【微信公众号招聘】她岗位 | 职等你来—招聘职位推介（第4期）｜岗位：营销经理。本科及以上学历，不限专业。有相关工作经验优先，月薪3500元+。 福利待遇 缴纳五险、工作餐餐补、健康体检、工龄补贴、节日福利等。 [contact redacted] [phone redacted] 单位地址 泰山区上高街道天烛峰路中段。 4 山东厚丰汽车散热器有限公司", "publishedAt": "2026-11-09T18:37:24.113682Z", "collectedAt": "2026-11-10T08:37:24.113687Z"},
        {"id": "mkt792", "title": "质量工程师", "company": "光华荣昌智控科技（山东）有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "3.5-4.5K", "minSalary": 3, "maxSalary": 4, "headcount": 1, "source": "微信公众号", "sourceName": "微信公众号 · 岱岳妇联", "url": "https://mp.weixin.qq.com/s?__biz=MzI1ODQyMjIyNQ==&mid=2247574808&idx=1&sn=b59096d184990daa27e0f70912bfd622&chksm=eb3be43c16e3ed444d5e3f27e70205a02552fc41a8d5ca69553bc7f9c8474ba20f9ce3acec02&scene=27", "tags": ["自动化测试", "Python", "CI-CD", "性能测试"], "minYears": 2, "minEdu": "本科", "jd": "【微信公众号招聘】她岗位 | 职等你来—招聘职位推介（第4期）｜岗位：质量工程师。本科及以上学历，机械设计、自动化、机电一体化、智能制造工程等相关专业。对待工作严谨仔细，有相关工作经验优先。 2.会计1名：本科及以上学历，会计学、财务管理、审计学等财会相关专业，有相关工作经验。月薪4000元。 3.管培生5名：本科及以上学历，机械设计制造及其自动化、车辆工程、工业工程、材料科学与工程、质量管理工程、智能制造工程等相关专业。工作认真负责，善于沟通交流。月薪3500-4500元。 福利待遇 缴纳五险、工作餐餐补、健康体检、工龄补贴、节日福利等。 [contact redacted] [phone redacted] 单位地址 泰山区博阳路176号院内。", "publishedAt": "2026-11-09T17:37:24.113702Z", "collectedAt": "2026-11-10T07:37:24.113708Z"},
        {"id": "mkt794", "title": "市场开发", "company": "无锡原子跳动机器人有限公司", "companyType": "", "fundingStage": "", "city": "无锡", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "微信公众号", "sourceName": "微信公众号 · 梁溪发布", "url": "https://mp.weixin.qq.com/s?__biz=MzA4Njk3Njk0OQ==&mid=2247905709&idx=1&sn=15722890e9d078a158ca24ff4e74f6cf&chksm=9ed74764abafb57980605ebe8fe3a45b8fb35a955fed3958bad02f093caf064bb0ae4aab1c36&scene=27", "tags": ["沟通协调", "文档撰写", "需求分析"], "minYears": 2, "minEdu": "大专", "jd": "【微信公众号招聘】公开招聘500人｜岗位：市场开发。负责区域内目标客户挖掘，锁定产业园区、封闭式社区、高校、连锁零售、餐饮连锁、快递网点、生鲜超市等 B 端客户，搭建稳定客户渠道网络； 2、需求诊断：实地走访客户，梳理人工配送痛点，输出托管运营、点位合作等定制化方案，开展现场演示与试运营对接，设计整体物流解决方案； 3、商务全流程：独立完成需求沟通、报价、谈判、合同签订、回款跟进，统筹内部运营、技术团队保障项目顺利落地； 4、客户深耕：维护长期合作关系，持续拓展多门店、多区域合作，挖掘增值业务；同步调研行业动态、竞品信息，为公司市场策略提供依据； 5、渠道合作：联动物业、园区服务商、本地生活渠道，发展分销合作，放大获客效率； 任职要求： 1、大专及以上学历，2 年以上 ToB 大客户拓展、渠道销售、本地商家开发经验； 2、具备方案型销售思维，能站在客户经营角度讲解配送降本增效价值，有独立成单案例； 3、目标感强，抗压能力优秀，可接受短途外勤拜访，学习能力强，快速掌握配送产品知识；", "publishedAt": "2026-11-09T16:37:24.113714Z", "collectedAt": "2026-11-10T06:37:24.113720Z"},
        {"id": "mkt793", "title": "网络工程师", "company": "江苏敏研智能科技有限公司", "companyType": "", "fundingStage": "", "city": "—", "salary": "面议", "minSalary": 0, "maxSalary": 999, "headcount": 1, "source": "微信公众号", "sourceName": "微信公众号 · 盐南发布", "url": "https://mp.weixin.qq.com/s?__biz=MzA4NDM4NjY4OQ==&mid=2651046627&idx=4&sn=40008affd9aa7771f0a1e83771c42786&chksm=8535bde7c4c912b522243aa0bb21bb22ea8aa33bb7de297eb279c0382c02f00c554a97ce6f6e&scene=27", "tags": ["沟通协调", "文档撰写", "需求分析"], "minYears": 2, "minEdu": "大专", "jd": "【微信公众号招聘】这些公司在招聘→｜岗位：网络工程师。（一）条件要求 1.大专及以上学历，计算机或通信相关专业，2年以上网络运维或集成工作经验，熟悉主流网络设备及环境搭建； 2.具备AI工具实际应用能力，能将其融入日常网络管理与服务工作中； 3.有网络安全服务经验或持有华为认证证书者优先，具备良好的沟通协调与技术文档撰写能力。 （二）岗位职责 1.负责客户现场或公司内部网络的架构规划、设备部署及日常运维，保障网络系统的稳定与安全； 2.利用AI工具辅助网络运维与故障排查，提升网络管理效率与智能化水平； 3.参与网络安全服务项目的实施，包括安全策略配置、风险评估及应急响应支持。", "publishedAt": "2026-11-09T15:37:24.113725Z", "collectedAt": "2026-11-10T05:37:24.113731Z"}
        /* CHANNEL_JOBS_END */
      ],
      sources: [
        { id: 's1', name: '腾讯招聘 · 社招', type: '企业官网', url: 'https://careers.tencent.com/search.html', enabled: true, frequency: '每 2 小时', lastRun: hoursAgo(1), count: 128, status: 'ok' },
        { id: 's2', name: '字节跳动 · 社招', type: '企业官网', url: 'https://jobs.bytedance.com/experienced/position', enabled: true, frequency: '每 4 小时', lastRun: hoursAgo(2), count: 86, status: 'ok' },
        { id: 's3', name: '网易 · 社会招聘', type: '企业官网', url: 'https://hr.163.com/', enabled: true, frequency: '每 2 小时', lastRun: hoursAgo(1), count: 54, status: 'ok' },
        { id: 's4', name: '美团招聘', type: '企业官网', url: 'https://zhaopin.meituan.com/', enabled: true, frequency: '每日 09:00', lastRun: hoursAgo(9), count: 213, status: 'ok' },
        { id: 's5', name: '小米招聘', type: '企业官网', url: 'https://hr.xiaomi.com/', enabled: true, frequency: '每日 09:00', lastRun: hoursAgo(9), count: 97, status: 'ok' },
        { id: 's6', name: '华为招聘', type: '企业官网', url: 'https://career.huawei.com/', enabled: true, frequency: '每 1 小时', lastRun: hoursAgo(1), count: 462, status: 'ok' },
        { id: 's7', name: '猎聘 · 职位订阅', type: '招聘平台', url: 'https://www.liepin.com/', enabled: false, frequency: '每 4 小时', lastRun: hoursAgo(30), count: 176, status: 'paused' },
        { id: 's8', name: 'BOSS直聘 · 职位订阅', type: '招聘平台', url: 'https://www.zhipin.com/', enabled: true, frequency: '每 6 小时', lastRun: hoursAgo(3), count: 141, status: 'ok' },
        /* CHANNEL_SOURCES_START */
        {"id": "s9", "name": "微信公众号 · 招聘推文订阅", "type": "微信公众号", "url": "https://mp.weixin.qq.com/", "enabled": true, "frequency": "每 4 小时", "lastRun": "2026-11-10T11:37:24.114043Z", "count": 12, "status": "ok"}
        /* CHANNEL_SOURCES_END */
      ],
      mails: [
        { id: 'm1', candidateId: 'c3', jobId: 'j3', to: '[email redacted]', subject: '【才探 TalentRadar 推荐】王浩然 · AI后台开发工程师｜匹配度 96%', body: '', status: 'replied', sentAt: hoursAgo(30) },
        { id: 'm2', candidateId: 'c1', jobId: 'j1', to: '[email redacted]', subject: '【才探 TalentRadar 推荐】陈思远 · 微信小程序-前端开发工程师-开发者方向｜匹配度 94%', body: '', status: 'opened', sentAt: hoursAgo(22) },
        { id: 'm3', candidateId: 'c7', jobId: 'j7', to: '[email redacted]', subject: '【才探 TalentRadar 推荐】吴嘉懿 · AI智能体评测高级工程师｜匹配度 95%', body: '', status: 'opened', sentAt: hoursAgo(17) },
        { id: 'm4', candidateId: 'c2', jobId: 'j2', to: '[email redacted]', subject: '【才探 TalentRadar 推荐】林知夏 · 金融大模型-算法工程师｜匹配度 91%', body: '', status: 'sent', sentAt: hoursAgo(11) },
        { id: 'm5', candidateId: 'c4', jobId: 'j4', to: '[email redacted]', subject: '【才探 TalentRadar 推荐】赵一诺 · AI产品经理｜匹配度 89%', body: '', status: 'sent', sentAt: hoursAgo(6) },
        { id: 'm6', candidateId: 'c6', jobId: 'j6', to: '[email redacted]', subject: '【才探 TalentRadar 推荐】周子墨 · ima-数据分析师｜匹配度 87%', body: '', status: 'failed', sentAt: hoursAgo(3) }
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
        { time: hoursAgo(3), level: 'info', text: '[邮件] [email redacted] 投递失败重试队列已清空' },
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
   * 服务端返回的是实体 JSON，字段可能与演示 seed 略有差异
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
    /** 演示模式写 localStorage；在线模式防抖回写服务端 */
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
