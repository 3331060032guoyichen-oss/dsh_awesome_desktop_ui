---
description: "dsh Web 客户端的「插件市场」设置分区：设置导航项与供功能插件注册标签页的标签行。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-plugins

[English](README.md) | 中文

## 概述

**插件市场**拥有共享搜索框及其下方的横向分类导航。第三方插件由发现功能提供，会话插件和全局插件由清单功能分别提供。分类切换保留搜索与已访问页面状态，支持方向键、Home、End；导航以融合与分离的短动画反馈选择，减少动态效果时保持静态。

键盘焦点沿用各标签现有的圆角轮廓，一像素的短暂按压反馈确认操作且不影响布局。减少动态效果时取消位移。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在设置里打开**插件市场**。按顺序查看第三方插件、会话插件和全局插件；第三方分类仅在部署启用插件索引与管理能力时出现。只有一个贡献时直接显示其页面，没有贡献时显示空提示。

要贡献一个标签页，带 `id`、`order` 和本地化的 `label` 注册进 `settings.plugins.tab`；分区按序渲染条目，标签页在首次被选中时挂载。功能文案留在注册方自己的字典里。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

分区声明 `settings.plugins.tab`，一个根级 list slot，其标签成为有序的标签页；只有一个贡献时直接渲染为页面本身，标签页在首次被选中后保持挂载，搜索词和清单快照因此在切换间不丢失。分区的 `inject` 把 slot 账本投影成按序排列、标签随当前语言的行，在账本版本或语言修订变化前保持缓存。宿主半侧是一个空的 `apply`，只为让本包占一条 Loader 行，客户端模块系统据此送出浏览器半侧。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-settings-plugin-inventory](../ui-settings-plugin-inventory/README.zh.md)——只读清单标签页。
- [ui-settings](../ui-settings/README.zh.md)——声明 `settings.section` 的领域基座。
- [ui-plugin-manager](../ui-plugin-manager/README.zh.md)——配置官方插件的插件页。
- [ui-settings-shell](../ui-settings-shell/README.zh.md)、[ui-settings-agent-loop](../ui-settings-agent-loop/README.zh.md)、[ui-settings-subagent](../ui-settings-subagent/README.zh.md)、[ui-settings-web-search](../ui-settings-web-search/README.zh.md)——官方配置页，每个一个伴生包。

-----

<a id="model-experience"></a>
## 模型体验

无，本包是浏览器侧的设置界面，不注册任何模型面。

#### KV 缓存影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **分区没有自己的标签页**——在功能插件注册标签页之前它只显示空提示；壳自己填不满分区。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
