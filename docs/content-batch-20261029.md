# 2026-10-29 内容整理批次（本地待验收）

本地共 475 条记录、12 个串讲专题、16 个练习。

本批复核 70 项：新增 44 条、修订 26 条；原有 431 个编号全部保留。

另有 405 条已发布存量待逐条复核；保留不代表已验证正确。

## 来源与增量盘点

基础词表 430 条加本项目 goodcase 组成原有记录。飞书新表为选题线索，原文转载条件待确认，不直接复制进公开数据。

- AI/产品名词解释：版本 257，完整读取 A1:T849；非空记录 559，名称归一后 544 项。
- 候选分类：new_candidate 476；existing_supplement 55；excluded 20；context_review 8。
- 上述为审核分流建议，possible_conflict 是待核查预警，excluded 是名称噪声排除建议，不宣称已逐条裁决。
- 本次增量：added 0；changed 0；unchanged 559；removed 0。

完整候选、冲突预警与人工决定留在 `.local/content-sources/`；report.csv 供逐项筛选，report.json 保留原行及候选依据。

## 规范词条变更

| 条目 | 操作 | 别名示例 | 依据 |
|---|---|---|---|
| 回归测试 | 修订 | Regression Testing | [回归测试术语](https://www.nist.gov/glossary-term/30681)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| Prompt / 提示词工程 | 修订 | Prompt、提示词、提示词工程 | [黑话学习工具自拟整理](https://github.com/philixz/jargon-learning)、[模型与训练术语](https://huggingface.co/docs/transformers/glossary) |
| Token | 修订 | 词元、tokens | [模型与训练术语](https://huggingface.co/docs/transformers/glossary) |
| 上下文窗口 | 修订 | Context Window、上下文长度 | [模型与训练术语](https://huggingface.co/docs/transformers/glossary)、[检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval) |
| RAG | 修订 | 检索增强生成、Retrieval Augmented Generation、RAG技术 | [检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval) |
| Embedding | 修订 | 嵌入、文本向量、向量嵌入 | [Embedding 及检索用途](https://developers.openai.com/api/docs/guides/embeddings) |
| Agent / 智能体 | 修订 | Agent、AI-Agent、智能体 | [黑话学习工具自拟整理](https://github.com/philixz/jargon-learning)、[多轮对话路径](https://docs.cloud.google.com/dialogflow/cx/docs/concept/flow) |
| 工具调用 / Function Calling | 修订 | 工具调用、Function Calling | [调用后端业务逻辑](https://docs.cloud.google.com/dialogflow/cx/docs/concept/webhook)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 多模态 | 修订 | Multimodal、多模态AI、多模态模型 | [图像与文本输入输出](https://huggingface.co/docs/transformers/tasks/image_text_to_text) |
| 幻觉 | 修订 | Hallucination、模型幻觉 | [检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 评测 / Eval / Benchmark | 修订 | 评测、Eval、Benchmark | [黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| badcase | 修订 | Bad case、失败样本 | [黑话学习工具自拟整理](https://github.com/philixz/jargon-learning)、[调用后端业务逻辑](https://docs.cloud.google.com/dialogflow/cx/docs/concept/webhook) |
| 微调 / Fine-tuning | 修订 | 微调、Fine-tuning、Fine Tuning | [模型与训练术语](https://huggingface.co/docs/transformers/glossary)、[检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval) |
| Guardrail / 护栏 | 修订 | Guardrail、护栏 | [提示注入与多层防护](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)、[计算机操作中的人工复核](https://claude.com/resources/articles/best-practices-for-computer-and-browser-use-with-claude) |
| HITL / Human-in-the-Loop | 修订 | HITL、Human-in-the-Loop、人在回路 | [计算机操作中的人工复核](https://claude.com/resources/articles/best-practices-for-computer-and-browser-use-with-claude) |
| SLA | 修订 | Service Level Agreement、服务等级协议、SLA规则 | [SLI、SLO 与 SLA](https://sre.google/sre-book/service-level-objectives/) |
| Gold / 金标 | 修订 | 金标、Gold Label、Gold Standard | [数据标注任务与说明](https://docs.cloud.google.com/vertex-ai/docs/samples/aiplatform-create-data-labeling-job-sample)、[标注者一致性与 Kappa](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html) |
| 标注一致性 | 修订 | Inter-annotator Agreement、IAA | [标注者一致性与 Kappa](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html) |
| Grounding | 修订 | 依据约束、基于依据作答 | [检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| RAG | 修订 | 检索增强生成、Retrieval Augmented Generation | [检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval) |
| HITL | 修订 | HITL、Human-in-the-Loop、人在回路 | [计算机操作中的人工复核](https://claude.com/resources/articles/best-practices-for-computer-and-browser-use-with-claude) |
| Guardrail / 护栏 | 修订 | Guardrail、护栏 | [提示注入与多层防护](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)、[计算机操作中的人工复核](https://claude.com/resources/articles/best-practices-for-computer-and-browser-use-with-claude) |
| 工作流 vs Agent | 修订 | 工作流、Workflow | [多轮对话路径](https://docs.cloud.google.com/dialogflow/cx/docs/concept/flow)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| Benchmark | 修订 | 基准测试、评测基准 | [分类指标与计分口径](https://scikit-learn.org/stable/modules/model_evaluation.html)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| Prompt injection | 修订 | 提示注入、Prompt Injection | [提示注入与多层防护](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks) |
| goodcase | 修订 | Good case、成功样本 | [黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 知识库 | 新增 | Knowledge Base | [检索与 RAG](https://docs.langchain.com/oss/python/deepagents/retrieval) |
| 文档分块 | 新增 | Chunking、文本切分 | [文档分块](https://docs.langchain.com/oss/python/integrations/splitters) |
| 向量数据库 | 新增 | Vector Database | [语义搜索与向量存储](https://developers.openai.com/api/docs/guides/retrieval) |
| 语义检索 | 新增 | Semantic Search、语义搜索 | [语义搜索与向量存储](https://developers.openai.com/api/docs/guides/retrieval) |
| 关键词检索 | 新增 | Keyword Search、全文检索 | [语义搜索与向量存储](https://developers.openai.com/api/docs/guides/retrieval)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 重排序 | 新增 | Reranking、Reranker、重排 | [检索后重排序](https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html) |
| 智能客服 | 新增 | AI客服、智能客服产品、NLP智能客服 | [多轮对话路径](https://docs.cloud.google.com/dialogflow/cx/docs/concept/flow)、[对话履约](https://docs.cloud.google.com/dialogflow/cx/docs/concept/fulfillment)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 意图识别 | 新增 | Intent Detection、Intent Classification | [对话意图](https://docs.cloud.google.com/dialogflow/cx/docs/concept/intent) |
| 槽位填充 | 新增 | Slot Filling | [会话参数](https://docs.cloud.google.com/dialogflow/cx/docs/concept/parameter) |
| 多轮对话 | 新增 | Multi-turn Dialogue | [多轮对话路径](https://docs.cloud.google.com/dialogflow/cx/docs/concept/flow)、[会话参数](https://docs.cloud.google.com/dialogflow/cx/docs/concept/parameter) |
| 对话管理 | 新增 | Dialogue Management | [对话状态与事件处理](https://docs.cloud.google.com/dialogflow/cx/docs/concept/handler)、[多轮对话路径](https://docs.cloud.google.com/dialogflow/cx/docs/concept/flow) |
| 对话履约 | 新增 | Fulfillment | [对话履约](https://docs.cloud.google.com/dialogflow/cx/docs/concept/fulfillment)、[调用后端业务逻辑](https://docs.cloud.google.com/dialogflow/cx/docs/concept/webhook) |
| 人工接管 | 新增 | Human Handoff、转人工、人工兜底 | [人工接管标记与真实交接的区别](https://docs.cloud.google.com/python/docs/reference/dialogflow/latest/google.cloud.dialogflow_v2.types.ResponseMessage.LiveAgentHandoff)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 异常兜底 | 新增 | Fallback | [对话状态与事件处理](https://docs.cloud.google.com/dialogflow/cx/docs/concept/handler)、[对话意图](https://docs.cloud.google.com/dialogflow/cx/docs/concept/intent)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| Diffusion 模型 | 新增 | Diffusion模型、扩散模型、Diffusion Models | [扩散模型工具与任务](https://huggingface.co/docs/diffusers/index)、[文生图](https://huggingface.co/docs/diffusers/using-diffusers/conditional_image_generation) |
| Stable Diffusion | 新增 | stable diffusion、SD | [扩散模型工具与任务](https://huggingface.co/docs/diffusers/index)、[文生图](https://huggingface.co/docs/diffusers/using-diffusers/conditional_image_generation) |
| 文生图 | 新增 | Text-to-image、文本生成图像 | [文生图](https://huggingface.co/docs/diffusers/using-diffusers/conditional_image_generation) |
| 图生图 | 新增 | Image-to-image、图像到图像 | [图生图](https://huggingface.co/docs/diffusers/using-diffusers/img2img) |
| 图像分类 | 新增 | Image Classification | [图像分类](https://huggingface.co/docs/transformers/tasks/image_classification) |
| 目标检测 | 新增 | Object Detection | [目标检测](https://huggingface.co/docs/transformers/tasks/object_detection) |
| 视觉问答 | 新增 | Visual Question Answering、VQA | [图像与文本输入输出](https://huggingface.co/docs/transformers/tasks/image_text_to_text) |
| OCR | 新增 | Optical Character Recognition、光学字符识别、文字识别 | [图像文字识别](https://huggingface.co/docs/transformers/model_doc/trocr) |
| 图像分割 | 新增 | Image Segmentation | [图像分割](https://huggingface.co/docs/transformers/tasks/semantic_segmentation) |
| 生成式 AI | 新增 | Generative AI、生成式AI | [扩散模型工具与任务](https://huggingface.co/docs/diffusers/index)、[图像与文本输入输出](https://huggingface.co/docs/transformers/tasks/image_text_to_text)、[黑话学习工具自拟整理](https://github.com/philixz/jargon-learning) |
| 自然语言处理 | 新增 | NLP、Natural Language Processing、自然语言处理（NLP） | [自然语言处理及任务范围](https://huggingface.co/learn/llm-course/chapter1/2) |
| 自然语言理解 | 新增 | NLU、Natural Language Understanding、自然语言理解（NLU） | [自然语言处理及任务范围](https://huggingface.co/learn/llm-course/chapter1/2)、[对话意图](https://docs.cloud.google.com/dialogflow/cx/docs/concept/intent)、[会话参数](https://docs.cloud.google.com/dialogflow/cx/docs/concept/parameter) |
| 自然语言生成 | 新增 | NLG、Natural Language Generation | [自然语言处理及任务范围](https://huggingface.co/learn/llm-course/chapter1/2)、[对话履约](https://docs.cloud.google.com/dialogflow/cx/docs/concept/fulfillment) |
| 自动语音识别 | 新增 | ASR、Automatic Speech Recognition、语音转文字 | [语音转文字任务](https://huggingface.co/docs/transformers/tasks/asr) |
| 语音合成 | 新增 | TTS、Text-to-Speech、文字转语音 | [文字转语音任务](https://huggingface.co/docs/transformers/tasks/text-to-speech) |
| 精确率 | 新增 | Precision、查准率 | [分类指标与计分口径](https://scikit-learn.org/stable/modules/model_evaluation.html) |
| 召回率 | 新增 | Recall、查全率 | [分类指标与计分口径](https://scikit-learn.org/stable/modules/model_evaluation.html) |
| 准确率 | 新增 | Accuracy、分类准确率 | [分类指标与计分口径](https://scikit-learn.org/stable/modules/model_evaluation.html) |
| F1 分数 | 新增 | F1、F1 score | [分类指标与计分口径](https://scikit-learn.org/stable/modules/model_evaluation.html) |
| 混淆矩阵 | 新增 | Confusion Matrix | [分类指标与计分口径](https://scikit-learn.org/stable/modules/model_evaluation.html) |
| 检索召回率 Recall@K | 新增 | Recall@K、R@K | [排序检索评估](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/search-rank-eval) |
| 混合检索 | 新增 | Hybrid Search | [全文与向量的混合检索](https://www.elastic.co/docs/solutions/search/hybrid-search) |
| BM25 | 新增 | Okapi BM25 | [BM25 相似度与评分](https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity) |
| YOLO 系列模型 | 新增 | YOLO、YOLO系列模型、You Only Look Once | [YOLO 模型任务边界](https://docs.ultralytics.com/tasks/) |
| 联邦学习 | 新增 | Federated Learning | [联邦学习概览](https://www.tensorflow.org/federated/federated_learning)、[联邦学习与差分隐私](https://www.tensorflow.org/federated/tutorials/federated_learning_with_differential_privacy) |
| WebRTC | 新增 | Web Real-Time Communication | [WebRTC 连接与信令、中继](https://webrtc.org/getting-started/peer-connections) |
| CMMI | 新增 | cmmi、Capability Maturity Model Integration、能力成熟度模型集成 | [CMMI 与能力改进](https://cmmiinstitute.com/cmmi/intro) |
| 数据标注 | 新增 | Data Annotation、Data Labeling | [数据标注任务与说明](https://docs.cloud.google.com/vertex-ai/docs/samples/aiplatform-create-data-labeling-job-sample)、[标注者一致性与 Kappa](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.cohen_kappa_score.html) |
| 内容安全机制 | 新增 | LLM内容安全、大模型内容安全 | [提示注入与多层防护](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)、[计算机操作中的人工复核](https://claude.com/resources/articles/best-practices-for-computer-and-browser-use-with-claude) |
| 语义分割 | 新增 | Semantic Segmentation | [图像分割](https://huggingface.co/docs/transformers/tasks/semantic_segmentation) |

## 专题交付

- **知识问答：资料如何变成有依据的回答**：9 个核心节点、8 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。
- **智能客服：从识别问题到解决问题**：9 个核心节点、7 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。
- **图像生成与多模态：生成、识别、理解有什么区别**：9 个核心节点、7 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。

已有专题保留旧节点编号；新增支持概念从延伸入口查看。新专题围绕学习问题组织，不按来源机械复制目录。

## 待解决与发布边界

- 飞书原解释的公开转载授权未确认，继续仅作选题线索；不把可访问等同可转载。
- 尚未覆盖全部新来源候选及旧存量；没有把名称未匹配的条目一律计为新增。
- 名称相似、子类和上位概念仍需逐项分辨。例如图像识别不直接合并成图像分类，服务履约不直接当作 Dialogflow 的 Fulfillment。
- 本轮审核由代理依据所列一手资料和任务边界完成，尚待用户本地验收；不声称完成真人专家复审。
- 未推送 GitHub、未发布 Pages，不修改工具箱服务、账号或公网通道。

## 晚间续整

本日累计复核 70 条；晚间新增的 30 条规范校对、31 条来源预警分流及验收结果见 [晚间续整记录](content-review-evening-20261029.md)。源行 reviewed 表示已记录分流决定，不等于原文内容已批准公开。
