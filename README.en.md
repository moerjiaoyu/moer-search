# Moer Search Service

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java Version](https://img.shields.io/badge/java-11-blue.svg)](https://www.oracle.com/java/technologies/downloads/#java11)
[![Spring Boot Version](https://img.shields.io/badge/spring--boot-2.7.16-blue.svg)](https://spring.io/projects/spring-boot)

**语言版本 / Language Version:**  
- [中文](README.md) | [English](README.en.md)

Moer Search is a distributed search engine service based on Spring Boot and Elasticsearch, providing RESTful API and gRPC interfaces for index management and document operations, with support for MCP (Model Context Protocol) and Ontology Engine capabilities.

---

## Table of Contents

- [Introduction](#introduction)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Requirements](#requirements)
  - [Configuration](#configuration)
  - [Build Project](#build-project)
  - [Run Service](#run-service)
- [API Interface](#api-interface)
  - [Index Management](#index-management)
  - [Document Operations](#document-operations)
- [gRPC Interface](#grpc-interface)
- [MCP Server](#mcp-server)
  - [MCP Overview](#mcp-overview)
  - [Registered Tools](#registered-tools)
  - [Tool Details](#tool-details)
  - [MCP Tool Usage Examples](#mcp-tool-usage-examples)
  - [Run MCP Server](#run-mcp-server)
- [Ontology Engine](#ontology-engine)
  - [Ontology Overview](#ontology-overview)
  - [Core Components](#core-components)
  - [Reasoning Capabilities](#reasoning-capabilities)
  - [Index Management](#index-management-1)
  - [Query Expansion](#query-expansion)
- [Skills Definition](#skills-definition)
  - [Skill Overview](#skill-overview)
  - [Built-in Skills](#built-in-skills)
  - [Skill File Structure](#skill-file-structure)
  - [Create Custom Skill](#create-custom-skill)
- [Configuration Parameters](#configuration-parameters)
- [Docker Deployment](#docker-deployment)
- [Code Standards](#code-standards)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

Moer Search is a high-performance distributed search engine service built on Spring Boot 2.7.x and BBoss Elasticsearch client. This service provides complete Elasticsearch index and document management functionality, accessible via both RESTful API and gRPC, with MCP support and ontology reasoning capabilities.

### Main Features

| Module | Feature |
| :--- | :--- |
| **Index Management** | Create, delete, update, close, open indexes |
| **Document Operations** | Add, delete, update, query documents |
| **Batch Operations** | Batch add, delete, update documents |
| **DSL Query** | Support complex Elasticsearch DSL queries |
| **Alias Management** | Add, remove index aliases |
| **gRPC Support** | Provide high-performance gRPC interface |
| **MCP Support** | Provide search tools callable by AI Agents |
| **Ontology Engine** | Provide concept reasoning and semantic expansion capabilities |
| **Index Lifecycle** | Automatically create and manage index lifecycle policies |

---

## Technology Stack

| Technology | Version | Description |
| :--- | :--- | :--- |
| Java | 11 | Programming Language |
| Spring Boot | 2.7.16 | Application Framework |
| BBoss Elasticsearch | 7.1.3 | Elasticsearch Client |
| gRPC | 1.58.0 | High-performance RPC Framework |
| Protocol Buffers | 3.24.0 | Data Serialization |
| Knife4j | 3.0.3 | API Documentation Tool |
| Hutool | 5.8.3 | Java Utility Library |
| FastJSON2 | 2.0.32 | JSON Processing Library |
| Lombok | 1.18.x | Code Simplification Tool |

---

## Project Structure

```
moer-search/
├── pom.xml                              # Parent Maven Configuration
├── moer-search-api/                     # API Module (gRPC Definitions)
│   ├── pom.xml
│   └── src/main/proto/                  # Protocol Buffers Definition Files
│       └── com/moer/search/             # gRPC Message Definitions
├── moer-search-service/                 # Business Service Implementation Module
│   ├── pom.xml
│   ├── config/application.yml           # Configuration File (External)
│   ├── Dockerfile                       # Docker Image Build File
│   └── src/main/java/com/moer/search/
│       ├── MoerSearchApplication.java   # Application Entry
│       ├── aspect/                      # AOP Aspects
│       ├── config/                      # Configuration Classes
│       ├── controller/                  # REST Controllers
│       ├── entity/                      # Entity Classes
│       ├── enums/                       # Enumeration Classes
│       ├── grpc/                        # gRPC Service Implementations
│       ├── handler/                     # Exception Handlers
│       ├── service/                     # Service Interfaces
│       ├── service/impl/                # Service Implementations
│       └── utils/                       # Utility Classes
├── moer-search-mcp/                     # MCP Server Module
│   ├── pom.xml
│   └── src/main/java/com/moer/search/mcp/
│       ├── MoerMcpServer.java           # MCP Server Entry
│       ├── tools/                       # MCP Tool Definitions
│       │   ├── SearchTool.java          # Search Tool
│       │   ├── SuggestTool.java         # Suggest Tool
│       │   └── RerankTool.java          # Rerank Tool
│       └── handlers/                    # Tool Handlers
│           └── SearchHandler.java       # Search Handler
├── moer-search-ontology/                # Ontology Engine Module (New)
│   ├── pom.xml
│   └── src/main/java/com/moer/search/ontology/
│       ├── MoerOntologyEngine.java      # Ontology Engine Core
│       ├── model/                       # Model Definitions
│       │   ├── Concept.java             # Concept Definition
│       │   ├── Relation.java            # Relation Definition
│       │   └── Instance.java            # Instance Data
│       ├── reasoner/                    # Reasoners
│       │   ├── SubclassReasoner.java    # Subclass Reasoning
│       │   ├── TransitiveReasoner.java  # Transitive Reasoning
│       │   └── RuleReasoner.java        # Rule Reasoning
│       ├── storage/                     # Storage Layer
│       │   └── OntologyStore.java       # Ontology Storage
│       ├── index/                       # Index Management
│       │   ├── OntologyIndexManager.java # Index Manager
│       │   └── ElasticsearchClientWrapper.java # ES Client Wrapper
│       ├── config/                      # Configuration Classes
│       │   └── OntologyIndexProperties.java # Index Configuration
│       └── integration/                 # Integration Module
│           └── QueryExpander.java       # Query Expander
└── moer-search-skills/                  # Skills Definition Module
    ├── README.md
    └── skills/
        ├── ecommerce-skill.md           # E-commerce Search Skill
        ├── academic-skill.md            # Academic Search Skill
        └── rag-skill.md                 # RAG Search Skill
```

---

## Quick Start

### Requirements

- JDK 11+
- Maven 3.6+
- Elasticsearch 7.x (Recommended 7.17.x)

### Configuration

Modify configuration file `moer-search-service/config/application.yml`:

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

### Build Project

```bash
cd moer-search
mvn clean package -DskipTests
```

### Run Service

```bash
cd moer-search-service
mvn spring-boot:run
```

---

## API Interface

Access API documentation after service startup: http://localhost:8082/doc.html

### Index Management

| Interface | Method | Path |
| :--- | :--- | :--- |
| Get Index List | GET | `/v1/api/index/indices` |
| Get Index Detail | GET | `/v1/api/index/{indexName}` |
| Create Index | POST | `/v1/api/index` |
| Update Index | PUT | `/v1/api/index/{indexName}` |
| Delete Index | DELETE | `/v1/api/index/{indexName}` |

### Document Operations

| Interface | Method | Path |
| :--- | :--- | :--- |
| Get Document | GET | `/v1/api/documents/{indexName}/{id}` |
| Add Document | POST | `/v1/api/documents/{indexName}` |
| Update Document | PUT | `/v1/api/documents/{indexName}/{id}` |
| Delete Document | DELETE | `/v1/api/documents/{indexName}/{id}` |
| DSL Search | POST | `/v1/api/documents/{indexName}/search` |

---

## gRPC Interface

The project provides two gRPC services:
1. **EsIndexService** - Index Management Service
2. **EsDocumentService** - Document Operations Service

### Usage Example

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

### MCP Overview

**MCP (Model Context Protocol)** is a standardized plugin protocol that allows AI Agents to call external tools and data through standard protocols. Moer Search MCP Server encapsulates search capabilities into standardized tools for AI Agent use.

### Registered Tools

| Tool Name | Class Name | Description |
| :--- | :--- | :--- |
| `search` | SearchTool | Full-text search tool, supports keyword search and DSL query |
| `suggest` | SuggestTool | Search suggestion tool, provides prefix suggestions, hot searches, related searches |
| `rerank` | RerankTool | Result reordering tool, reorders based on semantic similarity |

### Tool Details

#### SearchTool

**Method List:**

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `search` | `indexName`, `query`, `fields`, `pageNum`, `pageSize` | Execute full-text search |
| `searchByDsl` | `indexName`, `dsl` | Execute DSL query |

**Response Structure:**

```json
{
  "success": true,
  "data": [{"id": "doc-1", "title": "...", "content": "...", "score": 0.95}],
  "total": 100,
  "message": "Search successful"
}
```

#### SuggestTool

**Method List:**

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `suggest` | `prefix`, `count` | Get prefix suggestions |
| `hotSearches` | `count` | Get hot searches |
| `relatedSearches` | `query`, `count` | Get related searches |

#### RerankTool

**rerank Method Parameters:**

| Parameter | Description |
| :--- | :--- |
| `query` | Search query |
| `documents` | Document list to reorder |
| `topN` | Return top N results |
| `algorithm` | Ranking algorithm (semantic/bm25/hybrid) |

**Supported Ranking Algorithms:**

| Algorithm | Description |
| :--- | :--- |
| `semantic` | Semantic similarity based ranking |
| `bm25` | BM25 algorithm based ranking |
| `hybrid` | Hybrid ranking (60% semantic + 40% BM25) |

### MCP Tool Usage Examples

**Using SearchTool:**

```java
SearchTool searchTool = new SearchTool();
Map<String, Object> result = searchTool.search(
    "ecommerce_products",
    "smartphone",
    "title,description",
    1,
    10
);
```

**Using SuggestTool:**

```java
SuggestTool suggestTool = new SuggestTool();
Map<String, Object> suggestions = suggestTool.suggest("artificial intelligence", 5);
```

**Using RerankTool:**

```java
RerankTool rerankTool = new RerankTool();
List<Map<String, Object>> documents = new ArrayList<>();
documents.add(Map.of("id", "doc-1", "title", "AI Introduction", "content", "..."));
Map<String, Object> result = rerankTool.rerank("deep learning", documents, 5, "semantic");
```

### Run MCP Server

```bash
cd moer-search-mcp
mvn spring-boot:run
```

---

## Ontology Engine

### Ontology Overview

**Ontology Engine** provides concept reasoning and semantic expansion capabilities, supporting knowledge graph construction and reasoning. The ontology engine enables more intelligent search by understanding relationships between concepts to expand queries.

### Core Components

| Component | Description |
| :--- | :--- |
| **MoerOntologyEngine** | Ontology engine core, manages concepts, relations, and instances |
| **Concept** | Concept model representing entities, attributes, events in domain knowledge |
| **Relation** | Relation model representing semantic associations between concepts |
| **Instance** | Instance model representing specific instances of concepts |
| **OntologyStore** | Ontology storage layer managing persistence of concepts, relations, and instances |

### Reasoning Capabilities

The ontology engine provides three types of reasoning capabilities:

#### 1. Subclass Reasoning
- Get direct/indirect subclasses
- Get direct/indirect superclasses
- Determine inheritance relationships
- Build concept hierarchy

#### 2. Transitive Reasoning
- Compute transitive closure
- Determine transitive relationships
- Find relation paths
- Get ancestor/descendant concepts

#### 3. Rule Reasoning
- Transitive property rules
- Inverse relation rules
- Subclass inheritance rules
- Part-whole transitivity rules
- Instance classification rules

### Index Management

The ontology engine supports index lifecycle management:

**Ontology Concept Index (moer_ontology_yyyyMM)**
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

**Document Index (moer_documents_yyyyMM)**
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

**Lifecycle Policy:**

| Phase | Days | Action |
| :--- | :--- | :--- |
| Hot | 0-30 | High priority (100) |
| Warm | 30-90 | Medium priority (50), shrink to 1 shard |
| Cold | 90-180 | Low priority (25), freeze index |
| Delete | 180-365 | Auto delete |

### Query Expansion

The **QueryExpander** component performs semantic query expansion based on ontology:

```java
QueryExpander expander = new QueryExpander(ontologyEngine);
QueryExpander.ExpandedQuery expanded = expander.expandQuery("artificial intelligence");

// Get expanded query terms
List<String> expandedTerms = expanded.getExpandedTerms();  // ["artificial intelligence", "AI", "machine learning", "deep learning", ...]

// Get concept tags
List<String> conceptTags = expanded.getConceptTags();      // ["concept_ai", "concept_machine_learning", ...]

// Build expanded query string
String queryString = expander.buildExpandedQueryString("artificial intelligence");
```

---

## Skills Definition

### Skill Overview

**Skill** is a configuration file that combines domain-specific knowledge with search capabilities to guide AI Agents on how to use search tools in different scenarios. Skill includes Prompt templates and tool calling flow definitions.

**Core Values of Skill:**
- **Scenario-based Configuration**: Provide customized search capabilities for different business scenarios
- **Prompt Templates**: Provide predefined prompt templates to guide AI Agent tool usage
- **Task Orchestration**: Support multi-step tool calling flows
- **Zero-code Extension**: Extend search capabilities through configuration files without code modification

### Built-in Skills

| Skill Name | File Path | Scenario |
| :--- | :--- | :--- |
| **ecommerce-skill** | skills/ecommerce-skill.md | E-commerce search, product retrieval, price comparison |
| **academic-skill** | skills/academic-skill.md | Academic search, paper retrieval, author lookup |
| **rag-skill** | skills/rag-skill.md | RAG Q&A, intelligent Q&A, knowledge base |

### Skill File Structure

Each Skill file contains the following sections:

1. **Overview**: Skill's functional description and positioning
2. **Scenarios**: List of business scenarios applicable to this Skill
3. **Tool Calling Flow**: Order and logic of tool calls
4. **Prompt Template**: Prompt template that guides AI Agent to call tools

### E-commerce Search Skill Example

**Overview**: Provides product search capabilities in e-commerce scenarios, supporting product retrieval, price filtering, category navigation, etc.

**Scenarios**:
- E-commerce platform product search
- Product recommendation
- Price comparison
- Category browsing

**Tool Calling Flow**:
```
User Query → SearchTool.search() → RerankTool.rerank() → Return Results
```

**Prompt Template**:
```
You are an e-commerce search assistant. Please use the search tool to find relevant products based on the user's query.

User Query: {{query}}

Please use the search tool to search the e-commerce product index. The index name is ecommerce_products, and search fields include title, description, and brand.
```

### Academic Search Skill Example

**Overview**: Provides academic literature search capabilities, supporting paper retrieval, author lookup, keyword analysis, etc.

**Scenarios**:
- Academic paper retrieval
- Research literature search
- Author information query
- Research trend analysis

**Tool Calling Flow**:
```
User Query → SearchTool.search() → SuggestTool.relatedSearches() → RerankTool.rerank() → Return Results
```

**Prompt Template**:
```
You are an academic search assistant. Please use the search tool to find relevant academic papers based on the user's query.

User Query: {{query}}

Please use the search tool to search the academic paper index. The index name is academic_papers, and search fields include title, abstract, and authors.
```

### RAG Search Skill Example

**Overview**: Provides Retrieval-Augmented Generation (RAG) capabilities, supporting intelligent Q&A, document understanding, etc.

**Scenarios**:
- Intelligent Q&A systems
- Document retrieval and understanding
- Knowledge base Q&A
- Enterprise internal knowledge search

**Tool Calling Flow**:
```
User Question → SearchTool.search() → RerankTool.rerank() → Generate Answer → Return Results
```

**Prompt Template**:
```
You are an intelligent Q&A assistant. Please first use the search tool to find relevant knowledge based on the user's question, then generate an answer based on the search results.

User Question: {{question}}

Search Steps:
1. Use search tool to find relevant documents
2. If needed, use rerank tool to optimize results
3. Generate answer based on search results

Please use the search tool to search the knowledge base index. The index name is knowledge_base.
```

### Create Custom Skill

To create a custom Skill, follow these steps:

1. Create a new markdown file in `moer-search-skills/skills/` directory
2. Write content according to the following structure:
   - **Overview**: Skill's functional description
   - **Scenarios**: Business scenarios applicable to this Skill
   - **Tool Calling Flow**: Order and logic of tool calls
   - **Prompt Template**: Prompt template guiding AI Agent to call tools
3. When defining Prompt templates, you can use the following variables:
   - `{{query}}`: User query content
   - `{{question}}`: User question content
   - `{{indexName}}`: Index name

### Skill Usage Examples

**E-commerce Search Scenario:**

User Input: "Recommend a cost-effective smartphone"

Skill Execution Flow:
1. AI Agent calls search tool to search `ecommerce_products` index based on Prompt template
2. Search keyword: "smartphone"
3. After getting search results, call rerank tool for semantic reordering
4. Return reordered product list

**Academic Search Scenario:**

User Input: "Latest research papers on deep learning"

Skill Execution Flow:
1. AI Agent calls search tool to search `academic_papers` index based on Prompt template
2. Search keyword: "deep learning"
3. After getting search results, call relatedSearches to get related search terms
4. Expand search based on related search terms
5. Call rerank tool for semantic reordering
6. Return reordered paper list

**RAG Q&A Scenario:**

User Input: "What is machine learning?"

Skill Execution Flow:
1. AI Agent calls search tool to search `knowledge_base` index based on Prompt template
2. Search keyword: "machine learning"
3. After getting search results, call rerank tool for semantic reordering
4. Generate answer based on search results
5. Return final answer

---

## Configuration Parameters

### Service Configuration

| Parameter | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| `server.port` | `SERVER_PORT` | 8082 | REST API Port |
| `grpc.server.port` | `GRPC_SERVER_PORT` | 19998 | gRPC Port |

### Elasticsearch Configuration

| Parameter | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| `spring.elasticsearch.bboss.elasticUser` | `ELASTICSEARCH_USERNAME` | elastic | ES Username |
| `spring.elasticsearch.bboss.elasticPassword` | `ELASTICSEARCH_PASSWORD` | changeme | ES Password |
| `spring.elasticsearch.bboss.elasticsearch.rest.hostNames` | `ELASTICSEARCH_HOSTNAMES` | localhost:9200 | ES Address |

### MCP Server Configuration

| Parameter | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| `server.port` | `MCP_SERVER_PORT` | 8083 | MCP Server Port |

### Ontology Engine Configuration

| Parameter | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| `ontology.index.concept-index-prefix` | - | moer_ontology | Concept index prefix |
| `ontology.index.document-index-prefix` | - | moer_documents | Document index prefix |
| `ontology.index.lifecycle-enabled` | - | true | Enable lifecycle management |
| `ontology.index.hot-phase-days` | - | 30 | Hot phase days |
| `ontology.index.warm-phase-days` | - | 90 | Warm phase days |
| `ontology.index.cold-phase-days` | - | 180 | Cold phase days |
| `ontology.index.delete-phase-days` | - | 365 | Delete phase days |
| `ontology.index.shards` | - | 3 | Index shards |
| `ontology.index.replicas` | - | 1 | Index replicas |

---

## Docker Deployment

### Build Image

```bash
cd moer-search-service
docker build -t moer-search-service:1.0.0 .
```

### Run Container

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

## Code Standards

### Java Code Standards

- Use Lombok annotations to simplify code
- Use `@Valid` for method parameter validation
- Use global exception handler for exception handling
- Use SLF4J for logging

### Git Commit Standards

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | Description |
| :--- | :--- |
| feat | New feature |
| fix | Bug fix |
| docs | Documentation update |
| style | Code formatting |
| refactor | Code refactoring |

---

## Contributing

1. Fork this repository
2. Create feature branch (`git checkout -b feature/xxx`)
3. Commit changes (`git commit -am 'Add some feature'`)
4. Push to branch (`git push origin feature/xxx`)
5. Create Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

*Moer Search Service - High Performance Distributed Search Engine Service*
