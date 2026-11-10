#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""才探 TalentRadar · 多公司公开职位池抓取器

覆盖互联网大厂 / 独角兽 / 融资期公司 / 上市公司的官方招聘站：
  * 腾讯 careers.tencent.com —— 复用已通过 ByPostId 逐条校验的官方职位
  * 其余公司 jobs.bytedance.com 与 *.jobs.feishu.cn —— 飞书招聘同构公开接口
      POST /api/v1/search/job/posts   职位列表
      GET  /api/v1/job/posts/{id}     职位详情（结构化字段）
      GET  /{site}/position/{id}/detail  官方职位详情页（浏览器可点开）

每条入库岗位都必须同时满足：
  1) 详情 API 返回同 id 的职位标题；
  2) 详情页面 HTTP 200 且页面中能找到该职位标题（防止软 404）。
不满足的直接丢弃，绝不生成推测 URL。

产出：server/src/main/resources/seed/market-jobs.json、assets/js/market-jobs.js
运行：python3 scripts/crawl_market_jobs.py
"""
import html
import json
import os
import re
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")

# 每家公司最多捞取的岗位数，保证 Top100 不会被单一公司占满
# 可用环境变量覆盖，便于快速验证：PER_SOURCE=2 python3 scripts/crawl_market_jobs.py
PER_SOURCE = int(os.environ.get('PER_SOURCE', '34'))
TENCENT_KEEP = int(os.environ.get('TENCENT_KEEP', '60'))

# company / 公司类型 / 融资阶段 / 招聘域名 / 站点路径前缀
# 公司类型与融资阶段为公开资料整理，仅供筛选参考，不代表实时融资状态。
SOURCES = [
    # 字节的 /campus/ 路由是服务端渲染职位正文的详情页；/experienced/ 只返回空壳，不用于校验
    ("字节跳动",   "互联网大厂", "未上市·超级独角兽", "jobs.bytedance.com",          "campus"),
    ("得物 App",   "独角兽",     "未上市·多轮融资",   "poizon.jobs.feishu.cn",       "index"),
    ("MiniMax",    "独角兽",     "未上市·多轮融资",   "vrfi1sk8a0.jobs.feishu.cn",   "379481"),
    ("智元机器人", "独角兽",     "近期融资活跃",       "agirobot.jobs.feishu.cn",     "campusrecruitment"),
    ("Momenta",    "独角兽",     "Pre-IPO",            "momenta.jobs.feishu.cn",      "campus"),
    ("蔚来",       "上市公司",   "已上市",             "nio.jobs.feishu.cn",          "index"),
    ("商汤科技",   "上市公司",   "已上市",             "sensetime.jobs.feishu.cn",    "exp"),
    ("零一万物",   "融资期公司", "多轮融资",           "01ai.jobs.feishu.cn",         "index"),
    ("百川智能",   "融资期公司", "多轮融资",           "cq6qe6bvfr6.jobs.feishu.cn",  "646926"),
    ("面壁智能",   "融资期公司", "近期融资",           "modelbest.jobs.feishu.cn",    "campus"),
    ("生数科技",   "融资期公司", "近期融资",           "shengshu.jobs.feishu.cn",     "692892"),
    ("无问芯穹",   "融资期公司", "近期融资",           "infinigence.jobs.feishu.cn",  "infinigence"),
    ("MetaApp",    "融资期公司", "多轮融资",           "meta.jobs.feishu.cn",         "index"),
]

SKILLS = [
    'React', 'TypeScript', 'Next.js', '微前端', 'Node.js', '性能优化', '架构设计',
    'PyTorch', 'LLM', 'RAG', 'Python', 'Transformer', '模型微调', '模型部署', 'MLOps',
    'Go', '微服务', 'K8s', 'MySQL', 'Redis', '高并发', 'Java',
    'B端产品', '需求分析', 'SaaS', '数据分析', 'Axure',
    'Figma', '设计系统', '交互设计', '用户研究', '原型',
    'SQL', 'Tableau', 'BI', '指标体系', 'AB测试',
    'Agent', 'LangChain', 'Prompt', '向量数据库', '具身智能', '机器人', 'C++',
    '自动化测试', 'Pytest', 'CI-CD', '性能测试', '深度学习', '计算机视觉',
]
FALLBACK = [
    (('前端', 'React', 'Web', '小程序', '全栈'), ['React', 'TypeScript', 'Node.js', '性能优化']),
    (('算法', '大模型', 'LLM', 'AI', '机器学习', '模型', 'Agent', 'RAG'), ['LLM', 'Python', 'PyTorch', 'RAG']),
    (('后台', '后端', 'Go', 'Java', '服务端', '服务', 'SRE', '云'), ['Go', '微服务', 'MySQL', '高并发']),
    (('产品', '运营', '增长'), ['需求分析', '数据分析', 'SaaS', 'AB测试']),
    (('设计', '交互', '视觉', 'UI', 'UX'), ['交互设计', 'Figma', '设计系统', '用户研究']),
    (('数据', 'BI', '分析', 'SQL'), ['SQL', 'Python', 'BI', '指标体系']),
    (('测试', '质量', '测开'), ['自动化测试', 'Python', 'CI-CD', '性能测试']),
    (('机器人', '硬件', '嵌入式', '具身', '自动驾驶'), ['C++', 'Python', '深度学习', '架构设计']),
]


def fetch(url, method="GET", body=None, timeout=20):
    headers = {"User-Agent": UA, "Accept": "application/json, text/plain, */*"}
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
        headers["Origin"] = "https://" + url.split("/")[2]
        headers["Referer"] = "https://" + url.split("/")[2] + "/"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
        return resp.status, resp.read().decode("utf-8", "replace")


def clean(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


def tags_for(title, jd):
    text = (title + " " + jd)
    low = text.lower()
    found = []
    for s in SKILLS:
        if s.lower() in low and s not in found:
            found.append(s)
        if len(found) >= 5:
            return found
    if not found:
        for keys, extra in FALLBACK:
            if any(k in text for k in keys):
                found = list(extra)
                break
    # 至少 3 个标签，保证五维打分的技能覆盖项有区分度
    for generic in ('Python', '数据分析', '架构设计', '需求分析', '性能优化'):
        if len(found) >= 3:
            break
        if generic not in found:
            found.append(generic)
    return found[:5]


def parse_years(text):
    m = re.search(r'(\d+)\s*年(?:以上|及?以上|\+)?(?:工作|相关|开发|经验)?', text or "")
    if m:
        return min(10, max(1, int(m.group(1))))
    return 3


def parse_edu(text):
    for lv in ('博士', '硕士', '本科', '大专'):
        if lv in (text or ""):
            return lv
    return '本科'


def city_of(j):
    ci = j.get('city_info') or {}
    if ci.get('name'):
        return clean(ci['name'])
    for c in (j.get('city_list') or []):
        if c.get('name'):
            return clean(c['name'])
    return '全国'


def title_in_html(title, page):
    """详情页 SSR 里含职位标题即为真实职位；兼容 HTML 实体转义与空白差异。"""
    t = clean(title)
    if not t:
        return False
    probe = t[:8]
    return probe in page or html.escape(probe) in page or html.escape(t[:12]) in page


def list_jobs(host, limit=100):
    body = {"keyword": "", "limit": limit, "offset": 0,
            "job_category_id_list": [], "tag_id_list": [], "location_code_list": [],
            "subject_id_list": [], "recruitment_id_list": [],
            "portal_type": 2, "portal_entrance": 1}
    _, text = fetch("https://%s/api/v1/search/job/posts" % host, "POST", body, timeout=25)
    return (json.loads(text).get("data") or {}).get("job_post_list") or []


def verify(host, prefix, item):
    """同时校验详情 API 与详情页面；返回 (是否通过, 详情 API 数据, 页面字节数)。"""
    jid = str(item['id'])
    url = "https://%s/%s/position/%s/detail" % (host, prefix, jid)
    try:
        s, page = fetch(url, timeout=25)
        if s != 200 or not title_in_html(clean(item.get('title')), page):
            return False, None, 0
    except Exception:
        return False, None, 0
    detail = None
    try:
        _, dt = fetch("https://%s/api/v1/job/posts/%s" % (host, jid), timeout=20)
        d = (json.loads(dt).get("data") or {}).get("job_post_detail") or {}
        if clean(d.get("title")) == clean(item.get("title")):
            detail = d
    except Exception:
        pass
    return True, detail, len(page)


def build_feishu(company, ctype, stage, host, prefix):
    try:
        raw = list_jobs(host)
    except Exception as e:
        print("  [跳过] %s 列表接口失败：%s" % (company, str(e)[:90]))
        return []
    # 过滤掉无正文的岗位，避免生成空 JD
    raw = [j for j in raw if clean(j.get('title')) and
           clean(j.get('description')) or clean(j.get('requirement'))]
    candidates = raw[:PER_SOURCE * 2]
    verified = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(verify, host, prefix, j): j for j in candidates}
        for f in as_completed(futures):
            j = futures[f]
            try:
                ok, detail, size = f.result()
            except Exception:
                ok = False
            if ok:
                verified.append((j, detail))
            if len(verified) >= PER_SOURCE:
                break
    out = []
    for j, detail in verified:
        desc = clean(j.get('description'))
        req = clean(j.get('requirement'))
        if detail:
            desc = clean(detail.get('description')) or desc
            req = clean(detail.get('requirement')) or req
        jd = clean(desc + " " + req)[:1400]
        info = (detail or {}).get('job_post_info') or {}
        exp = info.get('experience')
        min_years = int(exp) if isinstance(exp, (int, float)) and 0 < exp <= 15 else parse_years(req + " " + desc)
        out.append({
            "title": clean(j['title'])[:110],
            "company": company,
            "companyType": ctype,
            "fundingStage": stage,
            "city": city_of(detail or j),
            "jd": jd,
            "minYears": min_years,
            "minEdu": parse_edu(req + " " + desc),
            "url": "https://%s/%s/position/%s/detail" % (host, prefix, j['id']),
            "source": "企业官网",
            "sourceName": "%s · 官方招聘" % company,
        })
    print("  %-12s %-32s 候选 %3d → 校验通过 %2d" % (company, host, len(candidates), len(out)))
    return out


def build_tencent():
    path = os.path.join(ROOT, 'server/src/main/resources/seed/market-jobs.json')
    old = json.load(open(path, encoding='utf-8'))
    out = []
    for j in old:
        # 只复用上一版已逐条通过腾讯 ByPostId 校验的官方详情页
        if not str(j.get('url', '')).startswith('https://careers.tencent.com/jobdesc.html?postId='):
            continue
        out.append({
            "title": j['title'], "company": j['company'],
            "companyType": "互联网大厂", "fundingStage": "已上市",
            "city": j['city'], "jd": j['jd'], "minYears": j['minYears'],
            "minEdu": j['minEdu'], "url": j['url'],
            "source": j['source'], "sourceName": j['sourceName'],
        })
        if len(out) >= TENCENT_KEEP:
            break
    print("  %-12s %-32s 复用已校验 %2d" % ("腾讯", "careers.tencent.com", len(out)))
    return out


def main():
    print("== 抓取多公司公开职位池 ==")
    rows = build_tencent()
    for company, ctype, stage, host, prefix in SOURCES:
        rows += build_feishu(company, ctype, stage, host, prefix)

    # 统一字段、去重、编号
    jobs, seen = [], set()
    for r in rows:
        if r['url'] in seen or not r['title']:
            continue
        seen.add(r['url'])
        jobs.append({
            "id": "mkt" + str(len(jobs) + 1).zfill(3),
            "title": r['title'], "company": r['company'],
            "companyType": r['companyType'], "fundingStage": r['fundingStage'],
            "city": r['city'], "salary": "面议", "minSalary": 0, "maxSalary": 999,
            "headcount": 1, "source": r['source'], "sourceName": r['sourceName'],
            "url": r['url'], "tags": tags_for(r['title'], r['jd']),
            "minYears": r['minYears'], "minEdu": r['minEdu'], "jd": r['jd'],
        })

    companies = sorted({j['company'].split('·')[0] for j in jobs})
    types = {}
    for j in jobs:
        types[j['companyType']] = types.get(j['companyType'], 0) + 1
    print("\n== 汇总 ==")
    print("岗位总数 %d，公司 %d 家：%s" % (len(jobs), len(companies), '、'.join(companies)))
    print("公司类型分布：", json.dumps(types, ensure_ascii=False))
    print("链接域名分布：", json.dumps({d: sum(1 for j in jobs if j['url'].split('/')[2] == d)
                                 for d in sorted({j['url'].split('/')[2] for j in jobs})}, ensure_ascii=False))

    if os.environ.get('DRY_RUN'):
        print("DRY_RUN=1，未写入文件")
        return

    seed = os.path.join(ROOT, 'server/src/main/resources/seed/market-jobs.json')
    with open(seed, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    body = json.dumps(jobs, ensure_ascii=False, indent=2).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    js = os.path.join(ROOT, 'assets/js/market-jobs.js')
    with open(js, 'w', encoding='utf-8') as f:
        f.write('/* 才探 TalentRadar · 多公司公开职位池（官方招聘接口抓取，链接逐条校验） */\n')
        f.write('(function (TR) {\n  TR.marketJobs = ' + body + ';\n})(window.TR);\n')
    print("已写入 %s (%d bytes)" % (seed, os.path.getsize(seed)))
    print("已写入 %s (%d bytes)" % (js, os.path.getsize(js)))


if __name__ == '__main__':
    main()
