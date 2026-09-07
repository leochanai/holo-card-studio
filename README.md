# 霓虹纪元 · 机械物种闪卡

GitHub: https://github.com/leochanai/holo-card-studio

Sites: https://neon-genesis-holo-cards.leochanai.chatgpt.site （访问受 Sites 权限设置控制）

本地运行：`npm ci --prefix web`，然后 `npm start`。线上静态构建：`npm run build`，输出到 `dist/`。

由 Blender 可编辑场景和 Three.js 交互详情页组成的机械恐龙卡片站点。首页保留两张精选卡，图鉴收录十张卡；详情默认开启自动赏卡，也支持拖动、翻面、缩放与光影调校。

本地启动：`node web/server.mjs`。首页：`http://127.0.0.1:4173/`；图鉴：`http://127.0.0.1:4173/gallery.html`。

| 编号 | 卡片 | 场景 | 详情 |
| --- | --- | --- | --- |
| 001 | 机械霸王龙 | 热带雨林 / TROPICAL RAINFOREST | `http://127.0.0.1:4173/card.html?card=001` |
| 002 | 机械沧龙 | 海底火山 / SUBMARINE VOLCANO | `http://127.0.0.1:4173/card.html?card=002` |
| 003 | 机械棘龙 | 雷暴河口 / STORM ESTUARY | `http://127.0.0.1:4173/card.html?card=003` |
| 004 | 机械食肉牛龙 | 熔岩荒原 / LAVA BADLANDS | `http://127.0.0.1:4173/card.html?card=004` |
| 005 | 机械迅猛龙 | 沙漠废墟 / DESERT RUINS | `http://127.0.0.1:4173/card.html?card=005` |
| 006 | 机械异特龙 | 巨蕨峡谷 / FERN CANYON | `http://127.0.0.1:4173/card.html?card=006` |
| 007 | 机械双脊龙 | 迷雾湿地 / MIST WETLANDS | `http://127.0.0.1:4173/card.html?card=007` |
| 008 | 机械南方巨兽龙 | 风暴高原 / STORM PLATEAU | `http://127.0.0.1:4173/card.html?card=008` |
| 009 | 机械角鼻龙 | 地下水晶洞 / CRYSTAL CAVERN | `http://127.0.0.1:4173/card.html?card=009` |
| 010 | 机械重爪龙 | 红树林河道 / MANGROVE CHANNEL | `http://127.0.0.1:4173/card.html?card=010` |

Git 仓库仅保留网站运行素材、配置和生成脚本。`assets/`、`cards/*/assets/`、`*.blend` 与 `renders/` 制作素材和离线效果图仅保留在制作机器本地，不随克隆下载；重新生成卡片需另外恢复这些源素材。

制作机器上，每张 003–010 卡的独立源码都在 `cards/ID/`：输入与四层贴图在 `assets/`，文案和参数在 `card-config.json`，可编辑工程为 `card.blend`，生成提示词为 `PROMPTS.json`，三视图为 `renders/hero.png`、`renders/tilt-left.png`、`renders/tilt-right.png`。发布副本位于 `web/cards/ID/`，图鉴预览为 `web/previews/ID.png`。

素材以内置图像生成工具创建；用户授权后，对无透明通道的纯白背景主体进行本地抠图，已有真实 alpha 的主体会原样保留。四层统一为 1024×1536，独立文字层由本地字体排版。`scripts/produce_batch.py` 会按卡号准备素材、构建 Blender 场景、导出真实 GLB、渲染三视图并发布到网站。

GLB 包含真实卡牌网格及 `web_front`、`web_edge`、`web_back`、`web_gold` 材质角色。glTF 不传递 Blender 自定义全息节点图，网页由 Three.js GLSL 重建视差、镭射、线描和闪星效果，因此与离线渲染可能有细节差异。

本地服务运行后可执行 `python3 scripts/audit_batch.py` 对 003–010 做文件、配置、GLB、渲染与发布端点审计，结果写入 `cards/batch-verification.json`。该工具不替代浏览器交互验收；本文档不声明浏览器测试已经完成。

### 本批网页检查

No.003–010 已逐张在内置浏览器中检查实际卡面；十张缩略图均加载。棘龙卡完成翻面、左右拖动、镭射、缩放、前后景深控制检查。390×844 下图鉴与最长标题详情无横向溢出。最终检查期间无新增控制台错误。页面截图和记录在 `cards/qa/`。保存按钮已触发，但浏览器未返回下载事件，因此下载成功尚未确认；可直接使用各卡 `renders/` 中的成品 PNG。
