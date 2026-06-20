# Moer Search - Intelligent Search Validation System

> **Next-generation enterprise AI search validation platform** - Integrated full-text search, vector semantics, ontology graph, and MCP agent protocol validation system

**🌐 Language Switch** | [English](README.en.md) | [中文](README.md) |

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Screenshots](#screenshots)
- [Development Guide](#development-guide)
- [License](#license)

---

## 🎯 Project Overview

**Moer Search** is a comprehensive enterprise-level search validation system with the following core capabilities:

| Capability | Description |
|------------|-------------|
| **Hybrid Search Engine** | Supports full-text search (BM25), vector search, and hybrid search modes |
| **Ontology Knowledge Graph** | Entity relationship management, SPARQL query, concept node visualization |
| **AI Intelligent QA** | Integrated LLM question answering, text analysis, entity extraction |
| **MCP Protocol Support** | Model Context Protocol agent tool calling |
| **Multi-Model Adaptation** | Supports Gemini, Qwen, DeepSeek, Claude and other LLMs |

---

## 🧩 Core Features

### 1. Dashboard
- Cluster status monitoring panel
- Real-time performance metrics
- Quick navigation

### 2. Index Manager
- Create/delete/close indexes
- Supports vector/fulltext/hybrid index types
- Shard and replica configuration
- Alias management

### 3. Document Manager
- Document CRUD operations
- Batch import/export
- Tag management

### 4. Search Validator
- Multi-mode search testing
- SQL/DSL query support
- AI-enhanced search
- Ontology-aware search

### 5. AI Abilities
- Intelligent question answering
- Text analysis (segmentation/keywords/summary)
- Entity extraction
- Multi-model comparison
- MCP tool invocation

### 6. Model Configuration
- Model registry management
- Parameter configuration (Temperature/TopP/MaxTokens)
- Safety settings

### 7. Ontology Graph
- Entity node management
- Relationship edge management
- SPARQL query execution
- Graph visualization

### 8. System Management
- Cluster status monitoring
- Log viewing
- External connection testing

### 9. API Documentation
- RESTful API documentation
- Interactive testing

---

## 🏗️ Technical Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend Framework** | React | 19.x |
| **Build Tool** | Vite | 6.x |
| **UI Framework** | TailwindCSS | 4.x |
| **Icon Library** | Lucide React | 0.546.x |
| **Backend** | Express | 4.x |
| **Language** | TypeScript | 5.x |
| **Database** | In-memory simulation (extensible) | - |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Moer Search Validation System                │
├─────────────────────────────────────────────────────────────────┤
│                        Frontend Layer                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Dashboard│ │IndexMgr │ │DocMgr  │ │Search   │ │AI       │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
├───────┼───────────┼───────────┼───────────┼───────────┼───────┤
│                        API Layer                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/indexes  /api/documents  /api/search  /api/ai    │   │
│  │  /api/ontologies  /api/model  /api/cluster  /api/mcp   │   │
│  └─────────────────────────────────────────────────────────┘   │
├───────┬─────────────────────────────────────────────────────────┤
│                     Service Layer                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │IndexService│  │DocService │  │SearchService││AIService │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
├───────┼─────────────────────────────────────────────────────────┤
│                     Data Layer                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ Indexes   │  │Documents  │  │Ontology  │  │ Models    │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.x
- **npm**: >= 10.x

### Installation

1. **Clone repository**
```bash
git clone https://gitee.com/moerjiaoyu/moer-search-web.git
cd moer-search-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env file and add GEMINI_API_KEY (optional)
```

4. **Start development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

6. **Start production server**
```bash
npm run start
```

### Access

- **Development**: http://localhost:3000
- **Production**: http://localhost:3000

---

## 📡 API Documentation

### Base Path

All API endpoints start with `/api/`.

### API Categories

#### 1. Index Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/indexes` | Get all indexes |
| POST | `/api/indexes` | Create new index |
| PUT | `/api/indexes/:id` | Update index configuration |
| DELETE | `/api/indexes/:id` | Delete index |
| POST | `/api/indexes/:id/action` | Execute index action (close/open/clear/delete) |
| POST | `/api/indexes/:id/alias` | Add/remove alias |
| POST | `/api/indexes/query` | Execute SQL/DSL query |

#### 2. Document Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/documents` | Get document list |
| POST | `/api/documents` | Save document (create/update) |
| POST | `/api/documents/batch` | Batch import documents |
| DELETE | `/api/documents/:id` | Delete document |

#### 3. Search Service

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | Execute search query |

#### 4. AI Abilities

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/qa` | Intelligent QA |
| POST | `/api/ai/text-analysis` | Text analysis |
| POST | `/api/ai/extract-entity` | Entity extraction |
| POST | `/api/ai/model-compare` | Multi-model comparison |

#### 5. Model Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/model/registry` | Get model registry |
| POST | `/api/model/registry` | Register new model |
| PUT | `/api/model/registry/:id` | Update model configuration |
| DELETE | `/api/model/registry/:id` | Delete model |
| GET | `/api/model/config` | Get global configuration |
| POST | `/api/model/config` | Update global configuration |
| POST | `/api/model/test-prompt` | Test prompt |

#### 6. Ontology Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ontologies` | Get ontology data |
| POST | `/api/ontologies/node` | Add entity node |
| POST | `/api/ontologies/edge` | Add relationship edge |
| DELETE | `/api/ontologies/node/:id` | Delete node |
| POST | `/api/ontologies/sparql` | Execute SPARQL query |

#### 7. MCP Tools

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp/tools` | Get available tools |
| POST | `/api/mcp/invoke` | Invoke tool |

#### 8. System Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cluster` | Get cluster status |
| GET | `/api/cluster/info` | Get cluster details |
| GET | `/api/logs` | Get system logs |
| POST | `/api/external/test-connection` | Test external connection |

### Request Examples

#### Create Index
```bash
curl -X POST http://localhost:3000/api/indexes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my_index",
    "type": "hybrid",
    "shards": 3,
    "replicas": 1,
    "fields": [
      {"name": "id", "type": "keyword", "searchable": true},
      {"name": "title", "type": "text", "searchable": true},
      {"name": "content", "type": "text", "searchable": true}
    ]
  }'
```

#### Execute Search
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "financial report",
    "searchType": "hybrid",
    "topK": 10,
    "isAiEnhance": true,
    "useOntology": true
  }'
```

#### AI Question Answering
```bash
curl -X POST http://localhost:3000/api/ai/qa \
  -H "Content-Type: application/json" \
  -d '{"question": "What is hybrid search?"}'
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Empty (optional) |
| `DISABLE_HMR` | Disable hot module replacement | false |
| `NODE_ENV` | Runtime environment | development |

### Configuration Files

- `.env` - Environment variables
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration

---

## 🖼️ Screenshots

### Dashboard
![Dashboard](docs/images/首页概览.png)

### Index Manager
![Index Manager-1](docs/images/索引管理-1.png)
![Index Manager-2](docs/images/索引管理-2.png)

### Document Manager
![Document Manager-1](docs/images/文档库管理-1.png)
![Document Manager-2](docs/images/文档库管理-2.png)
![Document Manager-3](docs/images/文档库管理-3.png)

### Search Validator
![Search Validator](docs/images/检索沙箱.png)

### AI Abilities
![AI Abilities-1](docs/images/AI场景验证-1.png)
![AI Abilities-2](docs/images/AI场景验证-2.png)
![AI Abilities-3](docs/images/AI场景验证-3.png)
![AI Abilities-4](docs/images/AI场景验证-4.png)

### Model Configuration
![Model Config-1](docs/images/大模型多维管理-1.png)
![Model Config-2](docs/images/大模型多维管理-2.png)

### Ontology Graph
![Ontology Graph-1](docs/images/本体概念网-1.png)
![Ontology Graph-2](docs/images/本体概念网-2.png)

### System Management
![System Management](docs/images/系统管理.png)

### API Documentation
![API Docs](docs/images/API在线交互.png)

---

## 🛠️ Development Guide

### Project Structure

```
moer-search-web/
├── src/
│   ├── components/          # UI Components
│   │   ├── DashboardView.tsx
│   │   ├── IndexMgrView.tsx
│   │   ├── DocumentMgrView.tsx
│   │   ├── SearchValidatorView.tsx
│   │   ├── AiAbilitiesView.tsx
│   │   ├── ModelConfigView.tsx
│   │   ├── OntologyView.tsx
│   │   ├── SystemView.tsx
│   │   └── ApiDocsView.tsx
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   └── types.ts             # Type definitions
├── server.ts               # Backend server
├── index.html              # HTML template
├── package.json            # Project configuration
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── LICENSE                 # License file
├── README.md               # Chinese documentation
├── README.en.md            # English documentation
└── .env.example           # Environment variables example
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Type checking |
| `npm run clean` | Clean build artifacts |

### Code Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Use TailwindCSS 4.x zero-config mode
- Component naming: PascalCase
- File naming: kebab-case

---

## 📜 License

Copyright 2026 Moer Labs Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## 🤝 Contributing

Welcome to submit issues and pull requests!

---

**Moer Search** - Making Search Smarter 🚀
