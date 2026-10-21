# Mochi 私人二改维护指南

## 源码和上传目录

- 编辑主目录：`C:\Users\Teresa\Desktop\mochi2`。
- GitHub Desktop 仓库目录：`D:\Github\Mochi2_041814.github.io`。上传前在 Desktop 中通过 Repository → Show in Explorer 确认，以实际打开的位置为准。
- 当前远程仓库：`Crow828/Mochi2_041814.github.io`。
- GitHub 稳定基线：`test 3.2`，提交 `b485ade`。

`src/` 是日常修改入口。根目录 `index.html`、`js/`、`sw.js`、`version.json` 由构建生成；直接改它们，下次构建会被覆盖。不要把源码放在仓库里的额外 mochi2 子文件夹中。

## 现在的模块分工

| 文件 | 用途 |
|---|---|
| `src/js/feature-policy-config.js` | 功能开关及关联入口、概率、数据管理显示配置；优先在这里修改 |
| `src/js/feature-policy.js` | 读取配置并提供统一查询接口，处理静态入口和停用页面 |
| `src/js/feature-data-catalog.js` | 功能数据分类、存储键匹配、作用域和页面挂载点 |
| `src/js/feature-data.js` | 计数、分类归属、导出、导入、清空、确认和数据管理页面 |
| `src/template.html` | 静态页面结构、设置行和部分桌面图标 |
| `src/css/base.css` | 基础样式，包含目前验证正常的 iPhone 顶部适配 |
| `src/js/p2-features.js` | 同频、伸手、喝水、番茄钟等旧功能的运行逻辑和动态入口 |
| `src/js/default-cards.js` | 字卡概率与对应设置控件 |
| `src/js/chat.js` | 聊天核心；仍是原有大型模块，未在本轮全面拆解 |
| `src/js/data-backup.js` | 整体备份和恢复，与单功能管理分别处理 |
| `build.mjs` | 文件组装、加载顺序和原有构建检查 |
| `tools/verify-personal.cjs` | 私人二改行为验证，使用独立浏览器数据，不操作日常浏览器资料 |
| `tools/verify-release.cjs` | 顺序执行构建和私人浏览器验证，遇到失败立即退出 |

依赖顺序：配置 → 开关接口 → 各功能；数据分类表 → 数据管理引擎。此顺序由 build.mjs 登记。新增源文件需要登记后重新构建；仅放进 src/js 不会自动发布。

## 如何调整功能

例如需要研究恢复喝水时，先备份，再在 feature-policy-config.js 找 `water`：

- `enabled` 控制功能是否启用。
- `probability`：`disabled` 停用并显示破折号；`editable` 可修改；`locked` 保持运行和原值，控件显示破折号。
- `desktop: false` 隐藏桌面入口。
- `dataManagement: false` 隐藏单功能数据管理入口。
- `settings` 列出跟随功能状态的设置行 ID。
- `dataId` 将配置键映射到分类表 ID，例如 sync 对应 tongpin。

字段省略不一定代表隐藏。未登记的功能默认沿用原网站行为。修改开关需要重新构建和重新加载页面。

目前存钱罐：enabled=true、probability=locked、desktop=false、dataManagement=false。经期和备忘录启用；可选桌面卡片不默认显示。独立的“一起使用”天数继续使用原 fish-log 数据，不随摸鱼积分功能停用而删除。

统一开关覆盖的是本轮已接入的入口和运行路径，不是整个旧代码的自动插件系统。恢复整个旧功能前，还要检查其页面、提醒、聊天触发和联系人切换，不能仅凭图标出现就认定全部可用。当前浏览器测试额外验证喝水的入口/概率/数据分类，以及此间和摸鱼的关联设置恢复。

## 数据兼容原则

不要随意重命名 `xy-home-v2`、联系人命名空间、原存储键及 catalog 中的正则。分类顺序属于数据归属规则的一部分：第一个匹配项拥有该键。音乐等公共数据可能锚在 default 联系人命名空间，不能一律改成根命名空间。

隐藏数据管理行不会删除已有数据。整体备份仍保留原有数据。媒体池和字体包是共享资源，不能因清空单个功能而顺带删除。操作日常数据前先从网站导出备份；不要用清除浏览器站点数据来刷新代码缓存。

## 修改后怎么验证

首次准备依赖：在项目目录运行 `npm ci`，然后 `npx playwright install chromium`。需要本机已安装 Node.js。安装浏览器会占空间，若已有 Chrome/Edge，私人验证脚本会优先使用已安装的浏览器。

日常改动后，在项目目录运行：

```text
npm run verify:release
```

该命令先构建，再运行私人行为验证，包含两种手机宽度、数据分类、联系人隔离、共享媒体排除、功能开关联动。它不是全部原项目回归。原有 `verify`、`verify:webkit`、`verify:device`、`verify:all` 命令及 GitHub Actions 保留。

也可直接运行 `node tools/verify-release.cjs`，作用相同。本次 Codex 自带运行环境没有提供 npm 命令，本地验证使用直接运行方式，并通过 NODE_PATH 使用现有 Playwright 依赖；普通电脑需先安装依赖，不能把“找不到 npm / playwright”当成网站功能损坏。

浏览器验证不能替代 iPhone 真机检查。上传后重点检查桌面、聊天发送/接收、经期、备忘录、数据管理和主屏幕模式顶部位置。不要因为看到旧界面就删除用户数据；先排查页面/Service Worker 更新是否生效。

## 上传和回溯

1. 备份日常网站数据，保留上一版源码。
2. 修改 src 并运行 verify:release。
3. GitHub Desktop 如提示 Pull origin，先同步远端（例如线上 README 的修改）。
4. 将已构建内容或本次更新包内部的文件复制到 Show in Explorer 打开的仓库目录，合并并替换同名文件，不删除仓库其他文件，不复制 node_modules、个人数据备份和 .git。
5. Changes 中核对文件。Summary 建议 `test3.5`，表示本次包含第三至第五阶段；这只是建议提交名，尚未提交。
6. Commit to main → Push origin，然后检查 Actions 和 Pages 部署。

回退优先按 Git 提交恢复源码，再重新构建；源代码回退不会自动恢复被清空的浏览器数据。README 和 LICENSE 保留署名与来源，本轮维护指南另存 docs，不覆盖它们。

## 本轮范围与验证限制

第三阶段：设置入口、数据管理显示接入集中配置。第四阶段：拆开配置/执行和分类表/引擎，保持数据规则等价。第五阶段：建立本维护说明和统一的本地构建验证命令。

这是一轮针对当前私人版本的结构整理，不是全站重写。聊天、个性化和原构建脚本仍有较大文件；未来可按实际修改需求逐项拆分。本轮尚未上传 GitHub；原有完整回归套件和 iPhone 真机测试需在后续发布流程确认。
