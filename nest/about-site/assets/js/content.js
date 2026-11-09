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
    { value: "02", label: "在做的站", note: "小窝 · 博客" },
    { value: "2029", label: "预计毕业", note: "本科四年制" }
  ],

  /* ── 成绩 ──────────────────────────────────────────────── */
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

  /* 成果区留 7 个空位，做好一个填一个 */
  projects: [
    {
      id: "bloom",
      title: "指间花事",
      en: "BLOOM",
      category: "交互体验",
      year: "2026",
      featured: true,
      accent: "#c9a86a",
      ink: "#221d12",
      cover: "",
      summary: "握拳是花苞，展掌就开花——摄像头只在你自己的设备上算，一粒种子从指尖长成一整片花园。",
      description: "页面中心是一片 32,000 颗粒子的花。握拳收成苞，展掌炸开，指尖移动就是风；没人操作的时候它自己呼吸。影像全部在本机处理，不上传也不保存，所以敢让人一直开着摄像头看它。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["网页交互原型"],
      tags: ["手势交互", "粒子", "生成图形"],
      link: "https://transcendent-yeot-8b2520.netlify.app/",
      highlight: "32,000 颗粒子 · 手势即开合"
    },
    {
      id: "teardown",
      title: "大疆 Action 4 结构拆解",
      en: "TEARDOWN",
      category: "三维可视化",
      year: "2026",
      featured: true,
      accent: "#4b5a6e",
      ink: "#e8ecf2",
      cover: "",
      summary: "把一台七厘米宽的 Action 4 拆成十个部件：拖动旋转、滚轮缩放、点哪块整机就沿装配方向散开。",
      description: "机身 70.5 × 44.2 × 32.8 mm，里面塞着 1/1.3″ 传感器、155° 镜头、两块屏、1770 mAh 电池和一套磁吸快拆。点任意部件，被点中的那块发光，右侧面板同时给出规格；「合并」送所有部件回原位，「重置视角」只动镜头。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["网页三维模型", "十部件规格面板"],
      tags: ["Three.js", "三维交互", "爆炸图"],
      link: "https://marvelous-marzipan-46a627.netlify.app",
      highlight: "10 个部件 · 点击即拆"
    },
    {
      id: "village",
      title: "古徽州村落生成器",
      en: "HUIZHOU VILLAGE",
      category: "生成设计",
      year: "2026",
      featured: true,
      accent: "#6b7a5a",
      ink: "#f2efe6",
      cover: "",
      summary: "按徽州村落的营造规矩长出一座村子：河路正交、门户朝街、田必近水，十一条校验全过才算「造好」。",
      description: "以黟县西递为样本。每次生成都跑一遍营造校验：河与路正交、临水道路锁直、宅间留白 ≥ 1 格、128 户门户全部朝街、217 格田不越界、跨河 6 座桥、主路两端立牌坊。生成的村子可以换种子、换时辰（晨昼暮夜）、换视角（巡游俯瞰近观）。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["生成式三维场景", "营造校验规则"],
      tags: ["生成设计", "村落形态", "规则校验"],
      link: "https://jiangnan-village-67109.app.workbuddy.host/?sharecode=TJW4FQ4FSN",
      highlight: "11 条校验 · 128 户"
    },
    {
      id: "launge",
      title: "LAOUNGE 咖啡店",
      en: "LAOUNGE",
      category: "课程作品",
      year: "2026",
      featured: false,
      accent: "#8a6a4f",
      ink: "#f7efe4",
      cover: "",
      summary: "一间咖啡店从菜单到取餐的整站：选规格、加订单、填取餐信息，订单真的写进云端库，凭单号和取单码查进度。",
      description: "九款饮品与豆子烘焙分成五类，冷热可切；下单后店员后台立即收到。第二屏是「Already ordered」，输入订单号与取单码读云端状态。页面末尾注明这是课程作品演示，门店信息与支付通道还没接。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["网页站点", "云端订单流程"],
      tags: ["网页设计", "点单流程", "云端数据"],
      link: "https://laounge-coffee.app.workbuddy.host/?sharecode=4HNSCF7FN7",
      highlight: "9 款饮品 · 订单可查"
    },
    {
      id: "dot-motion",
      title: "点阵动画编辑器",
      en: "DOT MOTION",
      category: "前端工具",
      year: "2026",
      featured: false,
      accent: "#3f7d8c",
      ink: "#0f1a1f",
      cover: "",
      summary: "在网格上画点、套动效预设、排序列帧，最后把作品导出成网页文件或 SwiftUI 组件。",
      description: "点阵是最省的美术，也是最难自己做的一种。这个编辑器把三件事合在一起：画、给动效、排节奏，然后直接产出能用的文件——不用再手工抄一遍参数。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["网页编辑器", "导出器（HTML / SwiftUI）"],
      tags: ["点阵动画", "编辑器", "代码导出"],
      link: "https://4m1vc32qwspfs.doubao.link/app/app_17hpubp7eg9/",
      highlight: "画 · 编排 · 导出"
    },
    {
      id: "orb-editor",
      title: "液态玻璃球编辑器",
      en: "ORB EDITOR",
      category: "交互实验",
      year: "2026",
      featured: false,
      accent: "#8f7bd4",
      ink: "#f2eefc",
      cover: "",
      summary: "六组玻璃球预设——Siri 波、声膜、粒子丝带、晶体水珠、紫色余烬、折射凝胶，换个参数就换个样子。",
      description: "给小窝那颗球做的一个外观试验台：在同一个球体上换材质、换动态、换光，实时看效果，再决定要哪一种。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["网页预览工具"],
      tags: ["液态玻璃", "材质实验", "实时预览"],
      link: "https://liquid-orb-editor.app.workbuddy.host/?sharecode=IIZKHYWB77",
      highlight: "6 组预设 · 实时切换"
    },
    {
      id: "jianlai",
      title: "剑来 · 倒计时",
      en: "COUNTDOWN",
      category: "小工具",
      year: "2026",
      featured: false,
      accent: "#5f6f86",
      ink: "#12161d",
      cover: "",
      summary: "给「放寒假」这种非过不可的日子做的一块倒计时屏：天、时、分、秒一直跳，顺手把国庆、中秋也挂上去。",
      description: "目标是 2027 年 1 月 17 日。下面一行写着从哪天起算、已经走过几天、走了百分之几——所以它不只倒数，也在提醒日子正在往前走。底色和那句「你只管执剑前行，莫问前程」是《剑来》的调子。",
      problem: "",
      approach: "",
      outcome: "",
      cut: "",
      learned: "",
      shots: [],
      role: "个人项目 · 独立完成",
      deliverables: ["网页小工具"],
      tags: ["倒计时", "小工具", "前端"],
      link: "https://4m1vc32qwspfs.doubao.link/app/app_17hnw858yvy",
      highlight: "三个目标 · 进度百分比"
    },
  ],

  /* 成果区一共 7 个位置，做好一个填一个 */
  projectSlots: 7,

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
