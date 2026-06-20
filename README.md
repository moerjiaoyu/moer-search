# Moer Search Service

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java Version](https://img.shields.io/badge/java-11-blue.svg)](https://www.oracle.com/java/technologies/downloads/#java11)
[![Spring Boot Version](https://img.shields.io/badge/spring--boot-2.7.16-blue.svg)](https://spring.io/projects/spring-boot)

**语言版本 / Language Version:**  
- [中文](README.md) | [English](README.en.md)

Moer Search 是一个基于 Spring Boot 和 Elasticsearch 的分布式搜索引擎服务，提供完整的索引管理和文档操作能力，并深度融合 AI 能力，支持 MCP、Skills 和本体引擎，是构建企业级智能搜索与知识管理平台的理想基础设施。

---

## 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
  - [环境要求](#环境要求)
  - [配置说明](#配置说明)
  - [构建项目](#构建项目)
  - [运行服务](#运行服务)
- [API 接口](#api接口)
  - [索引管理](#索引管理)
  - [文档操作](#文档操作)
- [gRPC 接口](#grpc接口)
- [MCP Server](#mcp-server)
  - [MCP 概述](#mcp概述)
  - [注册的工具](#注册的工具)
  - [工具详细说明](#工具详细说明)
  - [MCP 工具使用示例](#mcp工具使用示例)
  - [运行 MCP Server](#运行mcp-server)
- [本体引擎](#本体引擎)
  - [本体概述](#本体概述)
  - [核心组件](#核心组件)
  - [推理能力](#推理能力)
  - [索引管理](#索引管理-1)
  - [查询扩展](#查询扩展)
- [Skills 定义](#skills定义)
  - [Skill 概述](#skill概述)
  - [内置 Skill 列表](#内置skill列表)
  - [Skill 文件结构](#skill文件结构)
  - [创建自定义 Skill](#创建自定义skill)
- [Web 管理平台](#web管理平台)
  - [平台概述](#平台概述)
  - [功能模块](#功能模块)
  - [启动方式](#启动方式)
- [配置参数](#配置参数)
- [Docker 部署](#docker部署)
- [代码规范](#代码规范)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目简介

Moer Search 是一个高性能的分布式搜索引擎服务，基于 Spring Boot 2.7.x 和 BBoss Elasticsearch 客户端构建。该服务提供了完整的 Elasticsearch 索引和文档管理功能，支持通过 RESTful API 和 gRPC 两种方式访问，并提供 MCP 支持和本体推理能力。

### 主要功能

| 模块 | 功能 |
| :--- | :--- |
| **索引管理** | 创建、删除、更新、关闭、开启索引 |
| **文档操作** | 添加、删除、更新、查询文档 |
| **批量操作** | 批量添加、删除、更新文档 |
| **DSL 查询** | 支持复杂的 Elasticsearch DSL 查询 |
| **SQL 查询** | 支持通过 SQL 语句查询索引数据 |
| **别名管理** | 添加、移除索引别名 |
| **gRPC 支持** | 提供高性能的 gRPC 接口 |
| **MCP 支持** | 提供 AI Agent 可调用的搜索工具 |
| **本体引擎** | 提供概念推理和语义扩展能力 |
| **动作引擎** | 支持动作意图处理（QUERY/COMMAND/EVENT/WORKFLOW） |
| **索引生命周期** | 自动创建和管理索引生命周期策略 |
| **Web 管理平台** | 提供可视化的索引、文档、本体管理界面 |

---

## 技术栈

| 技术 | 版本 | 说明 |
| :--- | :--- | :--- |
| Java | 11 | 编程语言 |
| Spring Boot | 2.7.16 | 应用框架 |
| BBoss Elasticsearch | 7.1.3 | Elasticsearch 客户端 |
| gRPC | 1.58.0 | 高性能 RPC 框架 |
| Protocol Buffers | 3.24.0 | 数据序列化 |
| Knife4j | 3.0.3 | API 文档生成工具 |
| Hutool | 5.8.3 | Java 工具库 |
| FastJSON2 | 2.0.32 | JSON 处理库 |
| Lombok | 1.18.x | 代码简化工具 |
| Node.js | 20.x | 前端运行环境 |
| React | 18.x | 前端框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 6.x | 构建工具 |
| Ant Design | 5.x | UI 组件库 |

---

## 项目结构

```
moer-search/
├── pom.xml                              # 父项目 Maven 配置
├── moer-search-api/                     # API 模块（gRPC 定义）
│   ├── pom.xml
│   └── src/main/proto/                  # Protocol Buffers 定义文件
│       └── com/moer/search/             # gRPC 消息定义
├── moer-search-service/                 # 业务服务实现模块
│   ├── pom.xml
│   ├── config/application.yml           # 配置文件（外部）
│   ├── Dockerfile                       # Docker 镜像构建文件
│   └── src/main/java/com/moer/search/
│       ├── MoerSearchApplication.java   # 启动类
│       ├── aspect/                      # AOP 切面
│       ├── config/                      # 配置类
│       ├── controller/                  # REST 控制器
│       ├── entity/                      # 实体类
│       ├── enums/                       # 枚举类
│       ├── grpc/                        # gRPC 服务实现
│       ├── handler/                     # 异常处理器
│       ├── service/                     # 服务接口
│       ├── service/impl/                # 服务实现
│       └── utils/                       # 工具类
├── moer-search-mcp/                     # MCP Server 模块
│   ├── pom.xml
│   └── src/main/java/com/moer/search/mcp/
│       ├── MoerMcpServer.java           # MCP 服务启动类
│       ├── tools/                       # MCP 工具定义
│       │   ├── SearchTool.java          # 搜索工具
│       │   ├── SuggestTool.java         # 搜索建议工具
│       │   └── RerankTool.java          # 重排序工具
│       └── handlers/                    # 工具处理器
│           └── SearchHandler.java       # 搜索处理器
├── moer-search-ontology/                # 本体引擎模块
│   ├── pom.xml
│   └── src/main/java/com/moer/search/ontology/
│       ├── MoerOntologyEngine.java      # 本体引擎核心
│       ├── model/                       # 模型定义
│       │   ├── Concept.java             # 概念定义
│       │   ├── Relation.java            # 关系定义
│       │   └── Instance.java            # 实例数据
│       ├── reasoner/                    # 推理器
│       │   ├── SubclassReasoner.java    # 子类推理
│       │   ├── TransitiveReasoner.java  # 传递推理
│       │   └── RuleReasoner.java        # 规则推理
│       ├── storage/                     # 存储层
│       │   └── OntologyStore.java       # 本体存储
│       ├── index/                       # 索引管理
│       │   ├── OntologyIndexManager.java # 索引管理器
│       │   └── ElasticsearchClientWrapper.java # ES客户端封装
│       ├── config/                      # 配置类
│       │   └── OntologyIndexProperties.java # 索引配置
│       └── integration/                 # 集成模块
│           └── QueryExpander.java       # 查询扩展器
├── moer-search-skills/                  # Skills 定义模块
│   ├── README.md
│   └── skills/
│       ├── ecommerce-skill.md           # 电商搜索 Skill
│       ├── academic-skill.md            # 学术搜索 Skill
│       └── rag-skill.md                 # RAG 搜索 Skill
└── moer-search-web/                     # Web 前端管理平台（新增）
    ├── package.json                     # 前端依赖配置
    ├── server.ts                        # 后端服务（Node.js）
    ├── vite.config.ts                   # Vite 构建配置
    ├── tsconfig.json                    # TypeScript 配置
    ├── index.html                       # HTML 入口
    ├── src/
    │   ├── main.tsx                     # 应用入口
    │   ├── App.tsx                      # 主应用组件
    │   ├── types.ts                     # 类型定义
    │   ├── index.css                    # 全局样式
    │   └── components/                  # UI 组件
    │       ├── DashboardView.tsx        # 首页概览
    │       ├── IndexMgrView.tsx         # 索引管理
    │       ├── DocumentMgrView.tsx      # 文档管理
    │       ├── OntologyView.tsx         # 本体管理
    │       ├── SearchValidatorView.tsx  # 搜索验证
    │       ├── ModelConfigView.tsx      # 模型配置
    │       ├── AiAbilitiesView.tsx      # AI能力展示
    │       ├── ApiDocsView.tsx          # API文档
    │       └── SystemView.tsx           # 系统管理
    └── docs/                            # 前端文档
        └── images/                      # 截图资源
```

---

## 快速开始

### 环境要求

- JDK 11+
- Maven 3.6+
- Elasticsearch 服务已适配不同版本，推荐使用7.x17.x版本

### 配置说明

修改配置文件 `moer-search-service/config/application.yml`：

```yaml
server:
  port: ${SERVER_PORT:8082}
spring:
  application:
    name: ${APPLICATION_NAME:moer-search-service}
  elasticsearch:
    bboss:
      elasticUser: ${ELASTICSEARCH_USERNAME:elastic}
      elasticPassword: ${ELASTICSEARCH_PASSWORD:changeme}
      elasticsearch:
        rest:
          hostNames: ${ELASTICSEARCH_HOSTNAMES:localhost:9200}
        timeZone: Asia/Shanghai
grpc:
  server:
    port: ${GRPC_SERVER_PORT:19998}
```

### 构建项目

```bash
cd moer-search
mvn clean package -DskipTests
```

### 运行服务

```bash
cd moer-search-service
mvn spring-boot:run
```

---

## API 接口

服务启动后访问 API 文档：http://localhost:8082/doc.html

### 索引管理

| 接口 | 方法 | 路径 |
| :--- | :--- | :--- |
| 获取索引列表 | GET | `/v1/api/index/indices` |
| 获取索引详情 | GET | `/v1/api/index/{indexName}` |
| 创建索引 | POST | `/v1/api/index` |
| 更新索引 | PUT | `/v1/api/index/{indexName}` |
| 删除索引 | DELETE | `/v1/api/index/{indexName}` |

### 文档操作

| 接口 | 方法 | 路径 |
| :--- | :--- | :--- |
| 获取文档 | GET | `/v1/api/documents/{indexName}/{id}` |
| 添加文档 | POST | `/v1/api/documents/{indexName}` |
| 更新文档 | PUT | `/v1/api/documents/{indexName}/{id}` |
| 删除文档 | DELETE | `/v1/api/documents/{indexName}/{id}` |
| DSL 查询 | POST | `/v1/api/documents/{indexName}/search` |

---

## gRPC 接口

项目提供两个 gRPC 服务：
1. **EsIndexService** - 索引管理服务
2. **EsDocumentService** - 文档操作服务

### 使用示例

```java
ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 19998)
    .usePlaintext()
    .build();
EsIndexServiceGrpc.EsIndexServiceBlockingStub indexStub = 
    EsIndexServiceGrpc.newBlockingStub(channel);
IndexInfoListResponse response = indexStub.indices(Empty.newBuilder().build());
```

---

## MCP Server

### MCP 概述

**MCP（Model Context Protocol）** 是一种标准化的插件协议，允许 AI Agent 通过标准协议调用外部工具和数据。Moer Search MCP Server 将搜索能力封装为标准化的工具，供 AI Agent 使用。

### 注册的工具

| 工具名称 | 类名 | 功能描述 |
| :--- | :--- | :--- |
| `search` | SearchTool | 全文搜索工具，支持关键词搜索和 DSL 查询 |
| `suggest` | SuggestTool | 搜索建议工具，提供前缀建议、热门搜索、相关搜索 |
| `rerank` | RerankTool | 结果重排序工具，基于语义相似度重新排序 |

### 工具详细说明

#### SearchTool

**方法列表：**

| 方法名 | 参数 | 说明 |
| :--- | :--- | :--- |
| `search` | `indexName`, `query`, `fields`, `pageNum`, `pageSize` | 执行全文搜索 |
| `searchByDsl` | `indexName`, `dsl` | 执行 DSL 查询 |

**返回结果结构：**

```json
{
  "success": true,
  "data": [{"id": "doc-1", "title": "...", "content": "...", "score": 0.95}],
  "total": 100,
  "message": "搜索成功"
}
```

#### SuggestTool

**方法列表：**

| 方法名 | 参数 | 说明 |
| :--- | :--- | :--- |
| `suggest` | `prefix`, `count` | 获取前缀匹配建议 |
| `hotSearches` | `count` | 获取热门搜索词 |
| `relatedSearches` | `query`, `count` | 获取相关搜索词 |

#### RerankTool

**rerank 方法参数：**

| 参数 | 说明 |
| :--- | :--- |
| `query` | 搜索查询词 |
| `documents` | 待排序的文档列表 |
| `topN` | 返回前 N 个结果 |
| `algorithm` | 排序算法（semantic/bm25/hybrid） |

**支持的排序算法：**

| 算法 | 说明 |
| :--- | :--- |
| `semantic` | 基于语义相似度排序 |
| `bm25` | 基于 BM25 算法排序 |
| `hybrid` | 混合排序（语义60% + BM25 40%） |

### MCP 工具使用示例

**使用 SearchTool：**

```java
SearchTool searchTool = new SearchTool();
Map<String, Object> result = searchTool.search(
    "ecommerce_products",
    "智能手机",
    "title,description",
    1,
    10
);
```

**使用 SuggestTool：**

```java
SuggestTool suggestTool = new SuggestTool();
Map<String, Object> suggestions = suggestTool.suggest("人工智能", 5);
```

**使用 RerankTool：**

```java
RerankTool rerankTool = new RerankTool();
List<Map<String, Object>> documents = new ArrayList<>();
documents.add(Map.of("id", "doc-1", "title", "AI入门", "content", "..."));
Map<String, Object> result = rerankTool.rerank("深度学习", documents, 5, "semantic");
```

### 运行 MCP Server

```bash
cd moer-search-mcp
mvn spring-boot:run
```

---

## 本体引擎

### 本体概述

**本体引擎（Ontology Engine）** 提供概念推理和语义扩展能力，支持知识图谱的构建和推理。本体引擎可以帮助实现更智能的搜索，通过理解概念之间的关系来扩展查询。

### 核心组件

| 组件 | 说明 |
| :--- | :--- |
| **MoerOntologyEngine** | 本体引擎核心，统一管理概念、关系和实例 |
| **Concept** | 概念模型，表示领域知识中的实体、属性、事件等 |
| **Relation** | 关系模型，表示概念之间的语义关联 |
| **Instance** | 实例模型，表示概念的具体实例 |
| **OntologyStore** | 本体存储层，管理概念、关系和实例的持久化 |

### 推理能力

本体引擎提供三种推理能力：

#### 1. 子类推理（Subclass Reasoner）
- 获取直接/间接子类
- 获取直接/间接父类
- 判断继承关系
- 构建概念层次结构

#### 2. 传递推理（Transitive Reasoner）
- 计算传递闭包
- 判断传递关系
- 查找关系路径
- 获取祖先/后代概念

#### 3. 规则推理（Rule Reasoner）
- 传递属性规则
- 反向关系规则
- 子类继承规则
- 部分-整体传递规则
- 实例分类规则

### 索引管理

本体引擎支持索引生命周期管理：

**本体概念索引（moer_ontology_yyyyMM）**
```json
{
  "mappings": {
    "properties": {
      "concept_id": {"type": "keyword"},
      "concept_name": {"type": "text", "analyzer": "ik_smart"},
      "parents": {"type": "keyword"},
      "children": {"type": "keyword"},
      "relations": {"type": "nested", "properties": {"type": {"keyword"}, "target_id": {"keyword"}}}
    }
  }
}
```

**文档索引（moer_documents_yyyyMM）**
```json
{
  "mappings": {
    "properties": {
      "title": {"type": "text"},
      "content": {"type": "text"},
      "concept_tags": {"type": "keyword"},
      "semantic_types": {"type": "keyword"}
    }
  }
}
```

**生命周期策略：**

| 阶段 | 天数 | 操作 |
| :--- | :--- | :--- |
| Hot | 0-30 | 高优先级(100) |
| Warm | 30-90 | 中优先级(50)，收缩为1分片 |
| Cold | 90-180 | 低优先级(25)，冻结索引 |
| Delete | 180-365 | 自动删除 |

### 查询扩展

**QueryExpander** 组件可以基于本体进行语义查询扩展：

```java
QueryExpander expander = new QueryExpander(ontologyEngine);
QueryExpander.ExpandedQuery expanded = expander.expandQuery("人工智能");

// 获取扩展后的查询词
List<String> expandedTerms = expanded.getExpandedTerms();  // ["人工智能", "AI", "机器学习", "深度学习", ...]

// 获取概念标签
List<String> conceptTags = expanded.getConceptTags();      // ["concept_ai", "concept_machine_learning", ...]

// 构建扩展查询字符串
String queryString = expander.buildExpandedQueryString("人工智能");
```

---

## Skills 定义

### Skill 概述

**Skill** 是一种将特定领域知识与搜索能力相结合的配置文件，用于指导 AI Agent 在不同场景下如何使用搜索工具。Skill 包含 Prompt 模板和工具调用流程定义。

**Skill 的核心价值：**
- **场景化配置**：为不同业务场景提供定制化的搜索能力
- **Prompt 模板**：提供预定义的提示词模板，指导 AI Agent 调用工具
- **任务编排**：支持多步骤的工具调用流程
- **零代码扩展**：通过配置文件扩展搜索能力，无需修改代码

### 内置 Skill 列表

| Skill 名称 | 文件路径 | 适用场景 |
| :--- | :--- | :--- |
| **ecommerce-skill** | skills/ecommerce-skill.md | 电商搜索、商品检索、价格对比 |
| **academic-skill** | skills/academic-skill.md | 学术搜索、论文检索、作者查找 |
| **rag-skill** | skills/rag-skill.md | RAG 问答、智能问答、知识库问答 |

### Skill 文件结构

每个 Skill 文件包含以下部分：

1. **概述**：Skill 的功能描述和定位
2. **适用场景**：该 Skill 适用的业务场景列表
3. **工具调用流程**：工具调用的顺序和逻辑
4. **Prompt 模板**：指导 AI Agent 调用工具的提示词模板

### 电商搜索 Skill 示例

**概述**：提供电商场景下的商品搜索能力，支持商品检索、价格筛选、分类导航等功能。

**适用场景**：
- 电商平台商品搜索
- 商品推荐
- 价格对比
- 商品分类浏览

**工具调用流程**：
```
用户查询 → SearchTool.search() → RerankTool.rerank() → 返回结果
```

**Prompt 模板**：
```
你是一个电商搜索助手。请根据用户的查询，使用搜索工具查找相关商品。

用户查询: {{query}}

请使用 search 工具搜索电商商品索引，索引名为 ecommerce_products，搜索字段包括 title、description、brand。
```

### 学术搜索 Skill 示例

**概述**：提供学术文献搜索能力，支持论文检索、作者查找、关键词分析等功能。

**适用场景**：
- 学术论文检索
- 研究文献查找
- 作者信息查询
- 科研趋势分析

**工具调用流程**：
```
用户查询 → SearchTool.search() → SuggestTool.relatedSearches() → RerankTool.rerank() → 返回结果
```

**Prompt 模板**：
```
你是一个学术搜索助手。请根据用户的查询，使用搜索工具查找相关学术论文。

用户查询: {{query}}

请使用 search 工具搜索学术论文索引，索引名为 academic_papers，搜索字段包括 title、abstract、authors。
```

### RAG 搜索 Skill 示例

**概述**：提供 Retrieval-Augmented Generation (RAG) 检索增强生成能力，支持智能问答、文档理解等场景。

**适用场景**：
- 智能问答系统
- 文档检索与理解
- 知识库问答
- 企业内部知识搜索

**工具调用流程**：
```
用户问题 → SearchTool.search() → RerankTool.rerank() → 生成回答 → 返回结果
```

**Prompt 模板**：
```
你是一个智能问答助手。请根据用户的问题，先使用搜索工具查找相关知识，然后基于搜索结果进行回答。

用户问题: {{question}}

搜索步骤：
1. 使用 search 工具查找相关文档
2. 如果需要，使用 rerank 工具优化结果
3. 基于搜索结果生成回答

请使用 search 工具搜索知识库索引，索引名为 knowledge_base。
```

### 创建自定义 Skill

要创建自定义 Skill，请按照以下步骤操作：

1. 在 `moer-search-skills/skills/` 目录下创建新的 markdown 文件
2. 按照以下结构编写内容：
   - **概述**：Skill 的功能描述
   - **适用场景**：该 Skill 适用的业务场景
   - **工具调用流程**：工具调用的顺序和逻辑
   - **Prompt 模板**：指导 AI Agent 调用工具的提示词模板
3. 定义 Prompt 模板时，可以使用以下变量：
   - `{{query}}`：用户查询内容
   - `{{question}}`：用户问题内容
   - `{{indexName}}`：索引名称

### Skill 使用示例

**电商搜索场景**：

用户输入："推荐一款性价比高的智能手机"

Skill 执行流程：
1. AI Agent 根据 Prompt 模板，调用 search 工具搜索 `ecommerce_products` 索引
2. 搜索关键词："智能手机"
3. 获取搜索结果后，调用 rerank 工具进行语义重排序
4. 返回排序后的商品列表

**学术搜索场景**：

用户输入："深度学习最新研究论文"

Skill 执行流程：
1. AI Agent 根据 Prompt 模板，调用 search 工具搜索 `academic_papers` 索引
2. 搜索关键词："深度学习"
3. 获取搜索结果后，调用 relatedSearches 获取相关搜索词
4. 根据相关搜索词扩展搜索
5. 调用 rerank 工具进行语义重排序
6. 返回排序后的论文列表

**RAG 问答场景**：

用户输入："什么是机器学习？"

Skill 执行流程：
1. AI Agent 根据 Prompt 模板，调用 search 工具搜索 `knowledge_base` 索引
2. 搜索关键词："机器学习"
3. 获取搜索结果后，调用 rerank 工具进行语义重排序
4. 基于搜索结果生成回答
5. 返回最终回答

---

## Web 管理平台

### 平台概述

**Moer Search Web** 是一个基于 React + TypeScript + Vite 构建的可视化管理平台，提供直观的界面来管理 Elasticsearch 索引、文档、本体和搜索验证。

**核心特性：**
- **可视化管理**：通过图形化界面管理索引和文档
- **实时监控**：实时展示集群状态和索引统计
- **搜索验证**：支持 SQL 和 DSL 查询验证
- **本体管理**：可视化管理概念和关系
- **AI 能力展示**：展示 MCP 和 Skills 的能力

### 功能模块

| 模块 | 功能描述 |
| :--- | :--- |
| **首页概览** | 展示集群状态、索引统计、搜索趋势 |
| **索引管理** | 创建、删除、查看索引，管理索引别名和设置 |
| **文档管理** | 添加、删除、更新、查询文档 |
| **本体管理** | 管理概念、关系和实例，可视化概念网络 |
| **搜索验证** | SQL/DSL 查询编辑器，验证搜索效果 |
| **模型配置** | 大模型参数配置和管理 |
| **AI能力展示** | MCP 工具和 Skills 的功能展示 |
| **API文档** | 在线 API 文档和测试 |
| **系统管理** | 系统配置和日志查看 |

### 启动方式

**开发模式：**

```bash
cd moer-search-web
npm install
npm run dev
```

**生产构建：**

```bash
cd moer-search-web
npm install
npm run build
npm start
```

**访问地址：** http://localhost:3000

**环境变量配置：**

| 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `MOER_SEARCH_SERVICE_URL` | http://localhost:8082 | 后端服务地址 |

---

## 配置参数

### 服务配置

| 参数名 | 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `server.port` | `SERVER_PORT` | 8082 | REST API 端口 |
| `grpc.server.port` | `GRPC_SERVER_PORT` | 19998 | gRPC 端口 |

### Elasticsearch 配置

| 参数名 | 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `spring.elasticsearch.bboss.elasticUser` | `ELASTICSEARCH_USERNAME` | elastic | ES 用户名 |
| `spring.elasticsearch.bboss.elasticPassword` | `ELASTICSEARCH_PASSWORD` | changeme | ES 密码 |
| `spring.elasticsearch.bboss.elasticsearch.rest.hostNames` | `ELASTICSEARCH_HOSTNAMES` | localhost:9200 | ES 地址 |

### MCP Server 配置

| 参数名 | 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `server.port` | `MCP_SERVER_PORT` | 8083 | MCP Server 端口 |

### 本体引擎配置

| 参数名 | 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `ontology.index.concept-index-prefix` | - | moer_ontology | 概念索引前缀 |
| `ontology.index.document-index-prefix` | - | moer_documents | 文档索引前缀 |
| `ontology.index.lifecycle-enabled` | - | true | 是否启用生命周期管理 |
| `ontology.index.hot-phase-days` | - | 30 | Hot阶段天数 |
| `ontology.index.warm-phase-days` | - | 90 | Warm阶段天数 |
| `ontology.index.cold-phase-days` | - | 180 | Cold阶段天数 |
| `ontology.index.delete-phase-days` | - | 365 | Delete阶段天数 |
| `ontology.index.shards` | - | 3 | 索引分片数 |
| `ontology.index.replicas` | - | 1 | 索引副本数 |

---

## Docker 部署

### 构建镜像

```bash
cd moer-search-service
docker build -t moer-search-service:1.0.0 .
```

### 运行容器

```bash
docker run -d \
  --name moer-search \
  -p 8082:8082 \
  -p 19998:19998 \
  -e ELASTICSEARCH_HOSTNAMES=elasticsearch:9200 \
  moer-search-service:1.0.0
```

### Docker Compose

```yaml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"

  moer-search:
    image: moer-search-service:1.0.0
    ports:
      - "8082:8082"
      - "19998:19998"
    environment:
      - ELASTICSEARCH_HOSTNAMES=elasticsearch:9200
    depends_on:
      - elasticsearch
```

---

## 代码规范

### Java 代码规范

- 使用 Lombok 注解简化代码
- 方法参数使用 `@Valid` 进行校验
- 异常处理使用全局异常处理器
- 日志使用 SLF4J

### Git 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | 说明 |
| :--- | :--- |
| feat | 新功能 |
| fix | 修复 Bug |
| docs | 文档更新 |
| style | 代码格式 |
| refactor | 代码重构 |

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交代码 (`git commit -am 'Add some feature'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

---

## 许可证

本项目采用 MIT 许可证，详情请参见 [LICENSE](LICENSE) 文件。

---

*Moer Search Service - 高性能分布式搜索引擎服务*
