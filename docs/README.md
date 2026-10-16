# Moklu Engineering Docs / 工程文档

This folder **extends** the existing in-app guides under [help/](./help/) rather than replacing them.

| File | Purpose |
| --- | --- |
| [development-plan.md](./development-plan.md) | 从 v0.1 到 v1.0 正式商用的阶段路线、范围、质量关卡和维护约定 |
| [benchmark-plan.md](./benchmark-plan.md) | 测量方法、性能预算（暂定）、导出质量、安全、浏览器兼容性、数据与 CI 策略 |
| [release-checklist.md](./release-checklist.md) | 持续更新的 RC/GA 发布前验收清单 |
| [help/](./help/) | 编辑器功能操作指南（沿用已有文档） |

## 文档状态

- **主干稳定功能**：v0.1–v0.8，见阶段表；“完成”仅指该阶段的代码、自动检查及既有用户验收，不代表已经通过商用发布审计。
- **开发中**：v0.9 项目和模板 JSON 导入安全、数据恢复与兼容性验证（目前在 PR 分支，尚未合并）。
- **计划**：v0.10–v1.0 的优先级、目标和阈值均可通过 PR 调整。

本文档包含目标值，不代表真实测量结果。性能基线必须保存测试环境、提交 SHA、样本与统计结果后才算有效。

每次里程碑 PR 应同步更新状态、质量结论及变更原因；避免重复维护 README 中过期的短期路线。
