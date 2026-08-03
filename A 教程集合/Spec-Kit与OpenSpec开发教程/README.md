# Spec Kit 与 OpenSpec 开发教程

本目录面向两类任务：从需求到实现的规格驱动开发，以及已上线 Spec Kit 项目的增量迭代。

## 阅读顺序

1. [Spec Kit 使用场景与实战教程](./01-Spec-Kit使用场景与实战教程.md)
2. [OpenSpec 使用场景与实战教程](./02-OpenSpec使用场景与实战教程.md)
3. [已上线 Spec Kit 项目的增量迭代教程](./03-已上线Spec-Kit项目的增量迭代教程.md)
4. [项目资料整理与交付清单](./04-项目资料整理与交付清单.md)
5. [Flow-Forward 专题教程 PRD](./05-Flow-Forward专题教程-PRD.md)
6. [Spec Kit Flow-Forward 增量开发实战教程](./06-Spec-Kit-Flow-Forward增量开发实战教程.md)

需求范围和成功标准见 [PRD](./00-PRD.md)。

## 给怡哥当前项目的建议

先继续使用现有 Spec Kit 资产，默认采用 flow-forward：已上线 feature 作为历史记录保留，每个可独立验收的新需求或行为调整创建新的 feature spec。整理好源码、完整 Spec Kit 产物和本次需求后，再基于真实证据决定是否存在 living spec 或 OpenSpec 试点的必要。

其中，“新建 feature”首先是创建新的 `specs/<编号>-<短名称>/` 规格目录，不等同于 Git 分支；但在实际交付中，建议一个 feature 对应一个独立分支。是否由 `/speckit.specify` 自动建分支，取决于项目是否启用了 Spec Kit Git 扩展，详见第 6 篇专题教程。
