# 才探 TalentRadar

[English](README.md)（默认） · [简体中文](README.zh-CN.md)

一个 AI 驱动的招聘工作台：多渠道汇聚公开职位、把简历解析为结构化人才画像、用可解释的
五维模型计算人岗匹配度，并生成个性化推荐邮件。

> 本仓库是可运行的原型。界面为中文；所有贡献内容（issue、pull request、commit message）
> **一律使用英文**，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 目录

- [功能](#功能)
- [架构](#架构)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [演示账号](#演示账号)
- [岗位数据与抓取脚本](#岗位数据与抓取脚本)
- [配置](#配置)
- [API 概览](#api-概览)
- [贡献](#贡献)
- [许可证](#许可证)

---

## 功能

| 模块 | 说明 |
| --- | --- |
| 总览 | 候选人 / 岗位 / 匹配 / 推送统计、数据源健康度与活动时间线 |
| 候选人 | 上传 PDF / DOCX / TXT 简历，抽取技能、年限、学历与求职意向 |
| 岗位雷达 | 岗位库聚合，可按 **企业官网 / 微信公众号 / 招聘平台** 三类来源筛选 |
| 数据源 | 配置、启停与调度三类渠道的采集任务 |
| 智能匹配 | 五维可解释评分（技能 / 经验 / 学历 / 城市 / 薪资）与多公司 Top 100 排行榜 |
| 推荐触达 | 三种语气生成推荐语，追踪投递状态 |
| 系统设置 | 企业信息、SMTP、模型与匹配阈值 |

前端有两种运行模式：

- **演示模式**（后端不可达时默认）：纯静态页面，状态存于 `localStorage`，直接以
  `file://` 打开也能使用。
- **在线模式**：页面探测 `GET /api/health`，成功后从服务端加载全量快照，变更回写。

界面只展示产品级状态（如「在线」「演示数据」），不再暴露底层 Spring Boot / MySQL 等
实现细节。注意 `GET /api/health` 仍会返回存储类型、profile 与版本用于诊断，
若部署环境敏感可在反向代理层限制该接口。

---

## 架构

```
浏览器（原生 HTML / CSS / JS，无构建步骤）
   │  /api/*（Docker 内同源；本地开发指向 http://localhost:8080）
   ▼
Spring Boot 3.2.5（Java 21 / Maven）
   ├── REST 控制器：认证、候选人、岗位、匹配、邮件、数据源、状态、统计
   ├── JPA 实体与仓储（生产 MySQL 8，本地 / 测试用 H2）
   ├── StateService：bootstrap 全量快照 + 演示种子数据
   ├── MarketJobService：seed/market-jobs.json 全网职位池
   └── CrawlService + 适配器：演示 JD 池 / 用户配置的官网招聘页
   ▲
   │  seed/*.json（随仓库提交的离线快照，由 Python 爬虫生成）
   ▼
Python 3 爬虫（仅标准库，另调用系统 curl）
   ├── crawl_market_jobs.py   → 企业官网
   └── crawl_channel_jobs.py  → 招聘平台 + 微信公众号，并同步所有种子文件
```

- **前端**：原生 ES5 风格 JavaScript，无框架、无打包器，改完刷新即可。
- **后端**：Spring Boot 3.2.5 / Java 21、Spring Data JPA、springdoc-openapi、
  PDFBox、Apache POI、jsoup。
- **数据库**：默认 MySQL 8；提供 `h2` profile 便于本地验证。
- **部署**：`server/Dockerfile` 把静态前端与 API 放在同一来源的 8080 端口。

---

## 目录结构

```
.
├── index.html                     # 单页外壳（登录页 + 工作台）
├── assets/
│   ├── css/                       # app.css、auth.css
│   ├── img/                       # SVG 图标
│   └── js/
│       ├── config.js              # API 地址 / 自动探测配置
│       ├── data.js                # 演示种子、Store、匹配算法、推荐语模板
│       ├── real-jobs.js           # 前端「立即采集」JD 池
│       ├── market-jobs.js         # 前端全网职位池（626 条）
│       ├── ui.js                  # 公共 UI 组件（标签、图标、Toast、弹窗）
│       ├── api.js                 # API 客户端 + 演示 / 在线模式切换
│       ├── views.js               # 各页面渲染
│       ├── auth.js                # 登录 / 注册
│       └── app.js                 # 事件绑定与启动流程
├── scripts/
│   ├── crawl_market_jobs.py       # 企业官网职位池
│   └── crawl_channel_jobs.py      # 招聘平台 + 微信公众号 + 同步全部种子文件
├── server/
│   ├── Dockerfile
│   ├── docker-compose.yml         # MySQL 8 + 应用，一条命令启动
│   ├── pom.xml
│   ├── db/schema.sql              # 可选的手工建表脚本
│   └── src/
│       ├── main/java/com/talentradar/...
│       ├── main/resources/
│       │   ├── application*.yml
│       │   └── seed/              # state.json、real-jobs.json、market-jobs.json
│       └── test/...
├── CONTRIBUTING.md                # 贡献规范（英文）
├── .github/                       # issue / PR 模板（英文）
├── .gitmessage                    # commit message 模板（英文）
└── LICENSE                        # Apache-2.0
```

---

## 快速开始

### 方式一 —— Docker（推荐：前端 + API + MySQL 一键启动）

```bash
cd server
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

访问 <http://localhost:8080/>（页面与 API 同源）。

> 镜像内置的是已提交的 `server/target/talent-radar-server-0.1.0.jar`。
> 改动 Java 源码或任意 `seed/*.json` 后，必须执行 `cd server && mvn clean package`
> 再重建镜像，否则容器仍提供旧 jar（见[刷新岗位数据](#刷新岗位数据)）。

- Swagger UI：<http://localhost:8080/swagger-ui.html>
- 健康检查：<http://localhost:8080/api/health>
- 外部连库：`mysql -h127.0.0.1 -P13309 -utalent -ptalent123 talent_radar`

`docker compose down` 停止并保留数据卷；`docker compose down -v` 连数据卷一起删除。

### 方式二 —— 本地启动后端

需要 JDK 21、Maven，以及可连接的 MySQL 8（默认 `localhost:3306`、`root`/`root`，
数据库 `talent_radar` 会自动创建）。

```bash
cd server
mvn spring-boot:run
# 没有 MySQL 时可用内存库 H2：
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

再用静态服务器打开页面（后端已放开 CORS）：

```bash
python3 -m http.server 4173
# http://localhost:4173/
```

`assets/js/config.js` 在同源探测失败时会自动回退到 `http://localhost:8080`。
以 `file://` 打开时，前端按设计停留在演示模式。

### 方式三 —— 只要前端（无后端、无数据库）

直接用浏览器打开 `index.html`，或在仓库根目录启动：

```bash
python3 -m http.server 4173
```

全部数据为本地种子，保存在 `localStorage`。

### 构建与测试

```bash
cd server
mvn clean package
```

`mvn test` 目前只完成编译、**没有可运行的测试**：仓库尚无 Java 测试类
（`server/src/test` 只有一个 profile 配置）。补齐测试已列入后续计划。
改动种子文件后请按[刷新岗位数据](#刷新岗位数据)重打 jar。

---

## 演示账号

登录页点击 **一键体验演示账号**，或手动输入：

| 字段 | 值 |
| --- | --- |
| 邮箱 | `demo@caitan.ai` |
| 密码 | `123456` |

在线模式下该账号由后端惰性创建；演示模式下仅存在于当前浏览器。

---

## 岗位数据与抓取脚本

仓库内置三套离线数据，保证断网也能运行：

| 文件 | 使用方 | 用途 |
| --- | --- | --- |
| `assets/js/data.js` / `server/.../seed/state.json` | 岗位雷达页 | 当前岗位库（演示种子 / 服务端 bootstrap） |
| `assets/js/real-jobs.js` / `server/.../seed/real-jobs.json` | 「立即采集」 | 已校验的公开 JD 池，供演示采集适配器使用 |
| `assets/js/market-jobs.js` / `server/.../seed/market-jobs.json` | 智能匹配 | 全网职位池（626 条），供 Top 100 排行榜使用 |

每条岗位都带有逐条校验过的真实详情页链接。岗位按三类渠道归组：**企业官网**、
**招聘平台**、**微信公众号**。

### 刷新岗位数据

爬虫只用 Python 标准库（对屏蔽 `urllib` 的站点额外调用系统 `curl`）：

```bash
# 1）重建企业官网职位池（454 条；第 2 步追加其它渠道，
#    仓库快照最终为 626 条）
python3 scripts/crawl_market_jobs.py

# 2）追加招聘平台与微信公众号岗位，并同步到所有消费者种子文件
python3 scripts/crawl_channel_jobs.py

# 只抽样查看、不写文件：
DRY_RUN=1 python3 scripts/crawl_channel_jobs.py

# 校验所有种子文件没有残留个人联系方式
python3 scripts/scrub_seed_pii.py --check
```

微信公众号推文里可能带有真实联系人姓名、手机号和邮箱。`crawl_channel_jobs.py`
在写入任何种子文件前会用 `scrub_pii()` / `scrub_job()` 脱敏；
`scripts/scrub_seed_pii.py` 用同一套规则处理仓库中已提交的快照，也可作为 CI 检查。
手工改动种子文件后请运行一次。

> **注意**：`server/target/` 里的 Spring Boot jar 内嵌了一份 `seed/*.json`，
> `server/Dockerfile` 部署的正是这个 jar。改动任何种子文件后，必须执行
> `cd server && mvn clean package -DskipTests` 并提交重新打出的 jar，
> 否则 Docker 部署仍会读到旧数据。

`crawl_channel_jobs.py` 的行为：

- **招聘平台**：抓取实习僧、智联招聘、猎聘。智联对 `urllib` 的 HTTP/1.1 只返回反爬
  挑战页，因此改用 `curl`（HTTP/2）抓取同一来源 —— 即「换一种抓取类型」；
- **微信公众号**：从公开收录的招聘推文出发，逐篇校验（HTTP 200、`og:title`、
  `js_content`、招聘关键词），解析岗位行，并沿文内链接做有界 BFS 扩展；
- 只保留详情页真实可访问的岗位，绝不拼接推测 URL；
- 站点临时被封时，沿用该渠道上一轮已校验的快照，单次抓取失败不会让界面上的渠道
  变空；
- 最后调用 `sync_consumers()`，把两类渠道的代表岗位分发到**全部**种子文件
  （JSON 与 JS），包括岗位库和「立即采集」池。JS 中生成区块由
  `/* CHANNEL_JOBS_START */ ... /* CHANNEL_JOBS_END */` 标记包裹，可安全重复生成。

> 请**先**运行 `crawl_market_jobs.py`，**再**运行 `crawl_channel_jobs.py`：后者读取
> 官网职位池，并在其之上追加另外两类渠道。

---

## 配置

前端：`assets/js/config.js`（`apiBase`、`fallbackBase`、`autoDetect`、超时）。

后端（`server/src/main/resources/application.yml`，均可用环境变量覆盖）：

| 变量 | 默认值 | 含义 |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | HTTP 端口 |
| `MYSQL_HOST` / `MYSQL_PORT` | `localhost` / `3306` | MySQL 地址 |
| `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | `talent_radar` / `root` / `root` | 数据库凭据 |
| `JPA_DDL_AUTO` | `update` | Hibernate 建表策略 |
| `SEED_ENABLED` | `true` | 空库时写入演示种子 |
| `CRAWL_MODE` | `demo` | `demo` = 已校验 JD 池，`web` = 用户配置的官网招聘页 |
| `MAIL_ENABLED` | `false` | `true` = 真实 SMTP 投递，`false` = 只落库 |
| `RESUME_PARSE_MODE` | `rule` | 规则解析简历（`llm` 为预留） |
| `AUTH_ENABLED` | `true` | `true` = 除健康检查与登录/注册外，所有 `/api/**` 都要求 `Authorization: Bearer <token>` |
| `CORS_ORIGINS` | 仅回环地址 | 逗号分隔的明确来源；含通配符会被拒绝并回退到 `http://localhost:8080,http://127.0.0.1:8080` |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.exmail.qq.com` / `465` | SMTP 服务器（启用 SSL、要求鉴权） |
| `SMTP_USER` / `SMTP_PASSWORD` | 空 | 需与 `MAIL_ENABLED=true` 一并配置，否则投递会失败 |

Profile：`docker`（compose）、`h2`（内存库）、`test`（仅有 profile 配置，暂无自动化测试）。

---

## API 概览

| 接口 | 说明 |
| --- | --- |
| `GET /api/health` | 健康探测与存储类型 |
| `GET /api/bootstrap` | 全量状态快照（候选人、岗位、数据源、邮件等） |
| `PUT /api/state` | 全量替换快照（原型桥接接口） |
| `POST /api/auth/register`、`POST /api/auth/login` | 账号注册 / 登录 |
| `POST /api/candidates/upload` | 简历上传与解析 |
| `POST /api/jobs/collect` | 执行采集任务 |
| `POST /api/matches/market/import` | 把 Top N 全网岗位捞入岗位库 |
| `POST /api/mails` | 创建推荐邮件记录 |
| `POST /api/reset` | 恢复种子数据 |
| `GET /api/stats/overview`、`GET /api/sources`、`GET /api/activities` | 统计与列表 |
| `GET /api/auth/me` | 当前账号（需要 Bearer token） |
| `/api/matches/*`、`/api/letters/*`、`/api/settings`、`/api/logs`、`/api/trend` | 匹配、推荐语、设置与日志 |

除 `/api/health`、`/api/auth/register`、`/api/auth/login` 外，所有接口都需要
`Authorization: Bearer <token>`（登录或注册时签发）。token 保存在浏览器会话中，
由 `assets/js/api.js` 自动附加到请求头。

后端运行时完整文档见 `/swagger-ui.html`。

---

## 贡献

**所有 issue、pull request 与 commit message 必须使用英文。** 提交前请阅读
[CONTRIBUTING.md](CONTRIBUTING.md)；`.github/` 下的 issue / PR 模板同样为英文。

仓库提供本地 commit 模板：

```bash
git config commit.template .gitmessage
```

---

## 许可证

[Apache License 2.0](LICENSE)。
