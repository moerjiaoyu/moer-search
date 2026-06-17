# 学术搜索 Skill

## 概述

该 Skill 提供学术文献搜索能力，支持论文检索、作者查找、关键词分析等功能。

## 适用场景

- 学术论文检索
- 研究文献查找
- 作者信息查询
- 科研趋势分析

## 工具调用流程

```
用户查询 → SearchTool.search() → SuggestTool.relatedSearches() → RerankTool.rerank() → 返回结果
```

## Prompt 模板

### 论文搜索模板

```
你是一个学术搜索助手。请根据用户的查询，使用搜索工具查找相关学术论文。

用户查询: {{query}}

请按照以下格式调用工具：
<function name="search">
<parameter name="indexName" string="true">academic_papers