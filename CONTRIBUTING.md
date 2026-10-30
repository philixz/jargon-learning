# 如何参与完善

问题描述请说明具体术语、专题或操作，写清预期和实际结果。截图删除账号、联系方式、Key 和真实业务数据。

## 新来源与规范词条

来源登记在 `content/sources.json`，包括版本、读取日期、署名和公开使用条件。原始快照、比对报告及人工决定放在被 Git 排除的 `.local/content-sources/`；不能把访问权限当作转载许可。

规范词条编辑 `content/terms.json`。每条记录保留稳定 ID、语境、别名、定义、通俗解释、自拟例子、反例、来源定位和校对状态。真正同义表达才进入 aliases，上位概念、组成部分或相关任务不能只为搜索方便而当作别名。

新增来源只产生候选，不能自动覆盖规范定义。新内容先用 pending，冲突用 conflict；复核完成后设 approved，写明 evidence、note 和原创表述的 rights。证据必须对应已登记、可公开引用的核查来源。未知授权的原文只能留在本地；可以基于一手文档另写事实解释。

现有未重审记录保留为 legacy。baseline 是发布历史回退快照，不可直接修改；修订应写规范字段。保留旧编号和不同语境，不因来源失效删除内容。未核查新词不导出；未核查修订回退到旧发布文本，且标记存量待复核，不假装全库已审核。

## 专题与练习

专题编辑 `content/topics.json`。先说明学习问题，再选已校对概念；新专题最多三组、每组最多三节点，补贯穿案例和场景复习题。节点 plain、example、counter 须与规范词条一致；延伸概念用 supportingTerms 引用，不一次铺开。

关系须有类型、解释及参考依据，区分区别、范围、组成、配合与学习关联。不为连线而编造依赖，例子不冒充课堂原话或真实业务记录。保留旧专题及节点 ID。

练习继续在 `public/jargon/data.json` 维护，保留 16 个练习编号。授权沿用根目录协议及第三方说明。

## 生成与验收

不要直接修改生成的词表和专题 JSON。编辑规范库后运行：

```sh
python scripts/content_pipeline.py export
python scripts/content_pipeline.py validate
python -m unittest discover -s tests -v
python tests/check_project.py
```

export 生成兼容现有前端的数据并同步数量；validate 只检查、不写文件。新来源适配和详细步骤见 [内容维护流程](docs/content-workflow.md)。

浏览器检查别名搜索、旧深链接、主题目录、缩放、节点详情、参考要点和草稿保存。继续使用原生 JavaScript 与 Python 标准库，不引入账号后台，不调用真实模型测试。

本轮只做本地预览。明确收到发布要求后才推送 GitHub；推送 main 会触发 Pages。原始资料、人工台账、反馈和配置不随发布。
