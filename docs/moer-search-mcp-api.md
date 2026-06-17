# Moer Search MCP - 模型上下文协议服务使用文档

## 概述

**moer-search-mcp** 是 moer-search 项目中的 MCP（Model Context Protocol）服务模块，为 AI Agent 提供标准化的搜索能力调用接口。MCP 是一种安全的插件协议，允许 AI Agent 通过标准协议调用外部工具和数据。

### 核心功能

| 工具名称 | 描述 |
|----------|------|
| **SearchTool** | 全文搜索工具，支持关键词搜索和复杂 DSL 查询 |
| **SuggestTool** | 搜索建议工具，提供搜索词补全和推荐 |
| **RerankTool** | 结果重排序工具，基于语义相似度重新排序搜索结果 |

### 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    AI Agent                            │
├─────────────────────────────────────────────────────────┤
│              MCP Protocol Layer                        │
│  (标准 MCP 协议通信)                                   │
├─────────────────────────────────────────────────────────┤
│              MoerMcpServer                             │
│  (MCP Server 启动类，注册所有工具)                      │
├─────────────────────────────────────────────────────────┤
│              Tools Layer                               │
│  SearchTool    SuggestTool    RerankTool              │
└─────────────────────────────────────────────────────────┘
```

### MCP 协议概述

MCP 协议允许 AI Agent 通过 JSON-RPC 调用外部工具。核心流程：

1. **工具发现**：Agent 发送 `describe` 请求获取工具列表
2. **工具调用**：Agent 发送 `invoke` 请求调用具体工具
3. **结果返回**：工具执行完成后返回 JSON 格式结果

---

## 二、注册的工具列表

| 工具名 | 组件名 | 功能描述 |
|--------|--------|----------|
| `search` | SearchTool | 全文搜索、DSL 查询 |
| `suggest` | SuggestTool | 搜索建议、热门搜索、相关搜索 |
| `rerank` | RerankTool | 语义重排序、多算法支持 |

---

## 三、工具详细说明

### 3.1 SearchTool - 搜索工具

提供基于 Elasticsearch 的全文搜索能力，支持关键词搜索和复杂查询条件。

**组件定义：** `@Component("search")`

#### 方法列表

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `search` | 执行全文搜索 | indexName, query, fields, pageNum, pageSize |
| `searchByDsl` | 执行 DSL 查询 | indexName, dsl |

#### 3.1.1 search 方法

**功能**：执行全文搜索

**参数说明：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `indexName` | String | 是 | - | 索引名称 |
| `query` | String | 是 | - | 搜索关键词 |
| `fields` | String | 否 | - | 搜索字段列表（逗号分隔） |
| `pageNum` | Integer | 否 | 1 | 页码（从1开始） |
| `pageSize` | Integer | 否 | 10 | 每页大小 |

**返回结果：**

```json
{
    "success": true,
    "data": [
        {
            "id": "doc-1",
            "title": "搜索结果标题",
            "content": "搜索结果内容",
            "score": 0.95
        }
    ],
    "total": 100,
    "message": "Search successful"
}
```

**MCP 调用示例：**

```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "invoke",
    "params": {
        "tool_name": "search",
        "method_name": "search",
        "args": {
            "indexName": "actors",
            "query": "吴京",
            "fields": "actor_chName,actor_repWorks",
            "pageNum": 1,
            "pageSize": 10
        }
    }
}
```

#### 3.1.2 searchByDsl 方法

**功能**：执行 DSL 查询

**参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `indexName` | String | 是 | 索引名称 |
| `dsl` | String | 是 | DSL 查询语句（JSON 格式字符串） |

**返回结果：**

```json
{
    "success": true,
    "data": [...],
    "total": 50,
    "message": "DSL search successful"
}
```

**MCP 调用示例：**

```json
{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "invoke",
    "params": {
        "tool_name": "search",
        "method_name": "searchByDsl",
        "args": {
            "indexName": "actors",
            "dsl": "{\"query\":{\"match\":{\"actor_chName\":\"吴京\"}},\"size\":10}"
        }
    }
}
```

---

### 3.2 SuggestTool - 搜索建议工具

提供搜索词建议和自动补全功能，帮助用户输入更准确的搜索词。

**组件定义：** `@Component("suggest")`

#### 方法列表

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `suggest` | 获取搜索建议 | prefix, count |
| `hotSearches` | 获取热门搜索词 | count |
| `relatedSearches` | 获取相关搜索词 | query, count |

#### 3.2.1 suggest 方法

**功能**：根据前缀获取搜索建议

**参数说明：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `prefix` | String | 是 | - | 搜索词前缀 |
| `count` | Integer | 否 | 10 | 返回建议数量 |

**返回结果：**

```json
{
    "success": true,
    "data": ["人工智能", "人类", "人民", "人才"],
    "message": "获取搜索建议成功"
}
```

**MCP 调用示例：**

```json
{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "invoke",
    "params": {
        "tool_name": "suggest",
        "method_name": "suggest",
        "args": {
            "prefix": "人工",
            "count": 5
        }
    }
}
```

#### 3.2.2 hotSearches 方法

**功能**：获取当前热门搜索词

**参数说明：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `count` | Integer | 否 | 10 | 返回数量 |

**返回结果：**

```json
{
    "success": true,
    "data": ["人工智能", "大数据", "云计算", "机器学习"],
    "message": "获取热门搜索词成功"
}
```

**MCP 调用示例：**

```json
{
    "jsonrpc": "2.0",
    "id": "4",
    "method": "invoke",
    "params": {
        "tool_name": "suggest",
        "method_name": "hotSearches",
        "args": {
            "count": 5
        }
    }
}
```

#### 3.2.3 relatedSearches 方法

**功能**：获取相关搜索词

**参数说明：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `query` | String | 是 | - | 当前搜索词 |
| `count` | Integer | 否 | 10 | 返回数量 |

**返回结果：**

```json
{
    "success": true,
    "data": ["机器学习", "深度学习", "神经网络", "AI"],
    "message": "获取相关搜索词成功"
}
```

**支持的相关搜索映射：**

| 查询词 | 相关搜索词 |
|--------|------------|
| 人工智能 | 机器学习、深度学习、神经网络、AI、自然语言处理 |
| 大数据 | 数据分析、数据挖掘、数据可视化、Hadoop、Spark |
| 云计算 | 云服务、AWS、阿里云、云原生、Serverless |

**MCP 调用示例：**

```json
{
    "jsonrpc": "2.0",
    "id": "5",
    "method": "invoke",
    "params": {
        "tool_name": "suggest",
        "method_name": "relatedSearches",
        "args": {
            "query": "人工智能",
            "count": 5
        }
    }
}
```

---

### 3.3 RerankTool - 重排序工具

提供搜索结果的语义重排序能力，基于查询与文档的语义相似度重新排序结果。

**组件定义：** `@Component("rerank")`

#### 方法列表

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `rerank` | 重排序搜索结果 | query, documents, topN, algorithm |

#### 3.3.1 rerank 方法

**功能**：基于语义相似度重新排序搜索结果

**参数说明：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `query` | String | 是 | - | 搜索查询词 |
| `documents` | List\<Map\> | 是 | - | 待排序的文档列表 |
| `topN` | Integer | 否 | - | 返回前N个结果 |
| `algorithm` | String | 否 | semantic | 排序算法 |

**支持的排序算法：**

| 算法名 | 说明 |
|--------|------|
| `semantic` | 语义相似度排序（默认） |
| `bm25` | BM25 算法排序 |
| `hybrid` | 混合排序（语义60% + BM25 40%） |

**返回结果：**

```json
{
    "success": true,
    "data": [
        {
            "title": "机器学习入门指南",
            "content": "...",
            "score": 0.95
        }
    ],
    "algorithm": "semantic",
    "message": "重排序成功"
}
```

**MCP 调用示例：**

```json
{
    "jsonrpc": "2.0",
    "id": "6",
    "method": "invoke",
    "params": {
        "tool_name": "rerank",
        "method_name": "rerank",
        "args": {
            "query": "人工智能",
            "documents": [
                {"title": "机器学习入门指南", "content": "...", "score": 0.8},
                {"title": "深度学习实战", "content": "...", "score": 0.75},
                {"title": "大数据分析", "content": "...", "score": 0.7}
            ],
            "topN": 5,
            "algorithm": "semantic"
        }
    }
}
```

---

## 四、MCP 协议交互流程

### 4.1 工具发现

**请求：**
```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "describe"
}
```

**响应：**
```json
{
    "jsonrpc": "2.0",
    "id": "1",
    "result": {
        "tools": [
            {
                "name": "search",
                "description": "全文搜索工具，支持关键词搜索和复杂查询",
                "methods": [
                    {"name": "search", "description": "执行全文搜索"},
                    {"name": "searchByDsl", "description": "执行DSL查询"}
                ]
            },
            {
                "name": "suggest",
                "description": "搜索建议工具，提供搜索词补全和推荐",
                "methods": [
                    {"name": "suggest", "description": "获取搜索建议"},
                    {"name": "hotSearches", "description": "获取热门搜索词"},
                    {"name": "relatedSearches", "description": "获取相关搜索词"}
                ]
            },
            {
                "name": "rerank",
                "description": "结果重排序工具，基于语义相似度重新排序搜索结果",
                "methods": [
                    {"name": "rerank", "description": "重排序搜索结果"}
                ]
            }
        ]
    }
}
```

### 4.2 工具调用

**请求：**
```json
{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "invoke",
    "params": {
        "tool_name": "<工具名>",
        "method_name": "<方法名>",
        "args": {
            "<参数名>": "<参数值>"
        }
    }
}
```

**成功响应：**
```json
{
    "jsonrpc": "2.0",
    "id": "2",
    "result": {
        "success": true,
        "data": [...],
        "message": "操作成功"
    }
}
```

**失败响应：**
```json
{
    "jsonrpc": "2.0",
    "id": "2",
    "result": {
        "success": false,
        "message": "操作失败: 错误信息"
    }
}
```

---

## 五、使用示例

### 5.1 完整搜索流程示例

```json
// 1. 获取搜索建议
{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "invoke",
    "params": {
        "tool_name": "suggest",
        "method_name": "suggest",
        "args": {"prefix": "人工", "count": 5}
    }
}

// 2. 执行搜索
{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "invoke",
    "params": {
        "tool_name": "search",
        "method_name": "search",
        "args": {"indexName": "articles", "query": "人工智能", "pageSize": 20}
    }
}

// 3. 重排序结果
{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "invoke",
    "params": {
        "tool_name": "rerank",
        "method_name": "rerank",
        "args": {
            "query": "人工智能",
            "documents": [...],
            "topN": 10,
            "algorithm": "hybrid"
        }
    }
}
```

### 5.2 代码示例（Java）

```java
import com.moer.search.mcp.tools.SearchTool;
import com.moer.search.mcp.tools.SuggestTool;
import com.moer.search.mcp.tools.RerankTool;

public class McpUsageExample {
    
    public static void main(String[] args) {
        // 创建工具实例
        SearchTool searchTool = new SearchTool();
        SuggestTool suggestTool = new SuggestTool();
        RerankTool rerankTool = new RerankTool();
        
        // 1. 获取搜索建议
        Map<String, Object> suggestions = suggestTool.suggest("人工", 5);
        System.out.println("搜索建议: " + suggestions.get("data"));
        
        // 2. 执行搜索
        Map<String, Object> searchResult = searchTool.search("articles", "人工智能", null, 1, 10);
        System.out.println("搜索结果数量: " + searchResult.get("total"));
        
        // 3. 重排序
        List<Map<String, Object>> documents = (List) searchResult.get("data");
        Map<String, Object> reranked = rerankTool.rerank("人工智能", documents, 5, "semantic");
        System.out.println("重排序结果: " + reranked.get("data"));
    }
}
```

---

## 六、配置说明

### 6.1 pom.xml 依赖

```xml
<dependencies>
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- MCP Protocol (需要添加对应的 MCP 协议依赖) -->
    <!-- <dependency>
        <groupId>com.mcp</groupId>
        <artifactId>mcp-core</artifactId>
        <version>1.0.0</version>
    </dependency> -->
</dependencies>
```

### 6.2 application.yml

```yaml
server:
  port: 8084

spring:
  application:
    name: moer-search-mcp

# MCP 配置
mcp:
  host: 0.0.0.0
  port: 8084
  timeout: 30000
```

### 6.3 启动方式

**方式一：运行主类**

```java
public static void main(String[] args) {
    SpringApplication.run(MoerMcpServer.class, args);
}
```

**方式二：Maven 运行**

```bash
cd moer-search-mcp
mvn spring-boot:run
```

---

## 七、工具能力矩阵

| 工具 | 方法 | 输入参数 | 输出结果 |
|------|------|----------|----------|
| search | search | indexName, query, fields, pageNum, pageSize | 搜索结果列表 + 总数 |
| search | searchByDsl | indexName, dsl | 搜索结果列表 + 总数 |
| suggest | suggest | prefix, count | 搜索建议列表 |
| suggest | hotSearches | count | 热门搜索词列表 |
| suggest | relatedSearches | query, count | 相关搜索词列表 |
| rerank | rerank | query, documents, topN, algorithm | 重排序结果列表 |

---

## 八、代码文件位置

| 文件 | 路径 |
|------|------|
| MoerMcpServer | [moer-search-mcp/src/main/java/com/moer/search/mcp/MoerMcpServer.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-mcp/src/main/java/com/moer/search/mcp/MoerMcpServer.java) |
| SearchTool | [moer-search-mcp/src/main/java/com/moer/search/mcp/tools/SearchTool.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-mcp/src/main/java/com/moer/search/mcp/tools/SearchTool.java) |
| SuggestTool | [moer-search-mcp/src/main/java/com/moer/search/mcp/tools/SuggestTool.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-mcp/src/main/java/com/moer/search/mcp/tools/SuggestTool.java) |
| RerankTool | [moer-search-mcp/src/main/java/com/moer/search/mcp/tools/RerankTool.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-mcp/src/main/java/com/moer/search/mcp/tools/RerankTool.java) |

---

## 附录：MCP 协议规范

### JSON-RPC 格式

所有请求和响应遵循 JSON-RPC 2.0 规范：

**请求格式：**
```json
{
    "jsonrpc": "2.0",
    "id": "<请求ID>",
    "method": "<方法名>",
    "params": {
        "tool_name": "<工具名>",
        "method_name": "<方法名>",
        "args": {...}
    }
}
```

**响应格式：**
```json
{
    "jsonrpc": "2.0",
    "id": "<请求ID>",
    "result": {...}
}
```

### 错误响应格式

```json
{
    "jsonrpc": "2.0",
    "id": "<请求ID>",
    "error": {
        "code": <错误码>,
        "message": "<错误消息>",
        "data": "<附加数据>"
    }
}
```
