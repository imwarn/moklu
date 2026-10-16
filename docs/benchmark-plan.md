# Moklu Benchmark Plan：性能、正确性、兼容性与安全

> 版本：Draft / Proposed baseline · 2026-10-15  
> 对应：[development-plan](./development-plan.md) · [release-checklist](./release-checklist.md)

## 1. 测试原则

**目前没有经过可复现校准的“官方性能成绩”**。本文件中的毫秒、内存和误差限属于拟定目标，只有实际跑完测试、保存环境和输出，才可提升为 release gate。

区分两层：

1. **Microbench (Node/CPU)**：纯函数性能回归（画布几何、模板迁移、预览 SVG 等），已配 `npm run bench:core`，不等于浏览器渲染耗时。
2. **E2E/Visual (浏览器/真实画布)**：上传解码、帧显示、用户操作、PNG 导出、像素对比、IndexedDB 持久化、跨浏览器兼容；后续用 Playwright/受控浏览器环境建设。这里才是发布性能的主依据。

两台 Coolify Runner 可用于质量门和 Microbench，但共享机器噪声、CPU 限流或并发会影响结果；应记录机器与负载，同一机型单独比较，不要直接把两台不同主机的绝对值合并。

## 2. 如何运行 / 保存结果

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build

# 浏览器 PNG QA：Chromium / Firefox / WebKit (Linux)
npx playwright install --with-deps chromium firefox webkit
npm run test:browser

# 手动执行：仅统计核心同步函数，不会设定 CI 硬性性能阈值
npm run bench:core
```

GitHub Actions 增加单独的 **Core Benchmarks** 手动 workflow（`workflow_dispatch`），只在 `main` 分支接受触发；运行在 `[self-hosted, Linux, X64, coolify]`，上传 `benchmark-environment.txt` 与 `benchmark-results.txt` 保存 30 天。不要直接把 Benchmark 加入每一次 PR 的硬性门槛。

每次记录以下元数据：`git SHA`、Node 版本、浏览器版本、CPU、内存、OS、Runner 名、并发任务数、时间、测试资源版本、冷/热缓存、样本量、p50/p95（E2E）与原始日志。若在 GUI 机器测试，增加屏幕分辨率、设备像素比 (DPR) 和硬件加速状态。

### 拟定测试等级

| 级别 | 场景 | 频率 |
| --- | --- | --- |
| PR unit | 数据模型、模板槽、Canvas Resize、SVG 安全、PNG 边框隐藏 | 每 PR 强制 |
| Manual Core Benchmarks | 生成 49 层画布、外框 SVG、模板应用、预览坐标 | 每里程碑/性能回退调查 |
| Browser smoke | 上传 → 选择 → 实时预览 → 应用 → 导出、刷新/恢复 | v0.10 后每 PR |
| Visual regression | 指定字体与浏览器的图像 Golden Test，对比 PNG 内容/透明度 | v0.10 后每 Release Candidate |
| Perf E2E | 从用户操作到绘制完成、导出延迟、内存稳定性 | 每 RC + 关键渲染变更 |
| Security/accessibility | 不可信模板/图片/ZIP、CSP、键盘交互/可读性 | 每 RC；高风险改动即时执行 |

## 3. 测量环境与样本

**建议固定两套有代表性的设备**（不是现有跑分数据）：

- **Reference desktop**：Apple Silicon 中档笔记本，16 GB+ 内存，Chrome 最新稳定版与 Safari 最新稳定版。
- **Constrained desktop**：4–8 核中档 x86、8 GB RAM、Chrome/Edge/Firefox，浏览器资源和 GPU 能力按测试报告记录。
- CI 构建环境：Ubuntu/Linux x64 + Node 22，自托管 Runner；用于静态质量门和可比较 CPU 微基准。

**标准数据集**必须在仓库版本化、尽量使用原创合成图片，避免真实用户数据：

| 数据集 ID | 数据 | 用途 |
| --- | --- | --- |
| DS-01 | 1600×900 PNG，2–6 MB | Browser Mockup 默认成功路径 |
| DS-02 | 1080×1920 PNG，2–6 MB | 手机和 9:16 Story，裁切/留边 |
| DS-03 | 1920×1080 JPEG/WebP，2–6 MB | 解码和格式兼容 |
| DS-04 | 3840×2160 PNG，8–20 MB | 大图导出与内存压力 |
| DS-05 | 透明 PNG + 单色棋盘纹理 | Alpha、抗锯齿及透明边缘 |
| DS-06 | 50 图层，至少 5 个分组、3 种文字、10 张图 | 画布与模板压力测试 |
| DS-07 | 20 张画布、4 种格式、2 种语言 | 批量导出和命名检查 |
| DS-08 | 损坏 JSON、特大尺寸、恶意 SVG/URL/ZIP、重复资源 ID | 安全与恢复 |
| DS-09 | 含中文、emoji、阿拉伯文及特殊标点的文字 | 字体、换行与 SVG 转义 |

创建生成脚本和数据集时，优先用固定 seed、可再生成的合成图；测试原图与输出图配 SHA256 和合法性说明。

## 4. 性能预算（**建议值；尚未验证**）

所有交互/导出指标，在基准机空闲、关闭调试工具、正式构建模式下测量；冷启动和热态分开。E2E **30 次以上采样**，丢弃 5 次预热并报告 p50/p95，报告包含失败次数。

| 指标 | 拟定验收目标 | 测量定义 |
| --- | --- | --- |
| 应用首屏可交互 | p75 ≤ 3 s | 桌面中档设备，冷加载、静态文件缓存策略已注明 |
| Quick Design 开弹窗 | p95 ≤ 250 ms | 点击至弹窗内容可操作 |
| 背景/尺寸/Mockup 预览反馈 | p95 ≤ 200 ms | 选项改变至下一帧可见，计入图片 SVG 绘制 |
| DS-01 本地截图解码并可预览 | p95 ≤ 2 s | 选择/拖放到缩略图可见 |
| DS-01 PNG (1600×900) | p95 ≤ 3 s | 点击导出到 DataURL/Blob 完成，不计浏览器保存对话框 |
| DS-04 PNG (3840×2160) | p95 ≤ 8 s | 和上面相同定义，单画布 |
| DS-06 50 图层操作 | p95 ≤ 250 ms | 模板 Style Only 或画布比例更新到渲染稳定 |
| 持续操作内存 | 10 分钟后净增 ≤ 20% | 刷新基准后反复切换模板/导出；记录 JS heap 与进程内存 |
| CPU 微基准回退 | 同机同环境中位数下降 > 20% 时调查 | 不因小幅差异或首次结果直接阻止合并 |

这些数值为**立项初版预算**，可在首次实测时做合理调整，特别是 4K PNG、Safari 和小内存设备。若真实指标与预算不符，创建 Issue、说明根因与成本，再决定发布阻断等级。

## 5. 正确性与视觉标准（主要是 P0）

- **导出分辨率**：PNG 文件头解析出来的宽高必须与指定 canvas/format **完全相同**（0px 容忍）。
- **选区与网格**：任何导出路径下均不得出现 Transformer 边框、拖拽锚点或编辑网格（0 次）。
- **截图持久性**：模板 Layout、Style Only、局部 Style、Canvas Size 和 Replace Screenshot 不得静默丢失不该替换的用户图像。
- **裁切/留边/拉伸**：Cover、Contain、Fill 与同一份截图输入在预览与 Konva 输出中语义一致；Contain 保留原图全部主体、Cover 可以按比例裁切，Fill 可拉伸。测试横图/竖图/透明图。
- **alpha**：真正输出透明像素，不得把“棋盘格”烘焙进 RGB；测试边缘白边/雾边。
- **导出结束后编辑状态**：选中对象、缩放、网格显示状态、历史 Undo/Redo 均与导出前一致。
- **跨格式/语言**：App Store / Play Store / 独立画布互不串数据；CLI 与交互式导出默认目标一致并完整。
- **可靠性**：刷新后项目数据、图片 ID、模板 slot、浏览器地址栏内容应正确恢复；导入损坏数据不修改既有项目。

### 建议的视觉对比方法

对确定性合成素材建立经人工确认的 Golden PNG：像素尺寸和透明度必须严格；文字抗锯齿和不同浏览器 rasterizer 会引入细微差异，建议按浏览器/OS 固定金图。初步可用“每通道绝对误差 ≤ 12/255 且超过阈值的像素比例 ≤ 2%”作为 **试验性阈值**，正式采用前须校准并对用户可见的裁切错误保持零容忍。

不能仅凭一张相似截图断言“像素正确”，尤其是透明边界、图片裁切和浏览器字体。

## 6. 安全、数据与隐私验证

- 图片：PNG/JPEG/WebP 允许列表、大小限制，解码失败提示；拒绝 SVG/HTML 作为 screenshot 上传。
- Template/Project：Schema、版本迁移、资产引用、递归深度、恶意超长文本与重复 ID；导入前验证且失败可回滚。
- ZIP：目录穿越、压缩炸弹、单文件/总展开量限制，拒绝意外可执行内容；不自动运行任何解包后代码。
- SVG 浏览器文字：`<script>`、引号、控制符和 Unicode 边界测试，绝不通过 URL 展示字段发起请求。
- 数据行为：默认本地处理；验证首次访问、操作/导出时没有意外的图片数据上报（排除静态资源与明确启用的服务）。
- 安全头：CSP、HTTPS、跨源加载策略、第三方依赖漏洞扫描与更新窗口。
- Runner：Fork 来源 PR 禁止自托管执行；权限最小化、凭证隔离、主机清理与执行并发控制。

## 7. 无障碍与浏览器兼容性矩阵

| 平台 | 必测路径 |
| --- | --- |
| Chrome 最新稳定版（macOS/Windows/Linux） | 全部核心路径、主基准 |
| Safari 最新稳定版（macOS） | SVG frame、图片解码、数据恢复、PNG |
| Firefox 最新稳定版（Windows/Linux） | 上传与导出、文字渲染和图层操作 |
| Edge 最新稳定版（Windows） | 核心路径与图片导出 |
| 窄桌面/平板视口 | Quick Design 滚动、重要控制可见、避免遮挡 |

采用 WCAG 2.2 AA 作为基础目标：所有核心步骤可以通过键盘导航、按钮可读、焦点可见、错误有文本描述；画布直接拖拽类操作提供可替代的数字属性编辑入口。具体差异记录 Issue，不以“自动化扫描 0 个问题”替代手动可用性验证。

## 8. 发布阻断规则

**Blocker / P0**：用户素材丢失、选区污染 PNG、恶意输入执行代码、导出文件损坏、关键浏览器核心路径失败、必须保留的许可缺失。

**P1**：主要交互无法用键盘操作、严重的浏览器视觉偏差、持续性能明显回退、可恢复但误导用户的损坏数据提示。

**P2**：非关键装饰偏差、少量动画性能问题、非核心选项体验。

正式 v1.0 GA 不允许有已知 P0 缺陷；P1 需要明确风险处置和用户可接受的修复时间。对产品尚未提供的云协作/AI/3D 不做 v1.0 的合格项。

## 9. 首次基线执行 TODO

- [x] 核心 Node 微基准入口已加入代码（本迭代 PR）；结果尚未归档
- [ ] 在 `main` 上手动运行一次 **Core Benchmarks** workflow，保存日志和 SHA
- [ ] 生成并提交 DS-01~09 合成测试集（不包含任何用户上传数据）
- [ ] 建立 Playwright GUI E2E 与 Golden PNG，覆盖三个 screenshot-fit 模式
- [ ] 校准 reference/constrained 两组设备的基准和图片精度误差
- [ ] 为导出、导入、数据恢复、无障碍建立带证据的 GA release gate

## 10. v0.10 可执行浏览器导出基准（合成 Golden）

`tests/fixtures/export-harness.html` 以真实 Konva Stage 生成 240×240 PNG：指定两个纯色矩形，其他位置透明；对每个解码后的 RGBA 像素逐一比对期望矩阵（必须 0 个差异、48,800 个透明像素、0 个洋红色 overlay 像素）。采集前人为设置非 1 倍缩放和 stage offset；采集后检查选择辅助层可见性、位移和缩放均恢复。

`tests/e2e/export.browser.spec.mjs` 还覆盖编码器抛异常、损坏文件头、随后重试成功，及真实应用 Quick Design 上传与导出（16:9 及 Chromium 9:16）。矩形基准是确定性像素级 Golden，**不代表**复杂字体、阴影和浏览器 mockup 全量视觉回归已经签收。实际 macOS Safari 必须独立执行。

Playwright 每 PR 在单独的 `browser-export` CI job 执行；安装浏览器依赖可能要求自托管容器具有 apt 权限。失败 trace 存储 7 日用于定位。记下 Actions SHA、各 browser version 和运行结论后，再确定是否扩大为所有样本的发布门槛。

版本化二进制 Golden：`tests/goldens/konva-rect-240x240.png` 是原创生成的透明 RGBA PNG；浏览器测试对已解码结果同时执行固定矩形语义断言、与该独立文件逐像素比较。Golden 的字节编码本身可能随压缩器不同，但像素值必须一致；更新 Golden 时必须有图像审核理由。
