# Moklu Commercial Release Checklist (v1.0 GA)

> 这是一份工作清单，不是“当前版本已经达标”的证明。链接实际 CI、人工检查、审计材料后才能勾选。  
> 路线图：[development-plan](./development-plan.md) · 基准：[benchmark-plan](./benchmark-plan.md)

## A. 用户核心路径（P0）
- [ ] 新建项目、Quick Design、上传/拖入 PNG/JPEG/WebP、Cover/Contain/Fill 和 Story 输出正常
- [ ] Template Layout / Style Only / 局部样式应用不丢失用户应保留的内容
- [ ] 替换主截图、改变 Canvas Size、撤销/重做、刷新/恢复项目均一致
- [ ] Browser Chrome/Safari/Minimal 与手机外框全部可见、裁切正确
- [ ] PNG 原始尺寸、透明度、裁切、选区和网格 100% 正确
- [ ] 多页/多语言/多格式、ZIP/CLI 导出与目标命名经过 E2E 验证

## B. 安全、隐私、许可（P0）
- [ ] Project/Template/ZIP 不可信导入有 Schema、边界检查与原项目回滚机制（v0.9 已初步加入 JSON 限额、补偿回滚；ZIP 尚未实现，存储故障需继续审计）
- [ ] SVG/XML/URL/HTML 注入测试通过，没有意外跨域上传或私自遥测
- [ ] HTTPS、安全响应头与 CSP 配置完成
- [ ] 第三方依赖安全审计和处理记录存在
- [ ] PixelDeck MIT 声明、设备外框素材与模板/字体等第三方授权逐一核对
- [ ] Moklu 品牌、域名、相关商标风险经过适当审查
- [ ] 对外的隐私说明、免责声明、支持渠道与使用条款明确

## C. 性能、体验和发布（P0/P1）
- [ ] 标准数据集、测试机配置、脚本、SHA 和 Golden 文件可复现
- [ ] 性能基线有至少一次实际测量；偏离预算时有记录和决策
- [ ] Chrome、Safari、Firefox、Edge 关键流程通过浏览器验收
- [ ] 关键流程的键盘使用、焦点和错误可访问性达到约定标准
- [ ] 文档/帮助内容、错误消息、Logo、标题均为 Moklu 品牌
- [ ] Coolify 静态部署、HTTPS、缓存、回滚、备份演练通过
- [ ] 自托管 GitHub Runner 隔离与权限审计通过
- [ ] RC 标签、Changelog、版本号、Release Notes 和复现步骤齐备
- [ ] 0 个已知 P0 阻塞缺陷，P1 问题经过维护者审查并明确后续处理

## D. RC 验收记录模板

| 字段 | 内容 |
| --- | --- |
| Candidate | `v1.0.0-rc.X` |
| Git SHA | 待填写 |
| CI / E2E | 待附链接 |
| Core Benchmarks | 待附运行日志 |
| Visual Golden | 待附浏览器/OS + 数据集 |
| 许可与安全审计 | 待附结论 |
| 阻断问题及负责人 | 待填写 |
| 审批日期和签署人 | 待填写 |

正式发布须由维护者依据证据显式确认，不能因为自动化绿灯而自动宣布商用就绪。
