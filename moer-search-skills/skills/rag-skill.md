# RAG 搜索 Skill

## 概述

该 Skill 提供 Retrieval-Augmented Generation (RAG) 检索增强生成能力，支持智能问答、文档理解等场景。

## 适用场景

- 智能问答系统
- 文档检索与理解
- 知识库问答
- 企业内部知识搜索

## 工具调用流程

```
用户问题 → SearchTool.search() → RerankTool.rerank() → 生成回答 → 返回结果
```

## Prompt 模板

### RAG 问答模板

```
你是一个智能问答助手。请根据用户的问题，先使用搜索工具查找相关知识，然后基于搜索结果进行回答。

用户问题: {{question}}

搜索步骤：
1. 使用搜索工具查找相关文档
2. 如果需要，使用重排序工具优化结果
3. 基于搜索结果生成回答

请按照以下格式调用工具：
<function name="search">
<parameter name="indexName" string="true">knowledge_base