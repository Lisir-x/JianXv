# 笺序

<img src="assets/icon.svg" alt="笺序图标：叠放的纸笺与细羽笔" width="96">

笺序是一款面向 Windows 的离线个人待办与提醒应用。学习事项按分类归档，游戏活动按游戏管理；通过首页和日历快速了解接下来要做什么。无需注册账号，业务数据保存在本机。

## 可以做什么

| 模块 | 能力 |
| --- | --- |
| 首页 | 查看学习与游戏各自最近待办、子模块概览、完成率和超期事项。 |
| 学习 | 按分类记录作业、实验、考试等事项，设置结束时间和提醒，支持编辑、迁移、完成和撤销。 |
| 游戏 | 管理多个游戏及其版本，记录普通和周期活动；在单游戏或多游戏日历里查看活动时间。周期活动到期会进入下一期，日历中的未来期次仅供预览。 |
| 提醒 | 查看应用内提醒记录；应用在前台或托盘运行时可提交 Windows 系统通知，点击提醒可打开对应内容。 |
| 设置 | 管理系统通知、开机自启和本地数据位置，支持备份、恢复和清空业务数据。 |

## 安装和使用

1. 在 Windows x64 电脑上运行 `笺序 Setup.exe`。如果手头只有源码，可按下文的[打包步骤](#打包-windows-安装包)生成安装包。
2. 在安装向导中选择位置。例如选择 `E:\` 后，路径会显示为 `E:\笺序`。可分别勾选「创建桌面快捷方式」和「添加到开始菜单」。
3. 打开笺序，从首页的「新增」开始记录。未创建快捷方式时，可直接运行安装目录里的 `笺序.exe`。首次运行会创建作业、实验、考试三个学习分类，游戏列表默认留空，可按需添加。

关窗后应用仍在系统托盘运行。要彻底退出，可使用左侧导航底部或托盘菜单的「退出应用」。退出或关机期间不会弹出提醒；重新启动时，仍有效的错过提醒会补记在应用内。Windows 横幅和声音以系统通知设置为准。

也可以直接运行解包版 `win-unpacked/笺序.exe`，请保留该目录中的依赖文件。验证安装向导、快捷方式和通知注册时，请使用安装包。

## 数据与备份

- 默认数据库是程序所在目录下的 `data/app.sqlite`。在「设置 → 数据与备份」可以查看实际路径，或将数据迁移到另一个空目录；旧位置的数据副本会保留。
- 使用「导出备份」可生成独立的 SQLite 备份。导入会先验证备份、自动保护当前数据，再由你确认覆盖。自动保护备份位于数据库旁的 `backups/`；导入不会改变本机的数据目录。
- 覆盖更新会保留业务数据。主动卸载会清理应用管理的数据和缓存；如要保留数据，请先把备份导出到应用数据目录之外。

## 本地开发

开发和打包使用 Windows x64、Node.js 24 和 npm。本仓库的验证环境为 Node.js `24.16.0`、npm `11.13.0`；具体依赖以 `package-lock.json` 为准。首次安装依赖可能需要联网，应用运行时不依赖网络。

在仓库根目录执行：

```powershell
npm ci
npm run dev
```

开发版会在项目目录生成本地数据。请勿把数据库、运行配置、备份或打包产物提交到 Git。

| 目录 | 用途 |
| --- | --- |
| [`src/main/`](./src/main/) | Electron 主进程，负责 SQLite、托盘、系统提醒和备份恢复。 |
| [`src/preload/`](./src/preload/) | 向界面提供受限的 IPC 接口。 |
| [`src/renderer/`](./src/renderer/) | 使用 React、TypeScript 和 CSS 实现页面、表单、日历及纸笺主题。 |
| [`src/shared/`](./src/shared/) | 共享类型、业务校验、时间及周期计算。 |
| [`assets/`](./assets/) | 应用图标和托盘图标。 |
| [`scripts/`](./scripts/) | Windows 打包、NSIS 安装向导和系统通知辅助脚本。 |
| [`tests/`](./tests/) | Vitest 单元测试、Playwright 桌面测试及 NSIS 路径测试。 |

界面通过 Electron Vite 构建，应用数据由主进程通过 `better-sqlite3` 管理。字体随应用离线打包，相关许可见 [Noto Serif SC 字体许可](./src/renderer/fonts/OFL-NotoSerifSC.txt)。

## 测试

```powershell
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint
npm test             # Vitest 单元测试
npm run test:e2e     # 构建后运行 Playwright 桌面测试
```

要覆盖打包版场景，先执行 `npm run pack` 再运行端到端测试。桌面测试使用隔离的数据目录。NSIS 路径测试位于 [`tests/installer/directory.nsi`](./tests/installer/directory.nsi)，可按文件开头的说明编译并运行。

## 打包 Windows 安装包

```powershell
npm run build       # 编译到 out/
npm run pack        # 生成解包版
npm run dist:win    # 生成 NSIS 安装包及解包版
```

交付路径固定为 `release/笺序 Setup.exe` 和 `release/win-unpacked/笺序.exe`。`release/` 是本地构建产物目录，不随源码提交。重新打包前请从托盘彻底退出解包版；打包脚本会暂存并恢复已有 `data/` 和 `location.json`，安装包不带入现有个人数据。

产品需求及验收标准见 [PRD.md](./PRD.md)，当前验收状态、测试记录与交付约定见 [开发计划.md](./开发计划.md)。
