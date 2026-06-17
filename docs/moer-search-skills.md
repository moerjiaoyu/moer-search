# Moer Search Skills - 技能配置使用文档

## 概述

**moer-search-skills** 是 Moer Search 服务的技能（Skill）定义模块，提供将特定领域知识与搜索能力相结合的配置文件。Skill 用于指导 AI Agent 在不同业务场景下如何使用搜索工具，实现领域特定的智能搜索能力。

### 核心概念

| 概念 | 说明 |
|------|------|
| **Skill** | 技能定义文件，包含领域知识、工具调用流程和 Prompt 模板 |
| **Prompt 模板** | 指导 AI Agent 使用工具的提示词模板，包含占位符参数 |
| **工具调用链** | 多个工具按顺序调用的流程定义 |

### 目录结构

```
moer-search-skills/
├── skills/
│   ├── ecommerce-skill.md    # 电商搜索 Skill
│   ├── academic-skill.md     # 学术搜索 Skill
│   └── rag-skill.md          # RAG 检索增强 Skill
└── README.md                  # 说明文档
```

---

## 二、Skill 列表

| Skill 名称 | 描述 | 适用场景 | 索引名称 |
|-----------|------|----------|----------|
| **ecommerce-skill** | 电商商品搜索能力 | 商品检索、价格对比、分类导航 | `ecommerce_products` |
| **academic-skill** | 学术文献搜索能力 | 论文检索、作者查找、科研分析 | `academic_papers` |
| **rag-skill** | RAG 检索增强生成 | 智能问答、文档理解、知识库问答 | `knowledge_base` |

---

## 三、Skill 文件结构

每个 Skill 文件包含以下四个核心部分：

### 3.1 概述

Skill 的功能描述和核心能力说明。

### 3.2 适用场景

Skill 适用的业务场景列表，帮助 Agent 判断何时使用该 Skill。

### 3.3 工具调用流程

定义工具调用的顺序和依赖关系：

```
用户查询 → SearchTool.search() → SuggestTool.relatedSearches() → RerankTool.rerank() → 返回结果
```

### 3.4 Prompt 模板

指导 AI Agent 如何使用工具的提示词模板，包含可替换的占位符参数。

---

## 四、各 Skill 详细说明

### 4.1 Ecommerce Skill - 电商搜索技能

#### 概述

提供电商场景下的商品搜索能力，支持商品检索、价格筛选、分类导航等功能。

#### 适用场景

- 电商平台商品搜索
- 商品推荐
- 价格对比
- 商品分类浏览

#### 工具调用流程

```
用户查询 → SearchTool.search() → RerankTool.rerank() → 返回结果
```

#### Prompt 模板

```
你是一个电商搜索助手。请根据用户的查询，使用搜索工具查找相关商品。

用户查询: {{query}}

请按照以下格式调用工具：
<function name="search">
<parameter name="indexName" string="true">ecommerce_products