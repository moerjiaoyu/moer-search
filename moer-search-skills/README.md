# Moer Search Skills

## 概述

本目录包含 Moer Search 服务的 Skill 定义文件。Skill 是一种将特定领域知识与搜索能力相结合的配置文件，用于指导 AI Agent 在不同场景下如何使用搜索工具。

## Skill 列表

| Skill 名称 | 描述 | 适用场景 |
| :--- | :--- | :--- |
| **ecommerce-skill** | 电商搜索能力 | 商品检索、价格对比、分类导航 |
| **academic-skill** | 学术搜索能力 | 论文检索、作者查找、科研分析 |
| **rag-skill** | RAG 检索增强生成 | 智能问答、文档理解、知识库问答 |

## Skill 文件结构

每个 Skill 文件包含以下部分：

1. **概述**：Skill 的功能描述
2. **适用场景**：Skill 适用的业务场景
3. **工具调用流程**：工具调用的序列图
4. **Prompt 模板**：指导 AI Agent 如何使用工具的提示词模板

## 使用方式

### 1. 加载 Skill

```java
// 加载电商搜索 Skill
Skill ecommerceSkill = Skill.load("skills/ecommerce-skill.md");

// 获取 Prompt 模板
String prompt = ecommerceSkill.getPrompt("search");

// 填充模板参数
prompt = prompt.replace("{{query}}", "手机");
```

### 2. 工具调用

每个 Skill 定义了可调用的工具列表：

| 工具名称 | 功能 |
| :--- | :--- |
| `search` | 全文搜索 |
| `suggest` | 搜索建议 |
| `rerank` | 结果重排序 |

## 创建新 Skill

要创建新的 Skill，请按照以下格式编写 markdown 文件：

```markdown
# Skill 名称

## 概述

## 适用场景

## 工具调用流程

## Prompt 模板
```

## 目录结构

```
moer-search-skills/
├── skills/
│   ├── ecommerce-skill.md    # 电商搜索 Skill
│   ├── academic-skill.md     # 学术搜索 Skill
│   └── rag-skill.md          # RAG 搜索 Skill
└── README.md                  # 本文件
```

## 扩展

可以通过添加新的 Skill 文件来扩展搜索能力，无需修改代码即可支持新的业务场景。
