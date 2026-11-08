/* ============================================================
   Default content for 郑宇彬 / Zheng Yubin.
   内容全部写死在这里；改文案直接改这个文件即可。
   （原模板的 /admin/ 后台没有随包搬过来，所以不走 localStorage。）
   ============================================================ */

window.PORTFOLIO_DEFAULT = {
  version: 1,

  profile: {
    name: "郑宇彬",
    nameEn: "Zheng Yubin",
    role: "数字经济 · 本科在读（2025 级）",
    roleShort: "数据 / 前端 / 网页动效",
    school: "武汉理工大学",
    location: "武汉 / 中国",
    availability: "开放实习与交流",
    status: "在准备保研，也在找能真正上手做的项目",
    tagline: ["在数据与叙事之间，", "搭一间有温度的小窝。"],
    intro:
      "我是郑宇彬，武汉理工大学数字经济专业 2025 级本科生，安徽黄山人，现在住在武汉。白天和表格、SQL、爬虫打交道，晚上鼓捣网页——给一颗玻璃球搭背景，给一间小窝装一扇窗。我相信数据不是终点，它只是理解世界的一个入口。",
    email: "byuyan@qq.com",
    avatar: "assets/img/portrait.webp",
    socials: [
      { label: "GitHub", handle: "@byuyan", url: "https://github.com/byuyan" },
      { label: "小窝", handle: "byuyan.github.io/nest", url: "https://byuyan.github.io/nest/" },
      { label: "邮箱", handle: "byuyan@qq.com", url: "mailto:byuyan@qq.com" }
    ]
  },

  stats: [
    { value: "3.41", label: "GPA", note: "5 分制 · 已修 53 / 175 学分" },
    { value: "02", label: "班级排名", note: "必修绩点 · 24 人里第 2" },
    { value: "02", label: "在做的站", note: "小窝 · 博客" },
    { value: "2029", label: "预计毕业", note: "本科四年制" }
  ],

  /* ── 成绩 ──────────────────────────────────────────────── */
  achievements: [
    {
      id: "gpa",
      year: "2026",
      tag: "学业",
      value: "3.408",
      title: "GPA / 5 分制",
      note: "已修 53 / 175 学分，专业核心课均分在 80 以上"
    },
    {
      id: "rank",
      year: "2026",
      tag: "排名",
      value: "2 / 24",
      title: "必修绩点班级第二",
      note: "数字经济 2503 班 · 按必修课绩点排名"
    },
    {
      id: "contest",
      year: "2026",
      tag: "竞赛",
      value: "备赛",
      title: "正大杯市场调查与分析大赛",
      note: "负责数据整理与可视化部分，选题在做预调研"
    },
    {
      id: "courses",
      year: "2026",
      tag: "课程",
      value: "03",
      title: "专业课设计项目",
      note: "数据库原理实验、区块链共识机制、汽车供应链金融风控"
    }
  ],

  timeline: [
    {
      year: "2026",
      date: "2026.11 — NOW",
      title: "「小窝」上线",
      org: "个人项目 · 网页设计与前端",
      desc: "从一颗不能碰的 WebGPU 玻璃球开始，把开场、壁纸、时钟、信箱、文章区、作品集一件件装进去，最后自己写了一套没有构建步骤的部署流程。",
      tag: "正在进行"
    },
    {
      year: "2026",
      date: "2026.10",
      title: "个人博客上线",
      org: "个人项目 · Node.js + Express",
      desc: "用 Express 写了一个能发文章、能留言的小博客，第一次完整跑通「数据库 — 接口 — 页面」这条链。",
      tag: "项目"
    },
    {
      year: "2026",
      date: "2026.09 — NOW",
      title: "大二上的三门硬课",
      org: "武汉理工大学 · 数字经济",
      desc: "数据库原理、区块链共识机制、汽车供应链金融风控，三门课各交了一份从零做到成稿的设计与实验报告。",
      tag: "课程"
    },
    {
      year: "2025",
      date: "2025.09",
      title: "入学武汉理工大学 · 数字经济",
      org: "经济与管理学院",
      desc: "在第一节编程课上写下第一行 print，发现代码可以把想法真的跑起来。",
      tag: "起点"
    }
  ],

  /* 「这个站本身」的版本记录 */
  siteLog: [
    {
      version: "v4",
      date: "2026.11",
      title: "文章区和作品集进来了",
      desc: "补了文章列表、单篇阅读页，作品集留了 7 个空位——做好一个填一个。"
    },
    {
      version: "v3",
      date: "2026.11",
      title: "黑底太空了，给球加了一层背景",
      desc: "星云、两圈刻度环、点环与微光颗粒，全是纯 CSS 叠在球后面，球本身的脚本一个字节没动。"
    },
    {
      version: "v2",
      date: "2026.11",
      title: "改成全屏开场",
      desc: "整块 iframe 盖住首屏，点一下就进小窝；右下角那颗浮球撤了，微信入口挪进名片卡。"
    },
    {
      version: "v1",
      date: "2026.11",
      title: "第一版：蓝莓壁纸与翻页时钟",
      desc: "一页到底：壁纸、时钟、名片、信箱、留言。后来觉得功能太少，才有了后面几版。"
    }
  ],

  skills: [
    {
      id: "data",
      title: "数据",
      en: "DATA",
      desc: "把散落的数据整理成能回答问题的样子。",
      items: [
        { name: "Python", level: 70, note: "Pandas / 爬虫 / 自动化" },
        { name: "SQL", level: 68, note: "查询、聚合、窗口函数" },
        { name: "Excel", level: 82, note: "建模、透视、可视化" },
        { name: "数据分析", level: 72, note: "清洗、口径、结论" }
      ]
    },
    {
      id: "front",
      title: "前端",
      en: "FRONT-END",
      desc: "网页是自己写的，所以每一个像素都改得动。",
      items: [
        { name: "HTML / CSS", level: 78, note: "布局、动效、响应式" },
        { name: "JavaScript", level: 70, note: "原生，不用框架也能做" },
        { name: "Three.js", level: 60, note: "3D 可视化、着色器入门" },
        { name: "Node / Express", level: 62, note: "接口与静态站部署" }
      ]
    },
    {
      id: "method",
      title: "方法与表达",
      en: "METHOD",
      desc: "把复杂的事说清楚，比把它做得炫更难。",
      items: [
        { name: "信息设计", level: 74, note: "排版、层级、叙事" },
        { name: "网页动效", level: 70, note: "缓动、节奏、留白" },
        { name: "写作", level: 76, note: "把过程和判断写下来" },
        { name: "公开表达", level: 66, note: "答辩、路演、讲清楚" }
      ]
    }
  ],

  tools: [
    "Python", "SQL", "Excel", "Node.js", "Express", "Three.js",
    "Figma", "VS Code", "Cursor", "Git", "Pillow", "Notion"
  ],

  projects: [
    {
      id: "nest",
      title: "小窝",
      en: "Nest",
      category: "网页设计",
      year: "2026.11",
      featured: true,
      accent: "#8aa8ff",
      ink: "#0a0e18",
      cover: "assets/img/project-nest.webp",
      summary: "一间自己搭的电子小窝：全屏玻璃球开场、蓝莓壁纸、翻页时钟、能留言的信箱。",
      description:
        "开场是一颗在 GPU 上实时算出来的液态玻璃球，点一下才进站。站里还有三张蓝莓壁纸、会真的翻页的时钟、两条实时合成的环境音、一个真能留言的信箱，以及刚补上的文章区和作品集。全站没有构建步骤，改完打包推一次就上线。",
      problem: "想要一个属于自己的、不像模板的个人站。别人的作品集都很像：白底、卡片、同一套排版。我想先让人记住打开的那一下。",
      approach: "护住那颗球：把那颗球的脚本原封不动搬进来，所有装饰都放在它外面，绝不去改它的参数。然后用一层又一层很小的东西把页面填满——时钟、唱片机、信箱、文章、作品。",
      outcome: "现在它是一间能待一会儿的屋子，而不是一张简历。用无头浏览器逐帧截图验过：球的脚本和改之前逐字节一致。",
      cut: "没做后端。留言走 GitHub Issues，读不需要登录，写需要一次 GitHub 登录——这是静态站能接受的边界。",
      learned: "「不改」是最难的需求。你不能靠记忆保证没动过，只能靠哈希和逐字节比对证明。",
      shots: [],
      role: "设计 / 前端 / 部署",
      deliverables: ["主页", "文章列表与阅读页", "作品页", "部署流程"],
      tags: ["HTML/CSS/JS", "WebGPU", "GitHub Pages"],
      link: "https://byuyan.github.io/nest/",
      highlight: "无构建 · 27 个文件 · 一次推上线"
    },
    {
      id: "blog",
      title: "个人博客",
      en: "Blog",
      category: "全栈",
      year: "2026.10",
      featured: true,
      accent: "#b7c7a8",
      ink: "#1b2417",
      cover: "assets/img/project-blog.svg",
      summary: "用 Node.js + Express 写的能发文章、能留言的小博客。",
      description:
        "第一次自己跑通「数据库 — 接口 — 页面」这条链：文章存库、列表分页、留言落库，前端只做展示。写它的目的不是上线给别人看，是想知道一个站从零到能被访问，中间到底有哪几步。",
      problem: "写了很多笔记，但从来没有一个「自己的地方」把它们放起来，全是散在各处的文档。",
      approach: "用 Express 起服务，先把文章的表结构和接口定下来，再做列表页和详情页，最后补一个留言接口。中途最麻烦的是部署和域名，而不是代码。",
      outcome: "现在能发文章、能收留言。它让我在后面做静态站的时候，知道「服务器那一层」大概在做什么。",
      cut: "没做登录和权限。一个人的博客，先能写再说。",
      learned: "先跑通最窄的一条路：一篇文章能从数据库查到页面上，其它功能都是加在这条路上的。",
      shots: [],
      role: "后端 / 前端",
      deliverables: ["文章接口", "列表与详情页", "留言功能"],
      tags: ["Node.js", "Express", "数据库"],
      link: "",
      highlight: "从零跑通一条完整链路"
    },
    {
      id: "coursework",
      title: "三门专业课的设计与实验",
      en: "Coursework",
      category: "课程项目",
      year: "2026.09",
      featured: true,
      accent: "#e8c98a",
      ink: "#2a2108",
      cover: "assets/img/project-course.svg",
      summary: "数据库原理实验、区块链共识机制、汽车供应链金融风控，各一份从零到成稿的报告。",
      description:
        "数据库那份做的是从建表、写 SQL 到索引与事务的实验，一路把「为什么慢」弄清楚；区块链那份把共识机制拆开复现了一遍；风控报告则是把一个供应链金融场景的风险点列出来，再用数据去验证。",
      problem: "课本上的结论都太干净了。想知道真实数据脏起来、指标互相打架的时候，这些方法还成不成立。",
      approach: "三门课各做一份完整交付：数据库从 ER 图到索引优化，区块链从共识流程到小型复现，风控从场景拆解到指标验证。每份都要求能复算。",
      outcome: "三份报告都拿到了不错的评价，也第一次体会到「能复算」比「写得好看」重要。",
      cut: "没做炫技的可视化。课程作业的交付物是结论，不是海报。",
      learned: "把过程写下来，比把结果记住有用得多——下一次遇到同类问题，翻的是自己的报告。",
      shots: [],
      role: "数据分析 / 建模 / 写作",
      deliverables: ["数据库实验报告", "共识机制复现", "风控分析报告"],
      tags: ["SQL", "区块链", "风控", "报告写作"],
      link: "",
      highlight: "3 份可复算的报告"
    }
  ],

  notes: [
    {
      id: "orb-untouched",
      title: "把一颗不能碰的球搬进我的网站",
      date: "2026-11-07",
      tag: "建站记录",
      readTime: "5 min",
      excerpt: "那颗流动的玻璃球不是我的代码。我要做的只有一件：让它原封不动地住进小窝，并且证明它真的没被碰过。",
      content:
        "开场那颗球是 WebGPU 写的，wgsl 在显卡上实时算。它比我整个网站都难写，所以我给自己定了一条死规矩：参数一个都不动。\n\n做法很朴素：把它单独放成一个页面，用 iframe 盖在首屏，整屏铺一层按钮负责「点一下进站」。这样它照自己的节奏跑，我在外面加什么都不影响它。\n\n至于「没碰过」这件事，不能靠嘴说。线上那一版和本地这一版，整份文件逐字节比一次，再把 <script type=\"module\"> 整段抠出来算哈希——两边一样，才算数。\n\n后来我给它加背景、加文字、改导航，这段脚本的哈希到今天还是那一个。"
    },
    {
      id: "ambient-layer",
      title: "黑底太空了，所以给球加了一层背景",
      date: "2026-11-08",
      tag: "建站记录",
      readTime: "4 min",
      excerpt: "球外面那片星云、两圈刻度环和球底的反光，全部是 CSS。加这些东西最难的并不在于写，而在于确认自己真的没碰到球。",
      content:
        "球很好看，但它孤零零地悬在一片纯黑里。我想让它看起来像「待在一间屋子里」，而不是「贴在一张黑纸上」。\n\n于是我在球外面加了一层很轻的东西：缓慢呼吸的蓝紫辉光、两圈反向转动的刻度环、几点几乎看不见的微光颗粒，球底下再补一小片反光，四边压暗。全部是纯 CSS，一个字符都没进那个脚本。\n\n验证的办法还是同一个：截图看球有没有变形，比对文件看字节有没有变。两件事都过了，我才敢说「只是加了点空气」。"
    },
    {
      id: "deploy",
      title: "没有构建步骤，我是怎么把它推上公网的",
      date: "2026-11-08",
      tag: "建站记录",
      readTime: "4 min",
      excerpt: "没有 Node、没有打包、没有 npm install。一条一次性 workflow，把压缩包解开、提交、推送，然后自己删掉。",
      content:
        "这个站一行构建命令都没有。本地改完，我把要发布的文件打进一个 zip，传到一个临时直链上。\n\n然后在仓库里推一条一次性的 GitHub Actions workflow：它拉下那个包，解到站点目录，有差异就提交并推送，跑完我立刻把这条 workflow 删掉。\n\n为什么要绕这么大一圈？因为这样我不用在本机装 git、不用配凭据，也不必担心把中间文件留在仓库里。代价是每次发布要多等一分钟。\n\n后来我把这套流程写进 README，下一次照着做就行——比记住一堆命令可靠。"
    }
  ],

  /* ── 爱好 ──────────────────────────────────────────────── */
  hobbies: [
    {
      id: "web",
      title: "网页与动效",
      en: "WEB & MOTION",
      desc: "会因为一个过渡曲线不对，反复调半小时。喜欢那种「说不上哪里不一样，但就是顺了」的瞬间。"
    },
    {
      id: "lifting",
      title: "力量训练",
      en: "TRAINING",
      desc: "三分化，一周三练。从不敢加重量到能稳定完成一组，是这一年里最踏实的一件小事。"
    },
    {
      id: "photo",
      title: "拍照与修图",
      en: "PHOTO & EDITING",
      desc: "手机随手拍，回来慢慢调色。判断一张图好不好，看的是第一眼有没有把人留住。"
    },
    {
      id: "writing",
      title: "写东西",
      en: "WRITING",
      desc: "写下来才算真的想明白。很多没头绪的晚上，是靠写完一段话理顺的。"
    }
  ],

  settings: {
    siteTitle: "郑宇彬 · 数字经济与叙事",
    siteDescription: "武汉理工大学数字经济专业本科生的个人主页：成绩、能力、成果、经历与爱好。",
    marquee: ["BASED IN WUHAN", "DATA · CODE · STORY", "OPEN TO INTERNSHIP"],
    footerNote: "用一点好奇心和很多杯咖啡做成。",
    showAdminLink: false,
    accent: "#8aa8ff"
  }
};
