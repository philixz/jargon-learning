# 2026-10-30 内容整理批次（本地待验收）

人工分流、内容修正、页面验收与未解决事项见 [本轮校对记录](content-review-20261030.md)。本批复用此前完整快照，没有重新在线读取飞书。

本地共 483 条记录、12 个串讲专题、16 个练习。

本批复核 32 项：新增 8 条、修订 24 条；原有 431 个编号全部保留。

另有 381 条已发布存量待逐条复核；保留不代表已验证正确。

## 来源与增量盘点

基础词表 430 条加本项目 goodcase 组成原有记录。飞书新表为选题线索，原文转载条件待确认，不直接复制进公开数据。

- AI/产品名词解释：版本 257，完整读取 A1:T849；非空记录 559，名称归一后 544 项。
- 候选分类：new_candidate 475；existing_supplement 54；context_review 10；excluded 20。
- 上述为审核分流建议，possible_conflict 是待核查预警，excluded 是名称噪声排除建议，不宣称已逐条裁决。
- 本次增量：added 0；changed 0；unchanged 559；removed 0。

完整候选、冲突预警与人工决定留在 `.local/content-sources/`；report.csv 供逐项筛选，report.json 保留原行及候选依据。

## 规范词条变更

| 条目 | 操作 | 别名示例 | 依据 |
|---|---|---|---|
| LLM | 修订 | LLM、Large Language Model、大语言模型 | [模型与训练术语](https://huggingface.co/docs/transformers/glossary)、[因果语言建模](https://huggingface.co/docs/transformers/tasks/language_modeling)、[InstructGPT 人类反馈训练论文](https://arxiv.org/abs/2203.02155) |
| 预训练 / Pretraining | 修订 | Pretraining、预训练 | [模型与训练术语](https://huggingface.co/docs/transformers/glossary)、[因果语言建模](https://huggingface.co/docs/transformers/tasks/language_modeling)、[检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval) |
| 后训练 / Post-training | 修订 | Post-training、后训练 | [TRL 后训练方法](https://huggingface.co/docs/trl/index)、[监督微调训练器](https://huggingface.co/docs/trl/sft_trainer)、[InstructGPT 人类反馈训练论文](https://arxiv.org/abs/2203.02155) |
| 继续预训练 / CPT / Mid-training | 修订 | CPT、Continued Pretraining、继续预训练 | [领域继续预训练研究](https://arxiv.org/abs/2004.10964)、[因果语言建模](https://huggingface.co/docs/transformers/tasks/language_modeling) |
| 基座 / Base | 修订 | Base、基座模型 | [模型与训练术语](https://huggingface.co/docs/transformers/glossary)、[对话模板与角色格式](https://huggingface.co/docs/transformers/chat_templating) |
| Instruct / Chat / Aligned | 修订 | Instruct、Chat、Aligned | [对话模板与角色格式](https://huggingface.co/docs/transformers/chat_templating)、[InstructGPT 人类反馈训练论文](https://arxiv.org/abs/2203.02155)、[TRL 后训练方法](https://huggingface.co/docs/trl/index) |
| SFT | 修订 | Supervised Fine-Tuning、监督微调 | [监督微调训练器](https://huggingface.co/docs/trl/sft_trainer)、[参数高效微调](https://huggingface.co/docs/peft/index) |
| RLHF | 修订 | Reinforcement Learning from Human Feedback、基于人类反馈的强化学习 | [InstructGPT 人类反馈训练论文](https://arxiv.org/abs/2203.02155)、[直接偏好优化原论文](https://arxiv.org/abs/2305.18290) |
| DPO | 修订 | Direct Preference Optimization、直接偏好优化 | [直接偏好优化原论文](https://arxiv.org/abs/2305.18290) |
| PEFT | 修订 | Parameter-Efficient Fine-Tuning、参数高效微调 | [参数高效微调](https://huggingface.co/docs/peft/index)、[LoRA 原论文](https://arxiv.org/abs/2106.09685) |
| LoRA / QLoRA | 修订 | LoRA、QLoRA、低秩适配 | [LoRA 原论文](https://arxiv.org/abs/2106.09685)、[QLoRA 原论文](https://arxiv.org/abs/2305.14314) |
| 全量微调 / Full FT | 修订 | Full FT、Full Fine-Tuning、全量微调 | [参数高效微调](https://huggingface.co/docs/peft/index)、[LoRA 原论文](https://arxiv.org/abs/2106.09685) |
| 语料 / Corpus | 修订 | Corpus、语料 | [领域继续预训练研究](https://arxiv.org/abs/2004.10964)、[训练数据去重研究](https://arxiv.org/abs/2107.06499) |
| Dedup | 修订 | Dedup、Deduplication、数据去重 | [训练数据去重研究](https://arxiv.org/abs/2107.06499)、[大模型评测数据污染研究](https://arxiv.org/abs/2310.17589) |
| 数据污染 / Contamination | 修订 | Data Contamination、评测污染、数据污染 | [大模型评测数据污染研究](https://arxiv.org/abs/2310.17589)、[训练数据去重研究](https://arxiv.org/abs/2107.06499) |
| 合成数据 / Synthetic data | 修订 | Synthetic data、合成数据 | [TinyStories 合成训练语料研究](https://arxiv.org/abs/2305.07759)、[大模型评测数据污染研究](https://arxiv.org/abs/2310.17589) |
| Decoder-only | 修订 | Decoder-only、仅解码器 | [因果语言建模](https://huggingface.co/docs/transformers/tasks/language_modeling)、[对话模板与角色格式](https://huggingface.co/docs/transformers/chat_templating) |
| Encoder-only | 修订 | Encoder-only、仅编码器 | [BERT 编码器架构](https://huggingface.co/docs/transformers/model_doc/bert)、[模型与训练术语](https://huggingface.co/docs/transformers/glossary) |
| Encoder-Decoder | 修订 | Encoder-Decoder、编码器解码器、Seq2Seq 架构 | [T5 编码器解码器架构](https://huggingface.co/docs/transformers/model_doc/t5)、[模型与训练术语](https://huggingface.co/docs/transformers/glossary) |
| Tokenizer | 修订 | Tokenizer、分词器 | [Tokenizer 接口与词表](https://huggingface.co/docs/transformers/main_classes/tokenizer)、[SentencePiece 官方项目](https://github.com/google/sentencepiece) |
| BPE / SentencePiece | 修订 | BPE、SentencePiece | [SentencePiece 官方项目](https://github.com/google/sentencepiece) |
| Chat template | 修订 | Chat template、聊天模板、对话模板 | [对话模板与角色格式](https://huggingface.co/docs/transformers/chat_templating)、[Tokenizer 接口与词表](https://huggingface.co/docs/transformers/main_classes/tokenizer) |
| 上下文窗口 | 修订 | Context Window、上下文窗口 | [模型与训练术语](https://huggingface.co/docs/transformers/glossary)、[Tokenizer 接口与词表](https://huggingface.co/docs/transformers/main_classes/tokenizer)、[对话模板与角色格式](https://huggingface.co/docs/transformers/chat_templating) |
| 工具调用 / Function Calling | 修订 | Function Calling、Tool Calling、工具调用 | [调用后端业务逻辑](https://docs.cloud.google.com/dialogflow/cx/docs/concept/webhook)、[提示注入与多层防护](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)、[对话履约](https://docs.cloud.google.com/dialogflow/cx/docs/concept/fulfillment) |
| 倒数排名融合 / RRF | 新增 | RRF、Reciprocal Rank Fusion、倒数排名融合 | [倒数排名融合](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion) |
| 向量相似度 | 新增 | Vector Similarity、向量相似度 | [句向量相似度](https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html)、[精确与近似向量检索](https://www.elastic.co/docs/solutions/search/vector/knn) |
| 近似最近邻 / ANN | 新增 | ANN、Approximate Nearest Neighbor、近似最近邻 | [精确与近似向量检索](https://www.elastic.co/docs/solutions/search/vector/knn) |
| 元数据过滤 | 新增 | Metadata Filtering、元数据过滤 | [向量检索的过滤条件](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-knn-query)、[提示注入与多层防护](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks) |
| 图像描述 / Image Captioning | 新增 | Image Captioning、图像描述、图像字幕 | [图像描述任务](https://huggingface.co/docs/transformers/tasks/image_captioning)、[图像与文本输入输出](https://huggingface.co/docs/transformers/tasks/image_text_to_text) |
| 实例分割 | 新增 | Instance Segmentation、实例分割 | [图像分割](https://huggingface.co/docs/transformers/tasks/semantic_segmentation)、[YOLO 模型任务边界](https://docs.ultralytics.com/tasks/) |
| 图像修复 / Inpainting | 新增 | Inpainting、局部重绘、图像修复 | [局部重绘与蒙版](https://huggingface.co/docs/diffusers/using-diffusers/inpaint) |
| 命名实体识别 / NER | 新增 | NER、Named Entity Recognition、命名实体识别 | [实体识别与词元分类](https://huggingface.co/docs/transformers/tasks/token_classification)、[对话意图](https://docs.cloud.google.com/dialogflow/cx/docs/concept/intent)、[会话参数](https://docs.cloud.google.com/dialogflow/cx/docs/concept/parameter) |

## 专题交付

- **知识问答：资料如何变成有依据的回答**：9 个核心节点、8 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。
- **模型适配：训练阶段与微调方式**：9 个核心节点、8 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。
- **智能客服：从识别问题到解决问题**：9 个核心节点、7 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。
- **图像生成与多模态：生成、识别、理解有什么区别**：9 个核心节点、7 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。

已有专题保留旧节点编号；新增支持概念从延伸入口查看。新专题围绕学习问题组织，不按来源机械复制目录。

## 待解决与发布边界

- 飞书原解释的公开转载授权未确认，继续仅作选题线索；不把可访问等同可转载。
- 尚未覆盖全部新来源候选及旧存量；没有把名称未匹配的条目一律计为新增。
- 名称相似、子类和上位概念仍需逐项分辨。例如图像识别不直接合并成图像分类，服务履约不直接当作 Dialogflow 的 Fulfillment。
- 本轮审核由代理依据所列一手资料和任务边界完成，尚待用户本地验收；不声称完成真人专家复审。
- 未推送 GitHub、未发布 Pages，不修改工具箱服务、账号或公网通道。
