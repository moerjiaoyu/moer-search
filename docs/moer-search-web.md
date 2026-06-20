# Moer Search Web 管理平台

## 概述

**Moer Search Web** 是 Moer Search 搜索引擎服务的可视化管理平台，基于 React + TypeScript + Vite 技术栈构建。该平台提供直观的界面来管理 Elasticsearch 索引、文档、本体和搜索验证，是整个搜索系统的操作入口。

## 技术栈

| 技术 | 版本 | 说明 |
| :--- | :--- | :--- |
| React | 18.x | 前端框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 6.x | 构建工具 |
| Ant Design | 5.x | UI 组件库 |
| Node.js | 20.x | 后端服务 |
| Express | 4.x | HTTP 服务器 |

## 项目结构

```
moer-search-web/
├── package.json                     # 依赖配置
├── server.ts                        # Node.js 后端服务
├── vite.config.ts                   # Vite 构建配置
├── tsconfig.json                    # TypeScript 配置
├── index.html                       # HTML 入口
└── src/
    ├── main.tsx                     # 应用入口
    ├── App.tsx                      # 主应用组件
    ├── types.ts                     # TypeScript 类型定义
    ├── index.css                    # 全局样式
    └── components/                  # UI 组件
        ├── DashboardView.tsx        # 首页概览
        ├── IndexMgrView.tsx         # 索引管理
        ├── DocumentMgrView.tsx      # 文档管理
        ├── OntologyView.tsx         # 本体管理
        ├── SearchValidatorView.tsx  # 搜索验证
        ├── ModelConfigView.tsx      # 模型配置
        ├── AiAbilitiesView.tsx      # AI能力展示
        ├── ApiDocsView.tsx          # API文档
        └── SystemView.tsx           # 系统管理
```

## 功能模块

### 1. 首页概览 (DashboardView)

展示系统整体状态，包括：
- 集群健康状态
- 索引数量统计
- 文档总数
- 存储空间使用
- 搜索趋势图表

### 2. 索引管理 (IndexMgrView)

提供索引的完整生命周期管理：
- **索引列表**：展示所有索引的状态、文档数、存储大小
- **创建索引**：支持自定义分片数、副本数、字段映射
- **删除索引**：安全删除指定索引
- **索引详情**：查看索引的详细配置和状态
- **别名管理**：添加/移除索引别名

### 3. 文档管理 (DocumentMgrView)

文档级别的操作：
- **文档列表**：分页展示指定索引的文档
- **添加文档**：支持 JSON 格式的文档添加
- **更新文档**：编辑已有文档
- **删除文档**：删除指定文档
- **批量操作**：批量导入/导出文档

### 4. 本体管理 (OntologyView)

本体引擎的可视化管理：
- **概念管理**：创建、编辑、删除概念
- **关系管理**：管理概念之间的语义关系
- **实例管理**：管理概念的具体实例
- **概念网络**：可视化展示概念层次结构

### 5. 搜索验证 (SearchValidatorView)

搜索功能测试和验证：
- **SQL 查询**：支持 Elasticsearch SQL 查询
- **DSL 查询**：支持原生 DSL 查询
- **查询结果**：展示查询结果和执行时间
- **查询历史**：保存查询历史记录

### 6. 模型配置 (ModelConfigView)

大模型相关配置：
- **模型列表**：管理多个大模型配置
- **参数配置**：设置模型参数（temperature、top_p 等）
- **API 密钥管理**：安全管理 API 密钥

### 7. AI能力展示 (AiAbilitiesView)

展示 MCP 和 Skills 的能力：
- **MCP 工具**：展示注册的搜索工具
- **Skill 列表**：展示可用的 Skill 配置
- **工具调用演示**：演示工具的使用方法

### 8. API文档 (ApiDocsView)

在线 API 文档：
- **接口列表**：展示所有 REST API 接口
- **接口测试**：在线测试 API 接口
- **参数说明**：详细的参数说明

### 9. 系统管理 (SystemView)

系统级配置：
- **日志查看**：查看系统日志
- **配置管理**：管理系统配置
- **用户管理**：管理平台用户

## API 接口

### 索引管理接口

| 接口 | 方法 | 路径 |
| :--- | :--- | :--- |
| 获取索引列表 | GET | `/api/indexes` |
| 获取索引详情 | GET | `/api/indexes/:id` |
| 创建索引 | POST | `/api/indexes` |
| 删除索引 | DELETE | `/api/indexes/:id` |
| 添加别名 | POST | `/api/indexes/:id/alias` |

### 文档管理接口

| 接口 | 方法 | 路径 |
| :--- | :--- | :--- |
| 获取文档列表 | GET | `/api/documents?indexId=xxx` |
| 获取文档详情 | GET | `/api/documents/:id` |
| 添加文档 | POST | `/api/documents` |
| 更新文档 | PUT | `/api/documents/:id` |
| 删除文档 | DELETE | `/api/documents/:id` |

### 搜索接口

| 接口 | 方法 | 路径 |
| :--- | :--- | :--- |
| SQL 查询 | POST | `/api/indexes/query` |
| DSL 查询 | POST | `/api/indexes/query` |
| 全文搜索 | GET | `/api/search?q=xxx` |

## 配置说明

### 环境变量

| 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `MOER_SEARCH_SERVICE_URL` | http://localhost:8082 | 后端服务地址 |
| `PORT` | 3000 | 前端服务端口 |

### 配置文件

创建 `.env` 文件：

```env
MOER_SEARCH_SERVICE_URL=http://localhost:8082
PORT=3000
```

## 启动方式

### 开发模式

```bash
cd moer-search-web
npm install
npm run dev
```

访问：http://localhost:5173

### 生产构建

```bash
cd moer-search-web
npm install
npm run build
npm start
```

访问：http://localhost:3000

### 构建说明

- `npm run build`：构建前端静态资源到 `dist` 目录
- `npm start`：启动 Node.js 后端服务，同时提供静态文件服务

## 与后端服务集成

### 服务调用流程

1. **前端请求** → **Node.js 代理** → **moer-search-service**
2. **后端响应** → **Node.js 代理** → **前端展示**

### 代理配置

在 `server.ts` 中配置：

```typescript
const MOER_SEARCH_SERVICE_URL = process.env.MOER_SEARCH_SERVICE_URL || "http://localhost:8082";
```

### 数据转换

前端会对后端返回的数据进行格式转换，适配前端数据结构：

- 索引列表：合并真实 ES 索引和本地模拟数据
- 文档数据：统一字段命名和格式
- 错误处理：统一错误响应格式

## 安全说明

### 注意事项

1. **生产环境**：建议配置反向代理和 HTTPS
2. **API 密钥**：不要在前端代码中硬编码敏感信息
3. **跨域配置**：生产环境应限制允许的来源域名
4. **输入验证**：所有用户输入应进行严格验证

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case
- 使用 ES6+ 语法
- 遵循 React Hooks 规范

### 组件开发

新组件应遵循以下结构：

```tsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from 'antd';

interface ComponentProps {
  // 组件属性定义
}

const MyComponent: React.FC<ComponentProps> = (props) => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 数据获取逻辑
  }, []);
  
  return (
    <Card title="组件标题">
      {/* 组件内容 */}
    </Card>
  );
};

export default MyComponent;
```

## 许可证

本项目采用 MIT 许可证，详情请参见 LICENSE 文件。
