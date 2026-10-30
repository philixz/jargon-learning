# 持续合并与专题维护

你提供链接后，代理执行本流程。来源是待核对材料，词条是整理后的知识，专题是围绕学习问题的组合；三者分别维护。工具不调用模型，也不部署网站。

## 1. 登记与完整读取

在 `content/sources.json` 登记唯一 id、标题、URL、署名、公开使用条件、读取时间和版本。飞书表格另填 sheet_name；后续新增来源使用新的 id，不复用别人的增量状态。

已登记的飞书示例：

私有来源的访问地址不写入公开元数据：在 `.local/content-sources/<source-id>/source.local.json` 配置 `url` 字段。CLI 优先使用来源档案的公开 URL，没有公开地址时读取该本地配置；缺少地址就停止读取，保留最后成功快照。本地配置与原始材料均不提交 Git。

```sh
python scripts/content_pipeline.py fetch --source feishu-ai-product
```

命令通过飞书 CLI 查询工作表结构和物理行号，读取完整范围，并检查 complete、has_more、truncated、表头与行列坐标。遇到登录、权限、缺页或结构不符即失败；保留上次成功快照与状态，不清空规范词库。

快照保存在 `.local/content-sources/<source-id>/`，按内容指纹存档。fetch 同时做增量比对。重读已有文件时：

```sh
python scripts/content_pipeline.py ingest --source feishu-ai-product --snapshot .local/content-sources/feishu-ai-product/incoming.json
```

其他文档先由代理读取并适配成以下标准快照，保持稳定的章节或块定位，再使用 ingest；尚未实现的网页/文档类型不会自动猜字段或假装完整读取：

```json
{
  "schema": "jargon.source/v1",
  "complete": true,
  "revision": "来源版本",
  "records": [{
    "locator": "chapter:2/block:17",
    "term": "术语名",
    "definition": "来源中的专业定义",
    "plain": "来源中的通俗说明"
  }]
}
```

## 2. 读取比对报告

本地 `report.json` 给出新增、修改、不变、移除的位置清单，以及新增候选、已有概念补充、不同语境待分辨、可能冲突、排除项。候选项列出精确别名匹配和名称相似建议；它们都不是自动裁决。名称相似不能证明同义，绝对化结论的提示也不等于已经证实错误。

每条来源记录具有内容 hash。表格插入行可能引起位置变化，报告会保守地标记变化；需结合前后内容人工复核，不声称能够自动跟踪所有行移动。来源删除的记录归档在 missing_rows，不删除规范词条。

## 3. 校对与决定

先判断条目是不是一个可解释的概念，再分辨同义、不同语境或只是相关。校对新解释也校对旧解释，技术内容以官方文档和论文等一手资料为依据。保留冲突理由，不让读起来更流畅的一方自动胜出。

可以在私有的 `decisions.json` 记录人工决定，键为 locator，内容含 row_hash、disposition、note。例如：

```json
{
  "row:4": {
    "row_hash": "从 report.json 复制本行 hash",
    "disposition": "existing_supplement",
    "note": "作为 RAG 的选题线索；另写解释，不复制原文"
  }
}
```

内容 hash 一旦变化，这个决定失效并回到待复核。决定只更新报告，不批准规范词条；批准仍须编辑规范库的 review，并补齐解释、边界、证据和公开使用条件。

批准时在 review.batch 写本批 YYYYMMDD，在 introduced_batch 保留概念首次引入批次；下一批修改不改 introduced_batch。使用 `python scripts/content_pipeline.py report --batch 20261029` 生成指定批次报告。

复用已有 ID；新增概念使用不重复的 `term-` 加 12 位十六进制 ID。不要修改已发布记录的 baseline，也不要物理删除旧 ID。真正需要废弃编号时，先补兼容方案再更改验证规则。

## 4. 整理专题并导出

优先补强已有专题。新专题先设 pending，只引用明确语境的词条，写好贯穿案例、分组、节点解释、关系理由和复习题。学习分组不是工程执行顺序；支持概念通过 supportingTerms 按需展开。专题解释与规范库不一致时，导出会拒绝通过。

可以用 draft-topic 命令从已校对词条搭建草稿（--id、--title、--terms 逗号分隔的 ID、--groups 对应每三节点的分组名）。它拒绝重复标题或编号，复制规范解释，保留空关系、空案例和 pending 状态；代理仍须补充学习目标、关系依据、案例和复习题。

```sh
python scripts/content_pipeline.py export
python scripts/content_pipeline.py validate
python -m unittest discover -s tests -v
python tests/check_project.py
python serve.py --port 18123
```

打开 `http://127.0.0.1:18123/` 验收。生成数据包括公开参考链接，但不包含原始快照和候选原文。Pages 构建也会检查数据是否由当前规范库生成。

## 5. 交付与发布

交付来源盘点、合并与冲突清单、内容变更、未解决项和本地预览。来源的完整候选报告留在本机；仓库内的批次报告只列经过整理的内容及统计。

默认不推送、不部署。收到明确发布要求后先保留当前发布 commit，再运行验证，推送 main 并检查 Pages。回退应恢复上一版规范库和对应生成数据，不能只恢复网页中的一份 JSON。工具箱服务和公网通道属于独立操作。
