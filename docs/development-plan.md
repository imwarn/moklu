# Moklu Development Plan：v0.1 → 正式商用 v1.0

> 状态：Living document · 初版 2026-10-15 · Owner: Moklu maintainers  
> 参考：[基准测试方案](./benchmark-plan.md) · [正式发布核对表](./release-checklist.md) · [用户指南](./help/)

## 1. 产品目标与边界

**Moklu = Beautiful mockups, made simple.** 用户最短路径是 **上传截图 → 选 Browser/Device → 选画布与背景 → 即时预览 → 导出**；有更高需求时可进入完整的多图层编辑器。

核心主张：

1. **Screenshot-first**：不强制学习编辑器、导入多页 App Store 项目才能美化一张图。
2. **Truly editable**：画布、外框、背景、文字与截图始终保持结构化；不通过“烘焙效果图”冒充模板。
3. **Privacy by default**：默认浏览器本地处理、无账号和服务器上传依赖；涉及 AI/远程服务时必须清晰提示并由用户主动开启。
4. **Open source**：保留 PixelDeck 的 MIT 版权声明与许可；对外框素材、第三方素材分别核对使用权。
5. **Expandable**：单画布快速模式和进阶多画布/多语言/多格式功能共用底层资产、渲染和导出机制。

**v1.0 必须做到**：作为可公开部署、可对外收费提供服务或供团队生产使用的稳定基础版，完成明确的许可证审计、安全/数据可靠性门槛、基本无障碍和发布运维准备。

**v1.0 不要求**：云端账号、多人协作、订阅计费、AI 绘图、3D 透视、视频导出。它们属于可选商业扩展；不要为争取“功能全面”阻塞基础产品发布。

## 2. 已完成与进行中（以 GitHub 合并及实际验收为准）

| 版本 | 状态 | 主要交付与验证 |
| --- | --- | --- |
| v0.1 | ✅ main | PixelDeck 编辑器迁移与 MIT 归属、Mockup Registry、Browser 基础模型、Quick Design、画布尺寸和 PNG 导出；修复导出格式、旧品牌 Loading。 |
| v0.2 | ✅ main | 模板应用到当前画布、主截图占位映射、Replace Screenshot、唯一素材键；已验证更换模板时截图保留。 |
| v0.3 | ✅ main | **Style Only**：可保留所有内容、几何与图层，仅更新模板视觉效果。 |
| v0.4 | ✅ main | **Style Only 精选类别**：背景、外框效果、字体分别切换，保留未勾选属性。 |
| v0.5 | ✅ main | 浏览器标题、URL 展示文字、明暗风格及地址栏开关；修复浏览器遮挡截图、导出选区/网格污染。 |
| v0.6 | ✅ main | Quick Design 拖放/选择截图、缩略图、25 MB 文件校验、较小视口适配。 |
| v0.7 | ✅ main | 跟随画布/Mockup/背景/图片变化的预览；用户完成基本浏览器交互验收。 |
| v0.8 | ✅ main | 9:16 画布、Cover/Contain/Stretch 截图适配与预览一致性；可手动运行的性能微基准及工程规划文档。 |
| v0.9 | 🛠 开发 PR | 项目与模板 JSON 导入限额、恶意键/资源校验、暂存与失败补偿恢复；ZIP 导入及完整迁移审计留待后续。 |
| v0.10 | 🛠 开发 PR #11 | PNG 文件头尺寸校验、全景与单画布导出边界回归、浏览器真实 Canvas RGBA 基准、导出失败恢复、Quick Design 下载 E2E；CI / 跨浏览器实测以 Actions 结果为准。 |

**注意**：main 的版本号与 npm manifest 仍可能保持 `0.1.0`；以上为产品迭代阶段标识，不表示 npm 已发布对应版本、已有 Tag，或全部经过独立安全审计。下一阶段需规范版本、Tag 与 Changelog。

## 3. 从 v0.8 到 GA 的迭代规划

| 阶段 | 优先级 | 具体任务 | 验收门槛 |
| --- | --- | --- | --- |
| **v0.8 · Screenshot Framing & Baseline** | P0 | 9:16、Cover/Contain/Stretch；预览与真实导出语义对齐；基准命令和测试方案初版 | 选择的适配方式写入 `PhoneLayer.screenshotFit`；测试覆盖 3 种模式、竖屏；双 Runner CI 通过 |
| **v0.9 · Data Safety & Import Hardening** | P0 | Project/Template 版本化 Schema 验证、ZIP/JSON 限额、递归与图片数量限制、素材引用完整性、失败回滚；兼容旧项目 | 损坏、超大、恶意输入优雅报错；导入失败原项目保持原状；迁移前后内容一致 |
| **v0.10 · Export Fidelity** | P0 | Chrome/Safari/Firefox 的端到端实际 PNG 测试；尺寸、透明度、选区/网格排除、裁切、宽高比和缩放；批量/CLI 输出校验；错误反馈 | 测试矩阵全绿；指定分辨率像素精确；截图无编辑辅助层；失败可恢复 |
| **v0.11 · UX & Accessibility** | P0/P1 | Quick/Advanced 清晰入口、空状态和上传引导、模板搜索分类、快捷键与可发现性、响应式布局、基础键盘可用和无障碍标签 | 完成新手任务无须看文档；关键流程无阻塞性无障碍问题；核心移动/桌面布局无溢出 |
| **v0.12 · Release Engineering** | P0 | CI E2E、发布版安全头/CSP、依赖审计、许可与素材清单、版本/Tag/Changelog、静态部署配方、备份与故障恢复、性能基线归档 | 候选 Release 通过完整验证；部署/回滚与数据备份演练可复现 |
| **v1.0 RC → GA** | P0 | 端到端回归、体验试用、缺陷修复、法务/品牌材料审核、隐私/服务条款、商用部署可用性检查 | 满足 [release-checklist](./release-checklist.md) 的所有 P0 条目；无已知阻塞 Bug；由维护者显式批准正式发布 |

**调整原则**：阶段名称和编号为建议，不追求机械地每版发布；发现影响数据、授权、安全或导出正确性的 P0 问题，应直接插入修复版本，不推迟至原定阶段。无用户价值且维护成本高的功能可推后。

## 4. 技术架构演进建议

- **前端**：沿用 Vite + React + TypeScript + Zustand + Konva，不在 v1.0 前切换框架。
- **数据模型**：单画布与原有 SlideGroup、format 家族逐步解耦。优先向后兼容；通过 migration 升级存储结构，避免直接替换现有 IndexedDB key。
- **模板/素材**：显式 slot、独立 assets 命名空间、模板元信息、用户素材库、可编辑模板、失败时事务式写入。
- **预览/导出**：SVG 快速预览负责交互反馈，Konva/Playwright PNG 负责真实渲染；共用几何与适配规则。避免维护两套独立的设备尺寸。
- **安全**：用户的 SVG、HTML、URL、模板 JSON、ZIP 及外部资源一律按不可信处理。限制 DOM 注入、XML/SVG 注入、跨源抓取、路径穿越、压缩炸弹。
- **部署**：优先静态托管。Coolify 可部署构建产物并配置 HTTPS、缓存与安全响应头；没有必须自建数据库的理由前，不添加后端。
- **多用户/商业扩展**：若日后需要共享工作区、团队配额、计费、同步等，作为独立服务层建设；第一版用户端不得依赖云端才可编辑或导出。

## 5. 商用可行性与合规

开源代码的 **MIT** 许可一般允许商用，但不自动授予所有设备外框、字体、Logo、模板插画、第三方图像和商标的商业使用权。正式商用前必须：

- 核对上游 PixelDeck 和每个第三方包/设备 SVG/素材的许可证，保留必要声明；对来源不明素材自行重制或替换。
- 检查 **Moklu** 商标/域名冲突（包括在先 `moklu.com` 使用）；域名持有不等于商标授权。
- 发布清楚的隐私声明，明确默认本地处理、IndexedDB 持久化、可能选用的 AI/远程接口及数据行为；不要称为“端到端加密”除非实际实现。
- 明确自托管/在线版本的支持边界、免责声明、故障恢复流程及开源许可证。
- 避免浏览器/手机外框中未经授权的官方 Logo；设备外形设计与注册商标分别评估。

## 6. 质量门与开发工作流

**每一个功能 PR**：说明使用场景、兼容性、风险、回滚路径、相关测试与本地验证步骤；必要时带视觉样例。

现有默认 CI 在两台 `[self-hosted, Linux, X64, coolify]` Runner 上调度，执行 `npm ci`、`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`。不要把这五项通过误称为完整浏览器 E2E 或性能达标。

- 修改导出、模板、图片、数据持久化必须增加回归测试。
- 修改可视布局或交互必须有主流浏览器手工或自动化验收，关注截图保留和输出像素尺寸。
- 安全防线之外的第三方 Fork PR **不得在组织自托管 Runner 上执行不受信任的代码**。对 Runner 容器隔离、秘密变量和权限进行持续审计。
- 性能基准详见 [benchmark-plan.md](./benchmark-plan.md)；尚未校准的目标属于 **proposed**, 不作为当前发布通过事实。
- 合并新功能前确认质量门；正式 v1.0 前，建立独立 Release Candidate 和至少一次实机跨浏览器验收。

## 7. 规划变更机制

采用 **单一文档源**：当前阶段、下一步、发布门槛写在本文件，详细测量标准见 benchmark-plan，发布逐项核对见 release-checklist。

建议每个里程碑 PR 至少更新：

1. 版本状态（Planned / In progress / Merged / QA passed / Released）。
2. 功能范围增删和决策理由。
3. CI SHA、实机 QA 结果、性能基准报告的链接（如果有）。
4. 新发现的缺陷、商用阻塞风险与跟进 Issue。
5. 若调整性能预算，注明机器配置、前后数据及理由。

里程碑号可变，但不可将“计划指标”改写成“测量成绩”。商业版价格、销售渠道、账户体系等留待产品验证后决定。


### v0.10 implementation note (in progress)

- Added synchronous PNG signature/IHDR dimensions verification to single-canvas and panorama PNG export paths. Wrong-size PNGs are treated as export errors; this does not perform pixel-level visual comparison.
- Next steps: real-browser Playwright workflows (Chrome/Firefox/WebKit where available), export image/golden matrix, alpha and screenshot-fit parity, cancellation and format/locale restoration tests. Until complete, v0.10 is NOT accepted for release.

### v0.10 测试落地状态（仍非 GA 签收）

- `npm run test:browser`：Playwright Chromium、Firefox、WebKit（Linux）启动真实 Vite 应用，运行截图上传到 PNG 下载的 UI smoke，以及使用真实 Konva 渲染的 240×240 全图 RGBA Golden（透明像素、编辑辅助层、缩放恢复）。测试图均为确定性合成，无用户数据。
- 核心 Vitest 回归补充单画布 / 全景宽度检查、PNG 损坏时的选区恢复、最终恢复阶段异常后的 capture lock 释放。
- WebKit on Linux **不等于 macOS Safari 正式版**；Safari/Edge 实机 QA、不同设备 DPR、全格式/语言批量 PNG 深度检查、完整 DS-01~09 数据集和黄金图人工确认仍须按基准测试计划补齐。只有浏览器工作流在指定 SHA 上成功才可标注该范围“CI passed”。
