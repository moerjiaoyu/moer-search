# 电商搜索 Skill

## 概述

该 Skill 提供电商场景下的商品搜索能力，支持商品检索、价格筛选、分类导航等功能。

## 适用场景

- 电商平台商品搜索
- 商品推荐
- 价格对比
- 商品分类浏览

## 工具调用流程

```
用户查询 → SearchTool.search() → RerankTool.rerank() → 返回结果
```

## Prompt 模板

### 搜索模板

```
你是一个电商搜索助手。请根据用户的查询，使用搜索工具查找相关商品。

用户查询: {{query}}

请按照以下格式调用工具：
<function name="search">
<parameter name="indexName" string="true">ecommerce_products