/* ============================================================
   Default content for 林知远 / Lin Zhiyuan.
   Everything here can be overridden from /admin/ — the studio
   saves a merged copy to localStorage under the same origin.
   ============================================================ */

window.PORTFOLIO_DEFAULT = {
  version: 1,

  profile: {
    name: "林知远",
    nameEn: "Lin Zhiyuan",
    role: "数字经济 · 大二在读",
    school: "南山大学",
    location: "杭州 / 中国",
    availability: "2026 暑期实习开放中",
    status: "正在寻找数据分析 / 产品方向的实习",
    tagline: ["在数据与叙事之间，", "做一点有温度的建造。"],
    intro:
      "我是林知远，南山大学数字经济专业大二学生。白天和表格、爬虫、回归模型打交道，晚上写点关于城市、手艺和人的故事。我相信数据不是终点，它只是理解世界的一个入口。",
    email: "hello@linzhiyuan.me",
    avatar: "assets/img/portrait.png",
    socials: [
      { label: "GitHub", handle: "@zhiyuan-lin", url: "https://github.com/" },
      { label: "小红书", handle: "@知远的数据簿", url: "https://www.xiaohongshu.com/" },
      { label: "即刻", handle: "@林知远", url: "https://web.okjike.com/" },
      { label: "Bilibili", handle: "@在逃数分人", url: "https://www.bilibili.com/" }
    ]
  },

  stats: [
    { value: "03", label: "独立项目", note: "从问题到上线" },
    { value: "12", label: "学习笔记", note: "公开记录" },
    { value: "06", label: "常用工具", note: "每天都在用" },
    { value: "01", label: "长期主义", note: "慢慢来，比较快" }
  ],

  timeline: [
    {
      year: "2026",
      date: "2026.03 — NOW",
      title: "独立开发「菜价雷达」",
      org: "个人项目",
      desc: "从爬虫、清洗到 Streamlit 部署，第一次把工具交到真实用户手里。每天有 200 多位同学用它比价。",
      tag: "正在进行"
    },
    {
      year: "2025",
      date: "2025.11",
      title: "校园创新项目「夜光地图」上线",
      org: "3 人团队 · 数据可视化",
      desc: "用夜间灯光、客流与外卖数据描摹城市入睡的顺序，累计 3,000+ 访问，被校媒报道。",
      tag: "项目"
    },
    {
      year: "2025",
      date: "2025.07 — 2025.09",
      title: "数据实习生",
      org: "杭州某消费咨询公司",
      desc: "参与连锁品牌门店选址项目，独立完成 12 个竞品品牌的数据清洗与可视化看板。",
      tag: "实习"
    },
    {
      year: "2025",
      date: "2025.03",
      title: "校数据分析竞赛 · 二等奖",
      org: "南山大学",
      desc: "用公开数据评估城市夜间经济活力，第一次完整走完「提问—清洗—建模—叙事」的闭环。",
      tag: "竞赛"
    },
    {
      year: "2024",
      date: "2024.09",
      title: "入学南山大学 · 数字经济",
      org: "经济与管理学院",
      desc: "在通识课第一次写下 print(\"hello, world\")，发现代码可以把想法真的跑起来。",
      tag: "起点"
    }
  ],

  skills: [
    {
      id: "data",
      title: "数据",
      en: "DATA",
      desc: "把散落的数据整理成可以回答问题的样子。",
      items: [
        { name: "Python", level: 85, note: "Pandas / 爬虫 / 自动化" },
        { name: "SQL", level: 78, note: "查询、聚合、窗口函数" },
        { name: "Excel", level: 90, note: "建模、透视、可视化" },
        { name: "R", level: 55, note: "统计课上的老朋友" }
      ]
    },
    {
      id: "design",
      title: "设计",
      en: "DESIGN",
      desc: "信息不该只是被看见，更应该被看懂。",
      items: [
        { name: "Figma", level: 76, note: "原型与视觉稿" },
        { name: "ECharts", level: 72, note: "交互式图表" },
        { name: "Tableau", level: 68, note: "BI 看板" },
        { name: "信息设计", level: 80, note: "排版、层级、叙事" }
      ]
    },
    {
      id: "product",
      title: "产品",
      en: "PRODUCT",
      desc: "先弄清楚为谁解决什么问题，再动手。",
      items: [
        { name: "用户研究", level: 70, note: "访谈、问卷、可用性测试" },
        { name: "需求分析", level: 68, note: "从现象到问题" },
        { name: "写作", level: 86, note: "把复杂的事说清楚" },
        { name: "公开表达", level: 74, note: "路演、答辩、分享" }
      ]
    }
  ],

  tools: [
    "Python", "Pandas", "SQL", "Excel", "Tableau", "ECharts",
    "Figma", "Streamlit", "Git", "Notion", "VS Code", "Photoshop"
  ],

  projects: [
    {
      id: "nocturne-map",
      title: "夜光地图",
      en: "Nocturne Map",
      category: "数据可视化",
      year: "2025.11",
      featured: true,
      accent: "#bfd4d8",
      ink: "#0e2027",
      cover: "assets/img/project-nocturne.svg",
      summary: "把 6 个城区的夜间灯光、客流与外卖数据叠在一张地图上，看见城市入睡的顺序。",
      description:
        "城市是什么时候睡着的？我收集了杭州 6 个城区连续 30 天的夜间灯光遥感、地铁客流与外卖订单数据，把三种节奏叠在同一张地图上。结果发现：写字楼先熄灯，夜市最后收摊，而城中村的灯光几乎没有暗下来过。",
      role: "数据清洗 / 可视化 / 叙事",
      deliverables: ["交互地图", "数据故事长图", "3 分钟路演"],
      tags: ["Python", "Pandas", "ECharts", "地理数据"],
      link: "",
      highlight: "3,000+ 访问 · 校媒报道"
    },
    {
      id: "price-radar",
      title: "菜价雷达",
      en: "Price Radar",
      category: "工具产品",
      year: "2026.03",
      featured: true,
      accent: "#f0c75e",
      ink: "#2a2108",
      cover: "assets/img/project-price.svg",
      summary: "爬了 8 个菜场 90 天的价格，做成一个每天早上 7 点更新的比价小工具。",
      description:
        "起因只是想知道学校周边哪个菜场最便宜。我写了爬虫，每天抓取 8 个菜场 40 种常见菜品的价格，存进 SQLite，再用 Streamlit 做成一个三秒就能看懂的比价页面。上线两个月，有 200 多位同学每天在用。",
      role: "数据采集 / 后端 / 前端",
      deliverables: ["每日爬虫", "SQLite 数据库", "Streamlit 应用"],
      tags: ["Python", "SQLite", "Streamlit", "爬虫"],
      link: "",
      highlight: "200+ 日活 · 90 天数据"
    },
    {
      id: "echoes",
      title: "非遗新声",
      en: "Echoes",
      category: "网页叙事",
      year: "2025.06",
      featured: true,
      accent: "#df6249",
      ink: "#2c0e08",
      cover: "assets/img/project-echoes.svg",
      summary: "给 5 位手艺人做一份能在手机上读完的档案，让「非遗」不再只是一个词。",
      description:
        "我们走访了 5 位仍在坚持的手艺人：做油纸伞的、刻木版年画的、编竹篮的。项目没有做宏大的纪录片，而是用滚动叙事 + 声音片段，让每个人用第一人称讲自己的手艺。网页上线后，有两位手艺人收到了第一批线上订单。",
      role: "内容策划 / 前端开发 / 摄影",
      deliverables: ["5 篇数字档案", "滚动叙事网页", "声音采集"],
      tags: ["HTML/CSS/JS", "Figma", "摄影", "声音"],
      link: "",
      highlight: "5 位手艺人 · 2 笔线上订单"
    },
    {
      id: "studymate",
      title: "自习搭子",
      en: "StudyMate",
      category: "产品设计",
      year: "2025.12",
      featured: false,
      accent: "#a8b8a0",
      ink: "#1b2417",
      cover: "assets/img/project-studymate.svg",
      summary: "访谈 24 位同学后，我删掉了「打卡」功能，只留下「今晚一起学吗」。",
      description:
        "最初的设计里有积分、排名、连续打卡，但访谈发现：大家缺的不是监督，而是一个不尴尬的开口。于是我把产品砍到只剩一句话——「今晚 7 点，图书馆三楼，一起学吗？」。这是一个关于「少即是多」的产品练习。",
      role: "用户研究 / 交互设计 / 原型",
      deliverables: ["24 份访谈记录", "高保真原型", "可用性测试报告"],
      tags: ["用户研究", "Figma", "原型设计"],
      link: "",
      highlight: "24 位访谈对象 · 3 轮迭代"
    }
  ],

  notes: [
    {
      id: "night-market-data",
      title: "用 Python 抓了 3000 条夜市数据，我看见了什么",
      date: "2026-04-02",
      tag: "数据笔记",
      readTime: "8 min",
      excerpt: "数据清洗花了我 70% 的时间，但真正让我坐直身体的，是那些「对不上」的摊位。",
      content:
        "做夜光地图的时候，我爬了 3000 多条夜市摊位数据。原本以为最麻烦的是反爬，结果真正花时间的是清洗：同一家摊位的名字有 6 种写法，「老张烧烤」和「老张烧烤（总店）」到底算不算同一家？\n\n我最后用了三层匹配：先按坐标聚类，再按名称相似度，最后人工抽查 10%。过程中发现了一个有意思的现象：有 47 个摊位在平台上的位置和实际位置差了 800 米以上。它们大多在城中村的巷子里，平台定位漂移了。\n\n这些「对不上」的数据，后来成了整个项目里我最喜欢的一页：城市的边缘，往往藏在数据的误差里。"
    },
    {
      id: "collector-to-maker",
      title: "大二这一年，我戒掉了「收藏夹式学习」",
      date: "2026-03-11",
      tag: "成长手记",
      readTime: "5 min",
      excerpt: "收藏了 400 个教程之后，我终于承认：收藏不等于学会，输入也不等于成长。",
      content:
        "大一结束的时候，我的收藏夹里有 400 多条「以后一定要看」的教程。真正看完的，不到 20 条。\n\n后来我给自己定了一个很笨的规则：每学一个工具，必须用它做一个小东西，哪怕很丑。学爬虫就爬一次菜价，学 ECharts 就画一张图，学 Figma 就重做一次小程序界面。\n\n一年下来，作品集里多了 3 个项目，收藏夹反而变空了。我慢慢明白，学习不是囤积，而是留下痕迹。"
    },
    {
      id: "excel-to-sql",
      title: "从 Excel 到 SQL：我的数据处理工作流",
      date: "2026-02-19",
      tag: "工具方法",
      readTime: "7 min",
      excerpt: "什么时候该从 Excel 换到 SQL？我的判断标准只有一个：这张表我一个月后还要不要再用。",
      content:
        "大一的我是「Excel 万能派」：VLOOKUP、数据透视表、条件格式，能解决的问题绝不写代码。直到有一次处理 80 万行订单数据，Excel 直接卡到崩溃。\n\n现在的分工很明确：一次性、小规模的探索留在 Excel；需要反复使用、多人协作的数据，第一时间进 SQLite。清洗用 Python，可视化看场景——快速看趋势用 Excel，要交付用 ECharts 或 Tableau。\n\n工具没有高下，只有合不合适。判断标准也很简单：这张表，我一个月后还要不要再打开它。"
    },
    {
      id: "why-admin",
      title: "为什么我给自己的作品集做了一个后台",
      date: "2026-01-28",
      tag: "建站记录",
      readTime: "4 min",
      excerpt: "不是为了炫技，只是不想每次改一行简介都要重新部署一次网站。",
      content:
        "这个作品集的第一版是纯静态的。每次改项目描述，都要打开编辑器、改 HTML、重新部署。第三次之后，我决定给它加一个后台。\n\n后台很轻：没有数据库，没有登录系统，所有内容存在浏览器的 localStorage 里，可以一键导出 JSON。对一个人用的作品集来说，这已经够了。\n\n技术从来不是目的。让「更新内容」这件事变得足够便宜，才是。"
    }
  ],

  settings: {
    siteTitle: "林知远 · 数字经济与叙事",
    siteDescription: "南山大学数字经济专业大二学生林知远的个人作品集：数据可视化、产品设计与城市观察。",
    marquee: ["OPEN TO 2026 SUMMER INTERNSHIP", "DATA · DESIGN · STORY", "BASED IN HANGZHOU"],
    footerNote: "用一点好奇心和很多杯咖啡做成。",
    showAdminLink: true,
    accent: "#df6249"
  }
};
