# 霓虹纪元 · 机械物种闪卡

基于 Blender 与 Three.js 的交互式 3D 全息卡片网站，以机械恐龙为主题，包含 20 张卡片、精选首页与完整图鉴。卡片详情支持自动赏卡、拖动旋转、翻面、缩放和光影调校。

- [在线体验](https://neon-genesis-holo-cards.leochanai.chatgpt.site)（访问受 Sites 权限设置控制）
- [项目仓库](https://github.com/leochanai/holo-card-studio)
- [制作所用 Skill：holo-card-studio](https://github.com/EverettFish/holo-card-studio)

## 使用的 Skill

本项目使用 **holo-card-studio** Skill 进行卡片制作。该 Skill 由 [EverettFish](https://github.com/EverettFish) 提供，将文字描述或参考图转化为分层素材、可编辑 Blender 场景和 Three.js 交互页面，涵盖素材校验、模型导出及浏览器验证流程。

**Skill 地址：[EverettFish/holo-card-studio](https://github.com/EverettFish/holo-card-studio)**

本仓库保存基于该 Skill 制作并扩展的网站、配置和项目脚本。运行现有网站只需安装前端依赖；重新制作卡片还需要源素材及 Blender 等制作环境。

## 功能

- **精选与图鉴**：首页展示两张精选卡，图鉴收录 No.001–020。
- **招式视频**：20 张卡片各自配有约 8 秒角色动作及原声，支持原声开关；白底视频实时去底后保留角色与背景的分层视差。浏览器拦截有声自动播放时，首次点击页面后开启原声。
- **3D 交互**：自动赏卡、拖动旋转、正反面切换与缩放。
- **全息效果**：分层视差、镭射、线描和闪星效果，可调节光影与景深。
- **响应式页面**：支持桌面端与移动端浏览。
- **可编辑制作流程**：通过 Blender 场景导出真实卡牌网格和离线渲染图。

## 快速开始

准备 Node.js 与 npm，并使用支持 WebGL 的现代浏览器。

```bash
git clone https://github.com/leochanai/holo-card-studio.git
cd holo-card-studio
npm ci --prefix web
npm start
```

启动后访问：

| 页面 | 本地地址 |
| --- | --- |
| 首页 | [http://127.0.0.1:4173/](http://127.0.0.1:4173/) |
| 图鉴 | [http://127.0.0.1:4173/gallery.html](http://127.0.0.1:4173/gallery.html) |
| 卡片详情 | [http://127.0.0.1:4173/card.html?card=001](http://127.0.0.1:4173/card.html?card=001) |

详情页通过 `card` 参数选择卡片，编号范围为 `001`–`020`。如需更换端口：

```bash
PORT=4174 npm start
```

## 静态构建

在项目根目录执行：

```bash
npm run build
```

构建会自动安装 `web/` 依赖，将网站资源复制到 `dist/`，并将 Three.js 依赖整理到 `dist/vendor/three/`。可将 `dist/` 作为静态站点部署目录；每次构建会重新生成该目录。

## 项目结构

```text
.
├── README.md
├── package.json             # 启动与构建命令
├── card-config.json         # No.001 制作配置
├── PROMPTS.md               # 素材生成提示词
├── scripts/                 # 素材处理、Blender 构建、导出与审计脚本
├── cards/
│   ├── batch-*.json         # 批次卡片定义
│   └── <ID>/               # 各卡片制作配置与说明
├── web/
│   ├── index.html          # 精选首页
│   ├── gallery.html        # 图鉴
│   ├── card.html           # 交互详情页
│   ├── catalog.js          # 卡片目录数据
│   ├── card-config.json    # No.001 网页配置
│   ├── assets/             # 网页公共资源与 No.001 资源
│   ├── cards/<ID>/         # 其他卡片的网页配置与资源
│   └── previews/           # 卡片预览图
└── design-review/          # 设计参考与评审资料
```

`dist/` 与依赖目录为生成内容。制作源素材 `assets/`、`cards/*/assets/`、Blender 工程 `*.blend` 及离线渲染目录 `renders/`、`cards/*/renders/` 不随 Git 仓库分发，克隆后可以运行网站，但重新生成卡片需另行恢复这些文件。

网页分发视频经过 H.264 CRF 18 重编码以控制下载体积，保留原始画面尺寸、帧数和音轨；本地生成目录保留原始文件。

完整视频提示词、参考图路径和生成任务编号见 [20 张卡片的视频提示词](docs/video-prompts.md)。

## 卡片列表

| 编号 | 卡片 | 场景 |
| --- | --- | --- |
| 001 | 机械霸王龙 | 热带雨林 / TROPICAL RAINFOREST |
| 002 | 机械沧龙 | 海底火山 / SUBMARINE VOLCANO |
| 003 | 机械棘龙 | 雷暴河口 / STORM ESTUARY |
| 004 | 机械食肉牛龙 | 熔岩荒原 / LAVA BADLANDS |
| 005 | 机械迅猛龙 | 沙漠废墟 / DESERT RUINS |
| 006 | 机械异特龙 | 巨蕨峡谷 / FERN CANYON |
| 007 | 机械双脊龙 | 迷雾湿地 / MIST WETLANDS |
| 008 | 机械南方巨兽龙 | 风暴高原 / STORM PLATEAU |
| 009 | 机械角鼻龙 | 地下水晶洞 / CRYSTAL CAVERN |
| 010 | 机械重爪龙 | 红树林河道 / MANGROVE CHANNEL |
| 011 | 机械三角龙 | 苏铁林缘 / CYCAD FOREST |
| 012 | 机械剑龙 | 晚霞蕨原 / SUNSET FERNLAND |
| 013 | 机械甲龙 | 苔岩山谷 / MOSSY VALLEY |
| 014 | 机械腕龙 | 云雾杉林 / MISTY CONIFERS |
| 015 | 机械梁龙 | 银光河滩 / SILVER RIVERBANK |
| 016 | 机械迷惑龙 | 金色平原 / GOLDEN PLAINS |
| 017 | 机械禽龙 | 银杏林地 / GINKGO WOODLAND |
| 018 | 机械副栉龙 | 回声湖畔 / ECHO LAKESHORE |
| 019 | 机械慈母龙 | 蕨谷绿洲 / FERN OASIS |
| 020 | 机械戟龙 | 紫晶林地 / AMETHYST GROVE |

## 卡片制作与重建

### 分层素材

卡面使用统一的 **1024 × 1536** 画布，包含四层素材：

| 文件 | 用途 |
| --- | --- |
| `subject.png` | 带透明通道的主体 |
| `background.png` | 场景背景 |
| `lineart.png` | 线描效果 |
| `text.png` | 独立排版的透明文字层 |

图像素材通过内置图像生成工具创建，文字层由本地字体排版。制作时需检查透明通道与各层对齐情况。

### 批量重建

项目批量脚本需要 Python 3、Pillow、NumPy 和 Blender。当前脚本使用 macOS 路径：

- Blender：`/Applications/Blender.app/Contents/MacOS/Blender`，配置在 `scripts/produce_batch.py`。
- 字体：`/System/Library/Fonts/STHeiti Medium.ttc`，配置在 `scripts/prepare_batch.py`。

在其他环境运行前需调整上述路径，并恢复对应卡片的源素材。以下命令重建 No.011–020：

```bash
python3 scripts/produce_batch.py --force 011 012 013 014 015 016 017 018 019 020
```

脚本依次准备素材、构建 Blender 场景、导出 GLB、渲染三视图，并更新 `web/` 中的卡片资源与预览图。默认跳过已有完整网页产物的卡片；`--force` 会重新生成并覆盖对应产物。

各卡片制作目录中的主要产物为 `card.blend`、`renders/hero.png`、`renders/tilt-left.png` 和 `renders/tilt-right.png`。

### 渲染说明

GLB 包含真实卡牌网格，使用 `web_front`、`web_edge`、`web_back`、`web_gold` 区分材质角色。glTF 不传递 Blender 自定义全息节点图，网页通过 Three.js GLSL 重建视差、镭射、线描和闪星效果，因此网页与离线渲染可能存在细节差异。

## 检查与验证

在具备本地制作素材、渲染产物及 Python 依赖的环境中，先启动网站，再执行 No.003–010 批次审计：

```bash
python3 scripts/audit_batch.py --base-url http://127.0.0.1:4173
```

该脚本检查文件、配置、GLB、渲染和发布端点，将结果写入 `cards/batch-verification.json`。No.011–020 的已有审计记录位于 `cards/herbivore-verification.json`。

资源审计不能替代浏览器交互检查。修改渲染或交互后，应实际检查卡面显示、左右拖动、翻面、缩放、效果控制和移动端布局。仓库中的审计记录反映对应批次的历史结果，不代表当前版本已重新完成所有检查。
