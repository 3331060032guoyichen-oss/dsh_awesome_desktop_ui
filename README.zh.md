<p align="center"><img src="assets/readme/whale.png" width="88" alt="克莱因蓝与米白色的鲸印标志"></p>

# DSH Awesome Desktop UI

[English](README.md) | 中文
<p align="center"><strong>让 Agent 的能力，住进一张有温度的桌面。</strong></p>
<p align="center">克莱因蓝 · 米白 · 安静的动效 · 看得懂的工作流</p>
<p align="center"><a href="https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/releases">下载与版本</a> · <a href="#视频演示">视频演示</a> · <a href="#设计参考与致谢">设计参考</a> · <a href="README.md">项目首页</a> · <a href="README.en.md">English</a> · <a href="LICENSE">MIT</a></p>



![黄昏中的书桌首页，人物、窗景与稿纸组成完整场景](assets/readme/home.png)

这是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的**非官方桌面 UI 改造**。我们保留它的插件能力，把第一次打开、开始对话、等待思考、理解执行过程这些日常动作，重新设计成一套连贯的体验。

视觉是主要看点，功能不是静态样机：截图来自运行中的客户端。账号、模型和统计截图使用演示账户或测试数据，不展示个人密钥和真实账单。

## 视频演示

<video controls width="100%" src="https://raw.githubusercontent.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/v1.0.0/assets/readme/demo.mp4"></video>

[观看或下载完整实机演示（1 分 53 秒）](https://raw.githubusercontent.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/v1.0.0/assets/readme/demo.mp4) · 建议全屏观看。

## 01 / 从鲸印走进书桌

<table><tr><td width="50%"><img src="assets/readme/opening.png" alt="四块鲸印最初分别处于错误象限，等待拼合"></td><td width="50%"><img src="assets/readme/aligned.png" alt="四块鲸印对齐后短暂停留，准备衔接书桌镜头"></td></tr></table>

新的鲸印由克莱因蓝和米白构成。开场时，四块图像先处于错误的象限，再依次归位；对齐后，镜头自然推进到首页。开场覆盖整个应用窗口，推进过程保留画面的边缘余量。

首页是一张可以进入的书桌。人物大多数时间近乎静止，只保留自然呼吸；头发和右侧叶片在随机间隔里偶尔微动。鼠标带来轻微分层视差，离开后平滑回中，笔筒和高楼保持稳定，不随鼠标变形。

点击稿纸后，镜头向前推进并转为俯视，随后衔接原来的对话界面。时间与场景模式放在设置里，首次打开时侧边栏收起，让画面保持清爽。

## 02 / 对话落在稿纸上

![米白稿纸上的对话与贴底输入框](assets/readme/letter.png)

- **克莱因蓝与米白统一全局**，细网格延续稿纸的质感。
- **输入框贴底**，Token、缓存与速度信息保留在相邻区域；长对话独立滚动。
- **输入时有轻微整体呼吸与细线光波**，文字与工具按钮保持稳定。
- **新对话留在当前工作区**，不会再次跳回开场。
- 正文继续支持选中、复制与键盘操作；启用“减少动态效果”时，装饰动效让位于静态呈现。

## 03 / 看得懂的 Agent 工作过程

![以克莱因蓝、米白文字、浅格线呈现的任务轨迹](assets/readme/trajectory.png)

轨迹采用瑞士平面设计的秩序感：明确的层级、宽松留白、清晰的时间顺序。默认先看“你的请求、采取的行动、得到的结果”，需要时再进入技术记录，方便非工程师理解 Agent 到底做了什么。

![运行时鼠标局部透视显示同一会话的轨迹](assets/readme/perspective.png)

**鼠标局部透视**把对话与执行过程放在同一个空间：运行时可以在鼠标附近查看轨迹，滚轮只滚动透视区域内的内容，整页不会跟着鼠标移动。点击输入框左下角“轨迹”进入完整视图，右上角“关闭轨迹”返回对话。完整轨迹里不叠加输入框，也不出现工作区 Hook 连线。

## 04 / 设置也属于同一套设计

### 账号与用量：把重要信息放在一起

![账号与余额、Token 用量及每日用量热图](assets/readme/account.png)

账号、可用余额、今日／本月／累计 Token、缓存命中率与每日用量热图集中在设置里，不再额外占用侧边栏。统计服务不可用时显示实际状态，不用虚构数字填满界面。扩展统计依赖 `dsh-usage-stats` 服务，见下方插件说明。

### 插件市场：搜索，然后按用途找

![搜索框下方的第三方、会话、全局三类插件导航](assets/readme/market.png)

搜索框下方横向排列 **第三方插件 / 会话插件 / 全局插件**。分类切换保留搜索条件；第三方目录复用现有的详情、版本兼容检查和安装流程，会话与全局插件分别展示各自的真实状态。分类导航借鉴 Gooey Nav 的融合与分离节奏，配色沿用整套桌面。

### 模型皮套：每次打开，都有一次轻巧展开

<table><tr><td width="50%"><img src="assets/readme/models.png" alt="浅色主题中的模型卡片与鲸印皮套"></td><td width="50%"><img src="assets/readme/models-dark.png" alt="深色主题中的模型卡片与鲸印皮套"></td></tr></table>

打开模型页时，印着鲸印的皮套先舒展，真实模型提供方卡片再依次升起、落稳。编辑与删除仍是原来的功能入口；这不是一段盖在配置页面上的展示动画。

浅色采用米白与克莱因蓝；深色采用深靛蓝与暖米白。**浅色、深色、跟随系统均可使用**，手动选择不会被系统变化覆盖。

## 05 / 那些每天都会碰到的细节

| 细节 | 体验 |
| --- | --- |
| 工作区 Hook | 连线从具体工作区文件夹连接到内部会话；文件层级清晰，轨迹页面不受影响。 |
| 推理强度 | 克莱因蓝到紫色的渐变、粒子密度与运动速度随档位变化。DeepSeek 保留真实的 Low / High / Max 三档，其他模型按能力呈现。 |
| 输入框 | 聚焦时轻微呼吸、细线波动与移动光波，避免整体晃动干扰输入。 |
| 侧边栏 | 整块面板以像素快速聚拢或展开，在既定的三组点缀色中变化。 |
| 小图标 | 插件风车悬停后逐渐加速，移开后缓缓停止；自动化时钟提供对应反馈。 |
| 控件触感 | 圆角焦点框贴合控件，轻按有微小位移，触屏主要操作保留 44px 目标。 |

<details>
<summary>查看 Hook、推理强度、像素侧栏与状态细节截图</summary>

![工作区文件的 Hook 层级连线](assets/readme/hook.png)
![推理强度渐变轨道与粒子细节](assets/readme/effort.png)
![整块侧边栏的像素聚拢与展开过程](assets/readme/sidebar.png)
![对话中的 Agent 状态反馈](assets/readme/status.png)

</details>

## 开始使用

### Windows 桌面端

前往 [Releases](https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/releases) 查看当前发布内容。若版本提供 Windows x64 `.exe` 安装包，可以直接下载安装；若仅提供源码，请使用下方方式运行。

首次使用需要登录自己的 DeepSeek 账号，或在设置中配置可用的模型提供方。账号、密钥、余额和历史记录不会随此仓库分发。

### 从源码运行

需要 Node.js **24.9+**、Git，以及项目锁定的 pnpm。详细环境要求见 [上游开发指南](docs/development.zh.md)。

```powershell
git clone https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui.git
cd dsh_awesome_desktop_ui
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm run start:desktop
```

### 插件说明

项目沿用 Harness 的基础插件体系，包括会话、工作区、文件、工具、权限和模型配置。**可用工具以当前部署启用的插件为准。**

- 插件市场使用 [Awesome DSH Plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 的公开索引。需要在插件管理中启用“自定义插件索引”；默认索引地址为 `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json`。启用索引不会自动安装目录里的插件。
- 账号统计界面参考并对接 [dsh-usage-stats](https://github.com/Ychris12138/dsh-usage-stats)。本地演示使用它的后端适配版本；未启用统计服务时仍可查看账号和基础余额，扩展统计会提示服务状态。
- 这是 **UI 版本 v1.0.0**，当前底层 Harness 版本为 **0.2.1-rc.3**。两者的版本号分别描述本项目设计版本与上游运行时。

## 设计参考与致谢

我们希望参考来源被看见，也希望说明哪些部分是重新设计与实现的。

| 参考来源 | 在本项目中的转化 |
| --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | 插件架构、模型接入和桌面运行基础；本项目是其非官方 UI 改造。 |
| [illoca](https://illoca.unseen.co/) | 借鉴空间推进与进入场景的叙事方式，改为鲸印拼合、书桌与稿纸之间的连续镜头。 |
| [Rare UI · Hook Sidebar](https://rareui.com/) | 借鉴连接线的层级表达，重新适配工作区、会话与文件树。 |
| [Rare UI · Gooey Nav](https://rareui.com/) | 借鉴分类按钮融合、分离的微交互，用于插件市场横向导航。 |
| [Rare UI · AI Status / Grid Reveal](https://rareui.com/) | 借鉴状态反馈与逐步显露的节奏；本地状态组件和动效按 Harness 生命周期重新实现。 |
| [Token Pass Intro Animation](https://recent.design/i/poqewfx-token-pass-intro-animation) | 借鉴皮套展开、卡片依次显露的动作顺序，使用自己的鲸印与实际提供方配置卡片。 |
| [Vibe Selector Microinteraction](https://recent.design/i/maajesu-vibe-selector-microinteraction) | 借鉴像素聚散的动感，改为整块侧边栏的开合，而非仅按钮图标的特效。 |
| [dsh-codex-effort-slider](https://github.com/Microqian2th/dsh-codex-effort-slider) | 推理强度滑条的交互参考，重做品牌渐变、粒子节奏与可用档位。 |
| [dsh-usage-stats](https://github.com/Ychris12138/dsh-usage-stats) | 账号余额、用量与日历统计的数据和呈现参考。 |
| [Awesome DSH Plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | 第三方插件目录与发现入口。 |
| 瑞士平面设计 | 轨迹页的信息层级、网格、字体尺度与留白秩序。 |

鲸印拼合方式、首页构图、自然待机、视差约束、稿纸转场、鼠标局部透视、品牌主题、输入框波动与整套交互衔接，均围绕这张桌面的使用体验进行了定制。插画和鲸印素材由本项目设计流程生成，未直接取用参考站点的宣传图片。

## 开发与反馈

欢迎通过 [Issues](https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/issues) 提交显示尺寸、主题、动效或交互问题。附上系统、窗口大小和截图会更容易复现。

本次设计已进行组件检查、关键页面流程检查与构建检查；Windows 安装与模型联网能力需要结合实际发布包和使用环境验证。原始项目说明保留在 [README.upstream.md](README.upstream.md) 与 [中文上游说明](README.upstream.zh.md)。

## License

[MIT](LICENSE)。保留 DeepSeek 上游及各第三方依赖的许可与版权信息。设计参考链接用于说明灵感与来源，不代表原作者参与或背书本项目。
