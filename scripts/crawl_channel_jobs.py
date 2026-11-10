#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""才探 TalentRadar · 招聘平台 / 微信公众号 JD 抓取器

在 scripts/crawl_market_jobs.py 生成的「企业官网」职位池之上，补齐另外两类来源：

  * 招聘平台（source = 招聘平台）
      - 实习僧 shixiseng.com   列表页 SSR → /intern/inn_xxx 详情页
      - 智联招聘 zhaopin.com   搜索页 __INITIAL_STATE__ → /jobdetail/CCxxx.htm
      - 猎聘 liepin.com        城市 / 职业 SEO 页 → /job/xxx.shtml
  * 微信公众号（source = 微信公众号）
      - 由公开检索收录并固化的真实 mp.weixin.qq.com 文章链接
      - 文章正文里的「招聘岗位 / 岗位职责 / 任职要求」解析为结构化岗位
      - 从正文中的往期 / 相关阅读链接做有限 BFS 扩展

真实性约束（与官网池一致，绝不拼接推测 URL）：
  1) 所有 URL 都来自真实页面枚举或检索收录，不按 id 规律伪造；
  2) 招聘平台：详情页必须 HTTP 200，且 <title> / JSON-LD 明确是该职位的招聘页；
  3) 公众号：文章必须 HTTP 200、og:title 与 js_content 正文齐全且含招聘信息；
  4) 任一校验不过直接丢弃。

产出：在 seed/market-jobs.json 与 assets/js/market-jobs.js 中追加岗位，
      原有 454 条企业官网岗位保持不变。
运行：python3 scripts/crawl_channel_jobs.py
      DRY_RUN=1 python3 scripts/crawl_channel_jobs.py   # 只抽样打印，不写文件
"""
import html
import json
import os
import re
import ssl
import urllib.parse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(ROOT, 'server/src/main/resources/seed/market-jobs.json')
JS_PATH = os.path.join(ROOT, 'assets/js/market-jobs.js')
DRY_RUN = os.environ.get('DRY_RUN') == '1'

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
# 本机 127.0.0.1:58900 代理会对部分站点返回伪 404，这里强制直连
OPENER = urllib.request.build_opener(
    urllib.request.ProxyHandler({}), urllib.request.HTTPSHandler(context=CTX))
OPENER.addheaders = [
    ('User-Agent', UA),
    ('Accept', 'text/html,application/xhtml+xml,application/json,*/*'),
    ('Accept-Language', 'zh-CN,zh;q=0.9'),
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
    'Linux', 'C语言', '嵌入式', 'Spring Boot', 'Vue', '算法', '数据结构',
    '产品经理', '项目管理', '沟通协调', '文档撰写', 'Excel', 'VBA',
]
FALLBACK = [
    (('前端', 'React', 'Web', '小程序', '全栈'), ['React', 'TypeScript', 'Node.js', '性能优化']),
    (('算法', '大模型', 'LLM', 'AI', '机器学习', '模型', 'Agent', 'RAG'), ['LLM', 'Python', 'PyTorch', 'RAG']),
    (('后台', '后端', 'Go', 'Java', '服务端', '服务', 'SRE', '云'), ['Go', '微服务', 'MySQL', '高并发']),
    (('产品', '运营', '增长'), ['需求分析', '数据分析', 'SaaS', 'AB测试']),
    (('设计', '交互', '视觉', 'UI', 'UX'), ['交互设计', 'Figma', '设计系统', '用户研究']),
    (('数据', 'BI', '分析', 'SQL'), ['SQL', 'Python', 'BI', '指标体系']),
    (('测试', '质量', '测开'), ['自动化测试', 'Python', 'CI-CD', '性能测试']),
    (('机器人', '硬件', '嵌入式', '具身', '自动驾驶', '电气'), ['C++', 'Python', '深度学习', '架构设计']),
]
CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州',
          '重庆', '天津', '长沙', '郑州', '青岛', '合肥', '济南', '厦门', '福州', '东莞',
          '佛山', '无锡', '宁波', '大连', '沈阳', '珠海', '长春', '哈尔滨', '石家庄', '昆明']

# 招聘平台列表页关键词（均为真实可访问的公开搜索页）
SXS_KEYWORDS = ['算法工程师', '前端开发工程师', '产品经理', '大模型', '数据分析',
                '设计师', '测试工程师', 'Java', '后端开发', '人工智能', '运营', '嵌入式']
ZP_KEYWORDS = ['Java', '算法工程师', '前端开发', '产品经理', '大模型', '数据分析',
               '软件测试', 'Go', '人工智能', '嵌入式']
LP_PAGES = [
    'https://www.liepin.com/city-bj/zhaopin/?scene=seo',
    'https://www.liepin.com/city-sh/zhaopin/?scene=seo',
    'https://www.liepin.com/city-hz/zhaopin/?scene=seo',
    'https://www.liepin.com/city-cd/zhaopin/?scene=seo',
    'https://www.liepin.com/city-nj/zhaopin/?scene=seo',
    'https://www.liepin.com/city-gz/zhaopin/?scene=seo',
    'https://www.liepin.com/city-cq/zhaopin/?scene=seo',
    'https://m.liepin.com/career/qianduankaifa/',
    'https://www.liepin.com/city-bj/zpdmxsfgcsd98h/',
    'https://www.liepin.com/zpjisuanjiruanjiankaifa/',
]

# 公开检索收录的真实公众号招聘文章（含完整 chksm，可直接在浏览器打开）
WX_SEEDS = [
    'https://mp.weixin.qq.com/s?__biz=Mzg2MjY5NzI4MQ==&mid=2247511918&idx=5&sn=e7cde2bcc73de3acaa16d7d21771e3ec&chksm=cf0d1cb2f14275dce49e69c817ec4448c68849e8d6f7d0b6eb85e5ba7a3f0c0c3fa01182edbf&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzAwNjkyNDE2MQ==&mid=2247749730&idx=2&sn=dafe857955343936ce1da6da898d1bd3&chksm=9afc6ef2ed024668b9d3f9f26ed5df8167e5197907e62d06ec548b94f96c791c130cc831d80f&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzI1ODQyMjIyNQ==&mid=2247574808&idx=1&sn=b59096d184990daa27e0f70912bfd622&chksm=eb3be43c16e3ed444d5e3f27e70205a02552fc41a8d5ca69553bc7f9c8474ba20f9ce3acec02&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzI0MDQ3ODAyNw==&mid=2247539076&idx=1&sn=c250aabe69b696b0f6812de209ad0ae2&chksm=e825d2c4355eba1fd07df13edb3901999040728c8ce2a545a672388a8cd54526de280cd7810b&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzA4NDM4NjY4OQ==&mid=2651046627&idx=4&sn=40008affd9aa7771f0a1e83771c42786&chksm=8535bde7c4c912b522243aa0bb21bb22ea8aa33bb7de297eb279c0382c02f00c554a97ce6f6e&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzA4Njk3Njk0OQ==&mid=2247905709&idx=1&sn=15722890e9d078a158ca24ff4e74f6cf&chksm=9ed74764abafb57980605ebe8fe3a45b8fb35a955fed3958bad02f093caf064bb0ae4aab1c36&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzA5MDQ1ODA4OQ==&mid=2650274745&idx=2&sn=cb6318d8a95ed568cce0088380e7cd86&chksm=89bb24b2c42f5f0d2dc7122e11c917cdad040b34587bb68f5cacfd30e4bc65c63ef7a3157fb5&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzU4MTU4NTkxNw==&mid=2247510862&idx=8&sn=a34b6379e3ecffa6691bf71a51a05977&chksm=fc7c484ba88c1c3b5033e2daef6100b313c604afcf5fae2d72ae94bf0ae0540304b28a6844c1&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzIwNzY1NDc4Mg==&mid=2247564263&idx=1&sn=ebafab76e78760e7df9340829ae14b35&chksm=9637381c1b4b52259436e81ba49dac549022dc4b849ba2757167958991ef5c36ec14ea831ee2&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MjM5OTEwNDc2Nw==&mid=2650761573&idx=3&sn=13fce6c2fa3fe9dc9abab98aad1e3300&chksm=bf99f55959a7759fa44d56c55cd476e3c56f6aea162e759da4c6e584604b8711ece737b77f82&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzU0OTgwOTA3Mw==&mid=2247500640&idx=2&sn=73ad2f3eecfb2a97791464237abbaca2&chksm=fa56616dea2d19b2057bac59917927d4cf4c959b91cbe03bb7edb2e1e112e1e68b603085854a&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MjM5ODM2MTU2Ng==&mid=2651420237&idx=3&sn=d9cbc6d7e3c6ff37a969302c68ecf5ab&chksm=bc903ddfa5a9506d9bfbffc3a6896c2f4dcdd03e2d3ca5b98b0f0769d65c7463d9a2ee49b755&scene=27',
    'https://mp.weixin.qq.com/s?__biz=MzA4NjQxNzkwMQ==&mid=2650795750&idx=2&sn=a1a30bdae44fad2b795adfc2b2979628&chksm=86d6a02a6c03a4f0b6291cf8b98b1c342b708e60ad84afd99fe37c9f8641a484ce4e1116e7c7&scene=27',
    'https://mp.weixin.qq.com/s/07VXIozQFkjwcwn6W1nnNg',
    'https://mp.weixin.qq.com/s/K57PPCRX4GIZ4B1aLEfmcg',
]
WX_MAX = 40           # BFS 后最多处理的文章数
WX_JOBS_PER_ARTICLE = 8
RECRUIT_WORDS = ('招聘岗位', '岗位职责', '任职要求', '岗位要求', '薪资待遇', '福利待遇',
                 '招聘信息', '招聘启事', '招聘公告', '招聘简章', '薪资', '职位要求', '岗位推介')
JOBWORDS = ('(?:工程师|产品经理|设计师|分析师|开发|算法|运营|专员|经理|架构师|研究员|'
            '实习生|技术员|顾问|主管|总监|测试|运维|销售|策划|编辑|会计|人事|行政|'
            '教师|讲师|技师|研发|数据|安全|交付|实施|质量|专干|精算师|标注员)')
# 「1、电气研发工程师5名：本科以上学历…」这类岗位名与要求写在同一行的格式
INLINE_JOB = re.compile(
    r'^\s*(?:\d+\s*[、.．)）]|◆|●|■|[（(]\d+[)）])?\s*'
    r'([\u4e00-\u9fa5A-Za-z0-9（）()+\-/·]{1,28}' + JOBWORDS +
    r'[\u4e00-\u9fa5A-Za-z0-9（）()+\-/·]{0,12})'
    r'\s*(?:\d+\s*[名人位])?\s*[：:]\s*(.{0,200})$')
BAD_LINE = re.compile(
    r'^(招聘岗位|岗位要求|任职要求|岗位职责|待遇|福利|地址|联系人|联系电话|公司简介|'
    r'工作地点|薪资|岗位名称|招聘|应聘|邮箱|简历|报名|扫码|点击|关注|长按|工作内容|'
    r'一|二|三|四|五|六|七|八|九|十|（[^）]*）|\([^)]*\)|[一二三四五六七八九十]+、)')
# 明显与 AI/互联网招聘平台调性不符的岗位，避免污染候选池
BAD_JOB = re.compile(r'(理货员|保洁|保安|水饺|服务员|洗碗|厨师|帮厨|司机|快递|外卖|'
                     r'家政|月嫂|育婴|普工|操作工|包装工|搬运|收银|导购|养殖|种植)')
# 岗位行必须以职位名词收尾，且不能含标点 / 署名 / 联系方式等噪声
JOB_TAIL = re.compile(JOBWORDS + r'(?:\s*\d+\s*(?:名|人|位)?)?\s*$')
NOISE_LINE = re.compile(
    r'(编辑|来源|笔试|合格|下载|扫码|关注|长按|报名|简历|邮箱|http|www|公众号|'
    r'联系电话|联系人|应聘|二维码|点击|招聘网|人事科|具有|不得|以上|设定|制定|执行|采集|整理|承接)')
ALLOWED_TITLE = re.compile(r'^[\u4e00-\u9fa5A-Za-z0-9（）()+\-/·]{4,24}$')
COMPANY_LINE = re.compile(r'(有限公司|股份公司|研究院|事业单位|集团)')
BAD_COMPANY = re.compile(r'(下载|应聘|报名表|《|》|将|电话|http|：|:|，|,|✅|集团总部|来源)')


def clean_company(s):
    s = clean(s)
    s = re.sub(r'^\s*(?:[一二三四五六七八九十]+|\d+)\s*[、.．)）]\s*', '', s)
    s = re.sub(r'^\s*(?:来源|招聘单位|单位名称)\s*[：:]\s*', '', s)
    s = re.sub(r'^[✅✔◆●■\s]+', '', s)
    s = re.split(r'[：:]', s)[0].strip()
    return s[:40]


def valid_title(x):
    """公众号岗位行的严格校验：只保留真正像「岗位名称」的短行。"""
    if not (4 <= len(x) <= 24):
        return False
    if BAD_LINE.match(x) or BAD_JOB.search(x) or NOISE_LINE.search(x):
        return False
    if not ALLOWED_TITLE.match(x):
        return False
    if not re.search(JOBWORDS, x) or not JOB_TAIL.search(x):
        return False
    return True


def fetch(url, timeout=25, referer=None):
    headers = {}
    if referer:
        headers['Referer'] = referer
    req = urllib.request.Request(url, headers=headers)
    with OPENER.open(req, timeout=timeout) as r:
        return r.status, r.read().decode('utf-8', 'replace')


def safe_fetch(url, timeout=25, referer=None):
    try:
        return fetch(url, timeout, referer)
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception:
        return -1, ''


def clean(s):
    return re.sub(r'\s+', ' ', html.unescape(s or '')).strip()


def title_of(page):
    m = re.search(r'<title>(.*?)</title>', page, re.S | re.I)
    return clean(m.group(1)) if m else ''


def tags_for(text, title=''):
    """技能标签只从「岗位标题 + 该岗位的上下文」提取，避免整篇推文串类。"""
    low = (title + ' ' + text).lower()
    found = []
    for s in SKILLS:
        if s.lower() in low and s not in found:
            found.append(s)
        if len(found) >= 5:
            return found
    if not found:
        # 兜底只看「岗位标题」本身：公众号推文正文常混排多个岗位，
        # 若按正文猜类别，会把「研发技术员」误判成交互设计岗。
        for keys, extra in FALLBACK:
            if any(k in title for k in keys):
                found = list(extra)
                break
    if len(found) < 3:
        for s in ['沟通协调', '文档撰写', '需求分析', '团队协作', '数据分析']:
            if s not in found:
                found.append(s)
            if len(found) >= 3:
                break
    return found[:5]


def parse_salary(text):
    """返回 (展示文案, min_k, max_k)，统一按 k/月。"""
    t = (text or '').replace('，', ',').replace('～', '-').replace('~', '-')
    m = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*万\s*/?\s*月', t)
    if m:
        a, b = float(m.group(1)) * 10, float(m.group(2)) * 10
        return ('%.0f-%.0fK' % (a, b)), int(a), int(b)
    m = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*[kK]', t)
    if m:
        a, b = float(m.group(1)), float(m.group(2))
        return ('%g-%gK' % (a, b)), int(a), int(b)
    m = re.search(r'(\d{3,6})\s*-\s*(\d{3,6})\s*元\s*/?\s*月', t)
    if m:
        a, b = int(m.group(1)) / 1000, int(m.group(2)) / 1000
        return ('%.0f-%.0fK' % (a, b)), int(a), int(b)
    m = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*万\s*元?\s*/?\s*年', t)
    if m:
        a, b = float(m.group(1)) * 10 / 12, float(m.group(2)) * 10 / 12
        return ('%.0f-%.0fK' % (a, b)), max(1, int(a)), max(2, int(b))
    m = re.search(r'(\d{3,6})\s*元\s*/?\s*月', t)
    if m:
        a = int(m.group(1)) / 1000
        return ('%.0fK' % a), int(a), int(a)
    # 平台常见简写：「1.5-3万·16薪」「6000-8000元」「8-13k」
    m = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*万(?!\s*元?\s*/?\s*年)', t)
    if m:
        a, b = float(m.group(1)) * 10, float(m.group(2)) * 10
        return ('%g-%gK' % (a, b)), int(a), int(b)
    m = re.search(r'(\d{3,6})\s*-\s*(\d{3,6})\s*元(?!\s*/?\s*月)', t)
    if m:
        a, b = int(m.group(1)) / 1000, int(m.group(2)) / 1000
        return ('%g-%gK' % (a, b)), int(a), int(b)
    return '面议', 0, 999


def parse_city(text, default='—'):
    for c in CITIES:
        if c in (text or ''):
            return c
    return default


def parse_edu(text):
    if re.search(r'(博士|硕士研究生学历|硕士及以上)', text or ''):
        return '硕士'
    if re.search(r'(大专及以上|专科及以上|学历不限|不限学历)', text or ''):
        return '大专'
    return '本科'


def parse_years(text):
    m = re.search(r'(\d+)\s*年(?:以上|及以上)(?:相关|工作)?经验', text or '')
    if m:
        return max(0, min(12, int(m.group(1))))
    return 1 if re.search(r'(应届|在校|实习|不限经验)', text or '') else 2


def parse_headcount(text):
    m = re.search(r'(\d+)\s*(?:名|人|位)', text or '')
    return max(1, min(99, int(m.group(1)))) if m else 1


def make_job(idx, title, company, city, salary_text, url, source, source_name, jd,
             headcount=1, tags=None):
    salary, mn, mx = parse_salary(salary_text)
    return {
        'id': 'mkt%03d' % idx,
        'title': clean(title)[:80] or '公开招聘岗位',
        'company': clean(company)[:60] or '公开招聘企业',
        'companyType': '',          # 平台 / 公众号岗位的公司类型未做公开标注，不臆测
        'fundingStage': '',
        'city': parse_city(city or ''),
        'salary': salary,
        'minSalary': mn,
        'maxSalary': mx,
        'headcount': headcount,
        'source': source,
        'sourceName': source_name,
        'url': url,
        'tags': tags or tags_for(jd, title),
        'minYears': parse_years(jd),
        'minEdu': parse_edu(jd),
        'jd': clean(jd)[:900],
    }


# ---------------------------------------------------------------- 实习僧
def shixiseng_links():
    out = []

    def one(kw):
        u = 'https://www.shixiseng.com/interns?keyword=' + urllib.parse.quote(kw)
        s, b = safe_fetch(u, 25)
        ids = list(dict.fromkeys(re.findall(r'/intern/(inn_[a-z0-9]+)', b)))
        return kw, s, ids

    with ThreadPoolExecutor(max_workers=6) as ex:
        for kw, s, ids in ex.map(one, SXS_KEYWORDS):
            if s == 200:
                out.extend('https://www.shixiseng.com/intern/' + i for i in ids)
    return list(dict.fromkeys(out))


def shixiseng_detail(url):
    s, b = safe_fetch(url, 25)
    if s != 200:
        return None
    t = title_of(b)
    if '实习僧' not in t or '招聘' not in t or '实习生招聘' not in t:
        return None
    m = re.match(r'^(.*?)实习招聘[-_](.*?)实习生招聘[-_]实习僧', t)
    if not m:
        return None
    job_title, company = clean(m.group(1)), clean(m.group(2))
    if not job_title or not company or len(job_title) > 60:
        return None
    city = ''
    for pat in [r'city="([^"]{2,12})"', r'\bi\.city="([^"]{2,12})"']:
        m = re.search(pat, b)
        if m:
            city = clean(m.group(1))
            break
    # 清掉 script / style / 注释，避免把打包代码注释混进 JD
    body = re.sub(r'<script[\s\S]*?</script>', ' ', b, flags=re.I)
    body = re.sub(r'<style[\s\S]*?</style>', ' ', body, flags=re.I)
    body = re.sub(r'<!--[\s\S]*?-->', ' ', body)
    plain = clean(re.sub(r'<[^>]+>', ' ', body))
    sal = ''
    m = re.search(r'(\d{2,4}\s*[-~]\s*\d{2,4}\s*元\s*/\s*天|\d+(?:\.\d+)?\s*[-~]\s*\d+(?:\.\d+)?\s*[kK])', plain)
    if m:
        sal = m.group(1)
    jd = ''
    m = re.search(r'(岗位职责|职位描述|实习内容|工作内容|职位介绍)([\s\S]{0,800}?)(任职要求|岗位要求|职位要求|申请条件|投递要求)', plain)
    if m:
        jd = m.group(1) + m.group(2) + m.group(3)
    if not jd:
        i = plain.find(company)
        jd = '实习僧公开实习岗位：' + job_title + '。' + (plain[i:i + 380] if i >= 0 else plain[:380])
    return dict(title=job_title, company=company, city=city or '—', salary=sal,
                jd=jd, sourceName='实习僧 · 公开实习职位')


# ---------------------------------------------------------------- 智联招聘
def zhaopin_links():
    out = []

    def one(kw):
        u = 'https://sou.zhaopin.com/?kw=' + urllib.parse.quote(kw)
        s, b = safe_fetch(u, 25)
        if s != 200:
            return []
        return list(dict.fromkeys(re.findall(
            r'positionUrl":"(https://www\.zhaopin\.com/jobdetail/[^"]+\.htm)"', b)))

    with ThreadPoolExecutor(max_workers=5) as ex:
        for urls in ex.map(one, ZP_KEYWORDS):
            out.extend(urls)
    return list(dict.fromkeys(out))


def zhaopin_detail(url):
    s, b = safe_fetch(url, 25)
    if s != 200:
        return None
    t = title_of(b)
    if '智联招聘' not in t or '招聘' not in t:
        return None
    m = re.search(r'"positionName"\s*:\s*"([^"]{2,80})"', b)
    job_title = clean(m.group(1)) if m else ''
    if not job_title:
        m = re.match(r'^(.*?)招聘_', t)
        job_title = clean(m.group(1)) if m else ''
    if not job_title:
        return None
    # 详情页自身的 <title> 是公司名的权威来源
    company = ''
    m = re.search(r'招聘_(.+?)招聘\s*-\s*智联招聘', t)
    if m:
        company = clean(m.group(1))
    if not company:
        m = re.search(r'"companyName"\s*:\s*"([^"]{2,60})"', b)
        company = clean(m.group(1)) if m else ''
    if not company:
        company = '智联招聘公开企业'
    sal = ''
    for pat in [r'"salary"\s*:\s*"([^"]{2,20})"', r'"salary60"\s*:\s*"([^"]{2,20})"']:
        m = re.search(pat, b)
        if m:
            sal = clean(m.group(1))
            break
    city = ''
    for pat in [r'"workCity"\s*:\s*"([^"]{2,20})"', r'"cityDistrict"\s*:\s*"([^"]{2,20})"']:
        m = re.search(pat, b)
        if m:
            city = clean(m.group(1))
            break
    plain = clean(re.sub(r'<script[\s\S]*?</script>', ' ', re.sub(r'<[^>]+>', ' ', b)))
    jd = ''
    m = re.search(r'(职位描述|岗位职责|工作内容)([\s\S]{0,700}?)(任职要求|岗位要求|职位要求|工作地点)', plain)
    if m:
        jd = m.group(1) + m.group(2) + m.group(3)
    if not jd:
        jd = '智联招聘公开职位：' + job_title + '。' + plain[:320]
    return dict(title=job_title, company=company, city=city or '—', salary=sal,
                jd=jd, sourceName='智联招聘 · 公开职位')


# ---------------------------------------------------------------- 猎聘
def liepin_links():
    out = []

    def one(u):
        s, b = safe_fetch(u, 25)
        if s != 200:
            return []
        ids = re.findall(r'/job/(\d+)\.shtml', b)
        return ['https://www.liepin.com/job/%s.shtml' % i for i in dict.fromkeys(ids)]

    with ThreadPoolExecutor(max_workers=5) as ex:
        for urls in ex.map(one, LP_PAGES):
            out.extend(urls)
    return list(dict.fromkeys(out))


def liepin_detail(url):
    s, b = safe_fetch(url, 25)
    if s != 200:
        return None
    t = title_of(b)
    if '猎聘' not in t or '招聘' not in t:
        return None
    # JSON-LD JobPosting 是猎聘详情页的权威职位字段
    m = re.search(r'"@type"\s*:\s*"JobPosting"\s*,\s*"title"\s*:\s*"([^"]{2,90})"', b)
    if not m:
        m = re.search(r'"title"\s*:\s*"([^"]{2,90})"\s*,\s*"description"', b)
    job_title = clean(m.group(1)) if m else ''
    if not job_title:
        m = re.search(r'【(.*?)招聘】', t)
        job_title = clean(m.group(1)) if m else ''
    if not job_title or len(job_title) > 80:
        return None
    m = re.search(r'"hiringOrganization"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{2,60})"', b)
    company = clean(m.group(1)) if m else ''
    if not company:
        m = re.search(r'】\s*-\s*(.*?)招聘信息\s*-\s*猎聘', t)
        company = clean(m.group(1)) if m else ''
    if not company:
        m = re.search(r'<meta name="description" content="([^"]{0,200})"', b)
        if m:
            mm = re.match(r'([^,，]{2,40}?)(?:北京|上海|广州|深圳|杭州|成都|南京|武汉|西安|苏州)?招聘', clean(m.group(1)))
            company = clean(mm.group(1)) if mm else ''
    if not company:
        company = '猎聘公开企业'
    md = re.search(r'<meta name="description" content="([^"]{0,300})"', b)
    desc = clean(md.group(1)) if md else ''
    sal = ''
    m = re.search(r'薪资\s*([0-9]+(?:\.[0-9]+)?\s*-\s*[0-9]+(?:\.[0-9]+)?\s*[kK万])\s*,?', desc)
    if m:
        sal = m.group(1)
    city = ''
    for c in CITIES:
        if c in t[:60]:
            city = c
            break
    jd = ''
    m = re.search(r'"description"\s*:\s*"((?:[^"\\]|\\.){20,1200})"', b)
    if m:
        jd = clean(m.group(1).replace('\\n', ' '))
    if not jd:
        jd = desc or ('猎聘公开职位：' + job_title)
    return dict(title=job_title, company=company, city=city or '—', salary=sal,
                jd=jd, sourceName='猎聘 · 公开职位')


# ---------------------------------------------------------------- 微信公众号
def wx_article(url):
    """校验并解析公众号文章；返回 (元信息, 正文行, 文内链接) 或 None。"""
    s, b = safe_fetch(url, 30)
    if s != 200 or len(b) < 20000:
        return None
    og = re.search(r'<meta property="og:title" content="([^"]+)"', b)
    if not og:
        return None
    title = clean(og.group(1))
    if not title or any(k in title for k in ('该内容已被发布者删除', '此内容因违规无法查看', '参数错误')):
        return None
    name = re.search(r'id="js_name"[^>]*>(.*?)</a>', b, re.S)
    account = clean(re.sub(r'<[^>]+>', '', name.group(1))) if name else '微信公众号'
    m = re.search(r'<div class="rich_media_content[^>]*id="js_content"[^>]*>([\s\S]*?)</div>\s*</div>', b)
    if not m:
        return None
    text = html.unescape(re.sub(r'<[^>]+>', '\n', m.group(1)))
    lines = [clean(x) for x in text.split('\n')]
    lines = [x for x in lines if x]
    content = ' '.join(lines)
    if len(content) < 120 or not any(k in content for k in RECRUIT_WORDS):
        return None
    # 文内出现的其它公众号文章链接，用于有限 BFS 扩展
    inner = []
    for x in re.findall(r'https?://mp\.weixin\.qq\.com/s/[A-Za-z0-9_\-]{10,60}', b):
        inner.append(x)
    for x in re.findall(r'https?://mp\.weixin\.qq\.com/s\?[^"\'<>\s\\]+', b):
        x = html.unescape(x)
        if '${' not in x and 'sn=' in x:
            inner.append(x)
    return dict(title=title, account=account, url=url), lines, list(dict.fromkeys(inner))


def is_job_line(x):
    return valid_title(x)


def wx_jobs(meta, lines, max_jobs):
    """把一篇招聘推文拆成多个岗位；每条 URL 都指向该篇真实文章。"""
    # 一篇推文常包含多家招聘单位：按出现位置把岗位归属到最近的公司，避免全部挤到同一家
    comp_hits = []
    for i, x in enumerate(lines):
        c = clean_company(x)
        if (COMPANY_LINE.search(c) and not BAD_COMPANY.search(c)
                and 6 <= len(c) <= 40):
            comp_hits.append((i, c))
    fallback_company = comp_hits[0][1] if comp_hits else (
        (meta['account'] or '公众号') + ' · 公开招聘单位')

    def company_at(i):
        pick = fallback_company
        for ci, cn in comp_hits:
            if ci <= i:
                pick = cn
            else:
                break
        return pick

    hits = []
    for i, x in enumerate(lines):
        if is_job_line(x):
            hits.append((i, x, ''))
        else:
            m = INLINE_JOB.match(x)
            if m:
                nm = clean(m.group(1))
                if valid_title(nm):
                    hits.append((i, nm, clean(m.group(2))))
    out, seen = [], set()
    for i, raw, extra in hits:
        name = re.sub(r'^\d+\s*[、.．)）]\s*', '', raw).strip()
        name = re.sub(r'\s*\d+\s*(?:名|人|位)\s*$', '', name).strip()
        name = re.sub(r'\s*\d+\s*$', '', name).strip()
        if not valid_title(name) or name in seen:
            continue
        # 上下文：岗位名之后直到下一个岗位名，最多 8 行；含同一行冒号后的要求
        ctx = [extra] if extra else []
        for x in lines[i + 1:i + 9]:
            if is_job_line(x) and x != raw:
                break
            ctx.append(x)
            if len(' '.join(ctx)) > 420:
                break
        ctx_text = ' '.join([x for x in ctx if x])
        # 必须紧邻「学历 / 专业 / 薪资 / 职责」等招聘要求，过滤岗位职责小标题
        if not re.search(r'(学历|专业|经验|薪资|待遇|工资|岗位要求|任职要求|'
                         r'岗位职责|工作内容|招聘人数|应届|熟悉|负责|元|K|k|万|名|人)', ctx_text):
            continue
        seen.add(name)
        jd = ('【微信公众号招聘】' + meta['title'] + '｜岗位：' + name + '。' +
              ctx_text)[:900]
        salary_text = ctx_text + ' ' + lines[i][:60]
        sal, mn, mx = parse_salary(salary_text)
        company = company_at(i)
        out.append(dict(title=name, company=company,
                        city=parse_city(company + ' ' + meta['title'][:24] + ' ' + ctx_text[:120]),
                        salary=sal, minSalary=mn, maxSalary=mx,
                        jd=jd, headcount=parse_headcount(lines[i]),
                        url=meta['url'],
                        sourceName='微信公众号 · ' + meta['account'],
                        tags=tags_for(ctx_text, name), minYears=parse_years(ctx_text),
                        minEdu=parse_edu(ctx_text)))
        if len(out) >= max_jobs:
            break
    return out


def build_wechat():
    seeds = list(WX_SEEDS)
    queue = [(u, 0) for u in seeds]
    seen_url, seen_article, metas, articles = set(), set(), [], []
    while queue and len(articles) < WX_MAX:
        u, depth = queue.pop(0)
        if u in seen_url:
            continue
        seen_url.add(u)
        parsed = wx_article(u)
        if not parsed:
            continue
        meta, lines, inner = parsed
        # 同一篇推文可能同时以长链 / 短链出现，按「公众号 + 标题」去重，避免岗位重复入库
        k = (meta['account'], meta['title'])
        if k in seen_article:
            continue
        seen_article.add(k)
        articles.append((meta, lines))
        metas.append(meta)
        if depth < 1:
            for x in inner[:6]:
                if x not in seen_url:
                    queue.append((x, depth + 1))
    jobs = []
    for meta, lines in articles:
        jobs.extend(wx_jobs(meta, lines, WX_JOBS_PER_ARTICLE))
    return jobs, metas


# ---------------------------------------------------------------- 主流程
def collect_platform(builder_links, builder_detail, label, source_name, cap):
    urls = builder_links()
    print('  %s 列表枚举 %d 个详情页 URL' % (label, len(urls)))
    if DRY_RUN:
        urls = urls[:6]
    out = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(builder_detail, u): u for u in urls}
        for f in as_completed(futs):
            u = futs[f]
            try:
                d = f.result()
            except Exception:
                d = None
            if (d and d.get('title') and d.get('company')
                    and not BAD_JOB.search(d['title'])):
                d['url'] = u
                d['source'] = '招聘平台'
                out.append(d)
    # 平台常有同岗位多城市镜像，按「岗位名 + 公司」去重
    dedup, keys = [], set()
    for d in out:
        k = (d['title'], d['company'])
        if k in keys:
            continue
        keys.add(k)
        dedup.append(d)
    out = dedup[:cap] if not DRY_RUN else dedup
    print('  %s 校验通过 %d 条' % (label, len(out)))
    return out


def main():
    base = json.load(open(JSON_PATH, encoding='utf-8'))
    base = [j for j in base if j.get('source') == '企业官网']
    print('保留企业官网岗位 %d 条' % len(base))
    next_id = max([int(re.sub(r'\D', '', j['id']) or 0) for j in base] or [0]) + 1

    raw = []
    print('\n[招聘平台]')
    for links, detail, label, cap in [
        (shixiseng_links, shixiseng_detail, '实习僧', 80),
        (zhaopin_links, zhaopin_detail, '智联招聘', 80),
        (liepin_links, liepin_detail, '猎聘', 80),
    ]:
        raw.extend(collect_platform(links, detail, label, '招聘平台', cap))

    print('\n[微信公众号]')
    wx_jobs_raw, metas = build_wechat()
    print('  校验通过文章 %d 篇，解析岗位 %d 条' % (len(metas), len(wx_jobs_raw)))
    for m in metas[:6]:
        print('    ·', m['account'], '|', m['title'][:52])

    rows = []
    for d in raw:
        j = make_job(next_id, d['title'], d['company'], d['city'], d['salary'],
                     d['url'], '招聘平台', d['sourceName'], d['jd'])
        rows.append(j)
        next_id += 1
    for d in wx_jobs_raw:
        j = make_job(next_id, d['title'], d['company'], d['city'], d['salary'],
                     d['url'], '微信公众号', d['sourceName'], d['jd'],
                     d.get('headcount', 1), d.get('tags'))
        j['minSalary'] = d.get('minSalary', j['minSalary'])
        j['maxSalary'] = d.get('maxSalary', j['maxSalary'])
        j['minYears'] = d.get('minYears', j['minYears'])
        j['minEdu'] = d.get('minEdu', j['minEdu'])
        rows.append(j)
        next_id += 1

    if DRY_RUN:
        print('\nDRY_RUN 样本：')
        for j in (rows[:3] + rows[len(raw):len(raw) + 3]):
            print(' ', {k: j[k] for k in ['id', 'title', 'company', 'city', 'salary',
                                          'source', 'sourceName', 'url']})
            print('    tags', j['tags'], 'jd', j['jd'][:90])
        return

    # 按链接去重；公众号一篇推文里会拆出多个不同岗位，需按「链接 + 岗位名」保留
    all_rows, seen = [], set()
    for j in base + rows:
        u = j.get('url') or ''
        if not u.startswith('http'):
            continue
        k = (u, j['title'], j['company']) if j['source'] == '微信公众号' else (u,)
        if k in seen:
            continue
        seen.add(k)
        all_rows.append(j)

    import collections
    print('\n最终职位池 %d 条' % len(all_rows))
    print('来源分布', dict(collections.Counter(j['source'] for j in all_rows)))
    print('tags 数量分布', dict(collections.Counter(len(j['tags']) for j in all_rows)))
    print('链接域名', dict(collections.Counter(j['url'].split('/')[2] for j in all_rows).most_common(12)))

    payload = json.dumps(all_rows, ensure_ascii=False, indent=2)
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        f.write(payload + '\n')
    with open(JS_PATH, 'w', encoding='utf-8') as f:
        f.write('/* 才探 TalentRadar · 全渠道公开职位池（企业官网 / 招聘平台 / 微信公众号，链接逐条校验） */\n')
        f.write('(function (TR) {\n  TR.marketJobs = ' + payload + ';\n})(window.TR);\n')
    print('写入 %s (%d bytes)' % (JSON_PATH, os.path.getsize(JSON_PATH)))
    print('写入 %s (%d bytes)' % (JS_PATH, os.path.getsize(JS_PATH)))


if __name__ == '__main__':
    main()
