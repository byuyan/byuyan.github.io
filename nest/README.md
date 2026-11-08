# 郑宇彬的小窝 · NEST

一间自己搭的电子小窝。全屏蓝莓壁纸、翻页时钟、实时合成的环境音、一个真能留言的信箱，外加一个真能读的文章区和作品集。

线上：<https://byuyan.github.io/nest/>

## 结构

```
index.html             主页（首屏 / 文章预览 / 作品预览 / 信箱 / 关于）
me.html                介绍页：把 about-site 整页 iframe 进来（米白纸张风格，左下角一枚「回小窝」）
posts.html             文章列表
post.html              单篇阅读页（?p=<slug>）
works.html             作品页（7 个位置，目前全空，做好一个填一个）
assets/css/site.css    主页样式（无框架）
assets/css/sub.css     子页样式（文章 / 作品，叠在 site.css 之上）
assets/js/site.js      主页逻辑（无依赖）
assets/js/sub.js       子页逻辑：铺壁纸、画列表、画作品卡
assets/js/md.js        极简 markdown 渲染（window.NEST_MD.render）
assets/data/posts.json 文章元数据
assets/data/works.json 作品元数据
posts/*.md             文章正文
assets/img/            壁纸、圆头像、微信二维码、4 张作品封面 + 空位占位图
assets/orb/splash.html 开场那颗球（WebGPU wgsl 实时渲染，独立页面，被 index.html 的 iframe 载入）
about-site/            介绍页本体（米白纸张风格的八分区个人主页，自成一页，被 me.html 整页 iframe）
  index.html           关于 / 成绩 / 能力 / 成果 / 经历 / 随笔 / 爱好 / 联系
  project.html         成果详情（?p=<id>）
  note.html            随笔详情（?n=<id>）
  assets/js/content.js 全部文案与数据都在这里（window.PORTFOLIO_DEFAULT）
```

介绍页的文字改动**只改** `about-site/assets/js/content.js` 一个文件就行，页面上的姓名、学校、位置、英文名等静态占位在 `about-site/index.html` 里（搜「郑宇彬」）。这个副本没有搬后台（原模板的 `/admin/`），所以内容不走 localStorage，改完直接改文件。

没有构建步骤，没有 npm，双击 `start-preview.bat` 或在目录下跑 `python -m http.server 4175` 就能本地预览。

> `post.html` 要用 `fetch` 读 `posts/*.md`，用 `file://` 直接双击打开会被浏览器拦住，必须走上面那个本地服务。

## 页面里有什么

- **开场**：打开站点先是一整屏黑底的液态玻璃球，wgsl 在 GPU 上实时算出来的，点一下就进小窝。球后面还有一层纯 CSS 的背景——缓慢呼吸的蓝紫辉光、两圈反向转动的刻度环、点环、淡淡漂移的星尘与微光颗粒，球底下有一小片反光，四边压暗。没有 WebGPU 的机器（老机器、部分安卓、Safari）自动换成一颗静态玻璃球，不会白屏。
- **全屏壁纸**：固定一张蓝莓微距（`assets/img/wall-1.jpg`），不做切换，子页共用同一张。
- **机械滚轮时钟**：每一位是一根竖排数字轮（0-9 排三圈），哪一位变了就单独往下滚一格，末尾有 6% 左右的过冲再弹回，像老式里程表。实现见 `site.js` 的 `rollTo()`。
- **灯光**：首屏右上角那盏灯。开关可以点也可以拖，滑块拖过一半会吸附到那一头，松手带回弹；灯亮时指示灯亮、灯泡由灰变暖、整间屋子亮一层（暖光从右上角晕开）。状态存在 `localStorage` 的 `nest.lamp.v1`，带 `?lamp=1` / `?lamp=0` 可以指定开或关。
- **名片**：头像、名字、一句话签名、文章 / 作品 / 留言三个数字，底下一个「加我微信」按钮。
- **微信卡片**：点按钮弹出，里面是二维码图，X 或 Esc 关掉。
- **文章**：主页露三篇最新的，`posts.html` 是全部，`post.html?p=<slug>` 是正文。正文是本地 markdown，由 `md.js` 现渲染。
- **作品**：主页在作品为空时显示一条提示，填进第一个作品后自动变成卡片；`works.html` 是 7 个位置的全貌；点卡片展开「我做的 / 交付物 / 技术栈」。
- **介绍页**（`me.html`）：导航第 4 项「介绍」。整页 iframe 的是 `about-site/`，米白纸张风格和八分区一点没改，只把文案换成了本人的真实信息；页面左下角浮着一枚「回小窝」，点它会用约 0.6 秒平滑滚回你离开主页时的位置（跳过开场，不重放球）。想改介绍里的字，去 `about-site/assets/js/content.js`。
- **唱片机**：两条实时合成的环境音（夜晚垫音、清晨雾气声），用 Web Audio 现场生成，没有音频文件，也就没有版权问题。
- **信箱**：留言真实存在本仓库的 GitHub Issues 里，读留言不需要登录，写留言会跳到 GitHub 的新建 issue 页。
- **最近的脚印**：拉取 `byuyan/byuyan.github.io` 的真实提交记录。
- **设置抽屉**：24 小时制、显示秒、毛玻璃浓度、进页面是否出声。
- **小窝助手**：右下角那颗 AI，是规则问答，答不上的会引导你去留言。

## 怎么改

- **写新文章**：正文写成 `posts/xxx.md`（支持标题、列表、引用、代码块、粗体、链接），再在 `assets/data/posts.json` 里加一条 `{slug,title,date,tag,minutes,summary,file}`。`date` 用 `YYYY-MM-DD`。
- **补一个作品**：封面图放进 `assets/img/`，在 `assets/data/works.json` 里找到 `slot-01`（或 02 … 07 任意一格），把 `placeholder` 删掉，填 `title / category / year / cover / summary / desc / role / deliverables / tags / highlight`。空位卡片会自动变成真卡片，页头的「已放 N 个」和主页统计也会跟着变。
- **多留几个空位**：在 `works.json` 末尾照样加 `{ "id": "slot-08", "slot": 8, "placeholder": true, "cover": "assets/img/slot-empty.svg" }`。
- **换壁纸**：把图片放进 `assets/img/wall-1.jpg`（同名覆盖），`site.js` 与 `sub.js` 顶部的 `WALLS` 两处路径不用动。
- **换名字、签名、数字**：直接改 `index.html`，搜“郑宇彬 / 在数据与叙事之间”。
- **换音乐**：`site.js` 里的 `TRACKS` 换成你的歌，并把 `startAudio()` 改成播放 `<audio>` 里的真实 mp3。
- **换留言仓库**：`site.js` 里的 `REPO` 改成你的 GitHub 仓库名即可。

## 部署

站点物理位置是 `byuyan/byuyan.github.io` 仓库 `main` 分支的 `nest/` 子目录（`byuyan/nest` 那个仓库从没开过 Pages，访问不到）。

改完文件后：打包 → 传到临时直链 → 推一条一次性 workflow（`workflow_dispatch` + `push`，`curl` 拉包、`unzip -o` 到 `nest/`、有 diff 才 commit+push）→ 等一分钟 → 请求线上地址核验 → 删掉那条 workflow。

## 已知边界

- 留言需要 GitHub 账号登录一次才能发（GitHub 的公开接口不允许匿名写）。想让人人免登录留言，需要接一个后端，比如 Supabase、Cloudflare Workers 或 Firebase，代码里换掉 `loadGuest()` 与 `openWrite()` 两处即可。
- 作品页的七个位置是**占位卡片**，不是网页端上传口——要补内容得改 `works.json` + 放图，再走一次上面的部署流程。
- 介绍页里写死的邮箱是 `byuyan@qq.com`；成绩、奖项、经历用的是本人已确认的信息，其余细则（CET、具体竞赛名次等）暂标为「备赛中 / 待补」，要改去 `about-site/assets/js/content.js`。
