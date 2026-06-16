# Moer Search Service API 使用文档

## 概述

moer-search-service 提供 Elasticsearch 的 REST API 接口，包含索引管理和文档操作两大模块：

- **EsDocumentController**: 文档数据管理接口（增删改查、批量操作、SQL查询）
- **EsIndexController**: 索引管理接口（创建、删除、更新、别名管理）

---

## 基础信息

| 属性 | 值 |
|------|-----|
| **服务端口** | 8082 |
| **API 前缀** | `/v1/api` |
| **Swagger 文档** | `http://localhost:8082/doc.html` |

---

## 一、EsDocumentController - 文档数据管理

### 1.1 接口列表

| HTTP方法 | 接口路径 | 功能描述 |
|----------|----------|----------|
| GET | `/documents/getDocumentById/{indexName}/{id}` | 获取单条文档 |
| GET | `/documents/getDocumentsByIds/{indexName}/{ids}` | 批量获取文档 |
| POST | `/documents/saveDocument` | 添加单条文档 |
| POST | `/documents/batchSaveDocuments` | 批量添加文档 |
| PUT | `/documents/updateDocument` | 更新单条文档 |
| PUT | `/documents/batchUpdateDocuments` | 批量更新文档 |
| DELETE | `/documents/deleteDocumentById/{indexName}/{id}` | 删除单条文档 |
| DELETE | `/documents/batchDeleteDocumentsByIds/{indexName}` | 批量删除文档 |
| POST | `/documents/searchDocuments/{indexName}` | 搜索文档（结构化查询） |
| POST | `/documents/searchDocumentsByDsl/{indexName}` | 搜索文档（DSL语句） |
| POST | `/documents/searchBySql` | SQL查询文档 |
| POST | `/documents/countDocumentsByIndexName/{indexName}` | 统计文档数量 |
| POST | `/documents/deleteDocumentsByDsl/{indexName}` | DSL批量删除 |
| POST | `/documents/updateDocumentsByDsl/{indexName}` | DSL批量更新 |

### 1.2 通用响应格式

```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | String | 响应码，200表示成功 |
| msg | String | 响应消息 |
| time | String | 响应时间戳 |
| data | Object | 响应数据 |

### 1.3 接口详细说明

#### 1.3.1 获取单条文档

**请求：**
```bash
GET /v1/api/documents/getDocumentById/{indexName}/{id}
```

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| indexName | String | 是 | 索引名称 |
| id | String | 是 | 文档ID |

**响应示例：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": {
        "name": "吴京",
        "age": 48,
        "nationality": "中国"
    }
}
```

---

#### 1.3.2 批量获取文档

**请求：**
```bash
GET /v1/api/documents/getDocumentsByIds/{indexName}/{ids}
```

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| indexName | String | 是 | 索引名称 |
| ids | List\<String\> | 是 | 文档ID列表，逗号分隔 |

**示例：**
```bash
GET /v1/api/documents/getDocumentsByIds/actors/1,2,3
```

---

#### 1.3.3 添加单条文档

**请求：**
```bash
POST /v1/api/documents/saveDocument
Content-Type: application/json
```

**请求体：**
```json
{
    "index": "actors",
    "id": "11561",
    "routing": "optional",
    "obj": {
        "actor_chName": "孙俪",
        "actor_nationality": "中国",
        "actor_birthDay": "1982年9月26日",
        "actor_repWorks": "甄嬛传、芈月传"
    }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| index | String | 是 | 索引名称 |
| id | String | 是 | 文档ID |
| routing | String | 否 | 路由值 |
| obj | Object | 是 | 文档内容（JSON对象） |

**响应：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": true
}
```

---

#### 1.3.4 批量添加文档

**请求：**
```bash
POST /v1/api/documents/batchSaveDocuments
Content-Type: application/json
```

**请求体：**
```json
{
    "data": [
        {
            "index": "actors",
            "id": "11561",
            "obj": {
                "actor_chName": "孙俪",
                "actor_nationality": "中国"
            }
        },
        {
            "index": "actors",
            "id": "11562",
            "obj": {
                "actor_chName": "冯小刚",
                "actor_nationality": "中国"
            }
        }
    ]
}
```

---

#### 1.3.5 更新单条文档

**请求：**
```bash
PUT /v1/api/documents/updateDocument
Content-Type: application/json
```

**请求体：** 同添加单条文档

---

#### 1.3.6 搜索文档（结构化查询）

**请求：**
```bash
POST /v1/api/documents/searchDocuments/{indexName}
Content-Type: application/json
```

**请求体：**
```json
{
    "queryString": {
        "field": "actor_chName",
        "value": "吴京",
        "queryType": "match"
    },
    "pageInfo": {
        "currentPage": 1,
        "pageSize": 10
    },
    "sortInfoList": [
        {
            "sortField": "actor_id",
            "sortWay": "desc"
        }
    ],
    "fields": ["actor_chName", "actor_nationality"],
    "highlights": {
        "preTags": "<em>",
        "postTags": "</em>",
        "fields": ["actor_chName"]
    }
}
```

**响应：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": {
        "list": [...],
        "totalSize": 100
    }
}
```

---

#### 1.3.7 搜索文档（DSL语句）

**请求：**
```bash
POST /v1/api/documents/searchDocumentsByDsl/{indexName}
Content-Type: application/json
```

**请求体：**
```json
{
    "dslStr": "{\"query\":{\"match\":{\"actor_chName\":\"吴京\"}},\"size\":10}"
}
```

---

#### 1.3.8 SQL查询文档（新增）

**请求：**
```bash
POST /v1/api/documents/searchBySql
Content-Type: text/plain
```

**请求体：**
```sql
SELECT actor_chName, actor_nationality, actor_birthDay 
FROM actors 
WHERE actor_nationality = '中国' 
LIMIT 10
```

**响应示例：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": {
        "columns": [
            {"name": "actor_chName", "type": "text"},
            {"name": "actor_nationality", "type": "keyword"},
            {"name": "actor_birthDay", "type": "keyword"}
        ],
        "rows": [
            {"actor_chName": "吴京", "actor_nationality": "中国", "actor_birthDay": "1974年4月3日"},
            {"actor_chName": "王宝强", "actor_nationality": "中国", "actor_birthDay": "1984年5月29日"}
        ],
        "total": 100,
        "size": 10
    }
}
```

**支持的SQL语法详解：**

### 1. 数据类型映射

| Elasticsearch类型 | SQL类型 | 说明 |
|------------------|---------|------|
| text | TEXT | 全文本字段 |
| keyword | KEYWORD | 精确匹配字段 |
| integer | INTEGER | 整型 |
| long | LONG | 长整型 |
| float | FLOAT | 浮点型 |
| double | DOUBLE | 双精度浮点型 |
| boolean | BOOLEAN | 布尔型 |
| date | DATE | 日期类型 |
| ip | IP | IP地址类型 |

### 2. SELECT 查询

```sql
-- 查询所有字段
SELECT * FROM actors

-- 查询指定字段
SELECT actor_chName, actor_nationality, actor_birthDay FROM actors

-- 字段别名
SELECT actor_chName AS name, actor_id AS id FROM actors
```

### 3. WHERE 条件查询

#### 3.1 比较运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `=` | 等于 | `WHERE actor_nationality = '中国'` |
| `<>` 或 `!=` | 不等于 | `WHERE actor_nationality <> '外国'` |
| `<` | 小于 | `WHERE actor_id < 1000` |
| `>` | 大于 | `WHERE actor_id > 1000` |
| `<=` | 小于等于 | `WHERE actor_id <= 1000` |
| `>=` | 大于等于 | `WHERE actor_id >= 1000` |

#### 3.2 逻辑运算符

```sql
-- AND 与条件
SELECT * FROM actors WHERE actor_nationality = '中国' AND actor_id > 11560

-- OR 或条件
SELECT * FROM actors WHERE actor_chName = '吴京' OR actor_chName = '胡歌'

-- NOT 非条件
SELECT * FROM actors WHERE NOT actor_nationality = '外国'

-- 组合条件（使用括号）
SELECT * FROM actors WHERE actor_nationality = '中国' AND (actor_id > 11560 OR actor_chName LIKE '%张%')
```

#### 3.3 模糊查询

```sql
-- LIKE 模糊匹配
SELECT * FROM actors WHERE actor_chName LIKE '%张%'  -- 包含"张"
SELECT * FROM actors WHERE actor_chName LIKE '张%'   -- 以"张"开头
SELECT * FROM actors WHERE actor_chName LIKE '%张'   -- 以"张"结尾

-- NOT LIKE
SELECT * FROM actors WHERE actor_chName NOT LIKE '%李%'
```

#### 3.4 IN 子句

```sql
-- IN 匹配多个值
SELECT * FROM actors WHERE actor_nationality IN ('中国', '美国', '日本')

-- NOT IN
SELECT * FROM actors WHERE actor_nationality NOT IN ('外国')
```

#### 3.5 范围查询

```sql
-- BETWEEN ... AND
SELECT * FROM actors WHERE actor_id BETWEEN 11558 AND 11565

-- NOT BETWEEN
SELECT * FROM actors WHERE actor_id NOT BETWEEN 1 AND 100
```

### 4. ORDER BY 排序

```sql
-- 单列排序（升序，默认）
SELECT * FROM actors ORDER BY actor_id ASC

-- 单列排序（降序）
SELECT * FROM actors ORDER BY actor_id DESC

-- 多列排序
SELECT * FROM actors ORDER BY actor_nationality ASC, actor_id DESC
```

### 5. LIMIT 分页

```sql
-- 限制返回条数
SELECT * FROM actors LIMIT 10

-- 分页（跳过前20条，返回10条）
SELECT * FROM actors LIMIT 20, 10
```

### 6. 聚合函数

| 函数 | 说明 | 示例 |
|------|------|------|
| COUNT() | 统计行数 | `SELECT COUNT(*) FROM actors` |
| COUNT(DISTINCT) | 统计不同值数量 | `SELECT COUNT(DISTINCT actor_nationality) FROM actors` |
| SUM() | 求和 | `SELECT SUM(actor_id) FROM actors` |
| AVG() | 平均值 | `SELECT AVG(actor_id) FROM actors` |
| MIN() | 最小值 | `SELECT MIN(actor_id) FROM actors` |
| MAX() | 最大值 | `SELECT MAX(actor_id) FROM actors` |

### 7. GROUP BY 分组

```sql
-- 按国籍分组统计人数
SELECT actor_nationality, COUNT(*) AS count 
FROM actors 
GROUP BY actor_nationality

-- 分组后排序
SELECT actor_nationality, COUNT(*) AS count 
FROM actors 
GROUP BY actor_nationality 
ORDER BY count DESC
```

### 8. HAVING 过滤分组结果

```sql
-- 只显示人数大于5的分组
SELECT actor_nationality, COUNT(*) AS count 
FROM actors 
GROUP BY actor_nationality 
HAVING COUNT(*) > 5

-- 组合使用
SELECT actor_nationality, COUNT(*) AS count 
FROM actors 
WHERE actor_id > 1000 
GROUP BY actor_nationality 
HAVING COUNT(*) > 5 
ORDER BY count DESC
```

### 9. SHOW TABLES 查看索引

```sql
-- 查看所有索引
SHOW TABLES

-- 查看指定索引信息
DESCRIBE actors
```

### 10. 常用函数

#### 10.1 字符串函数

```sql
-- 字符串长度
SELECT actor_chName, LENGTH(actor_chName) AS len FROM actors

-- 字符串拼接
SELECT CONCAT(actor_chName, '-', actor_foreName) AS full_name FROM actors

-- 转大写
SELECT UPPER(actor_chName) FROM actors

-- 转小写
SELECT LOWER(actor_chName) FROM actors

-- 截取字符串
SELECT SUBSTRING(actor_chName, 1, 2) FROM actors
```

#### 10.2 日期函数

```sql
-- 当前时间
SELECT CURRENT_DATE()
SELECT CURRENT_TIMESTAMP()

-- 日期格式化
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d')

-- 提取年份/月份/日期
SELECT YEAR('2024-01-01'), MONTH('2024-01-01'), DAY('2024-01-01')
```

#### 10.3 数学函数

```sql
-- 绝对值
SELECT ABS(-100)

-- 四舍五入
SELECT ROUND(3.14159, 2)

-- 向上取整
SELECT CEIL(3.1)

-- 向下取整
SELECT FLOOR(3.9)

-- 幂运算
SELECT POWER(2, 10)
```

### 11. 完整查询示例

```sql
-- 综合查询示例
SELECT 
    actor_chName, 
    actor_nationality, 
    actor_birthDay,
    COUNT(*) OVER (PARTITION BY actor_nationality) AS nation_count
FROM actors 
WHERE 
    actor_nationality = '中国' 
    AND actor_id > 11560
ORDER BY 
    actor_id DESC 
LIMIT 10

-- 聚合统计示例
SELECT 
    actor_nationality,
    COUNT(*) AS total,
    MIN(actor_id) AS min_id,
    MAX(actor_id) AS max_id,
    AVG(actor_id) AS avg_id
FROM actors
GROUP BY actor_nationality
HAVING COUNT(*) > 1
ORDER BY total DESC
```

---

#### 1.3.9 统计文档数量

**请求：**
```bash
POST /v1/api/documents/countDocumentsByIndexName/{indexName}
```

**响应：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": 1000
}
```

---

#### 1.3.10 DSL批量删除

**请求：**
```bash
POST /v1/api/documents/deleteDocumentsByDsl/{indexName}
Content-Type: application/json
```

**请求体：**
```json
{
    "dslStr": "{\"query\":{\"match\":{\"actor_nationality\":\"外国\"}}}"
}
```

---

#### 1.3.11 DSL批量更新

**请求：**
```bash
POST /v1/api/documents/updateDocumentsByDsl/{indexName}
Content-Type: application/json
```

**请求体：**
```json
{
    "dslStr": "{\"query\":{\"match\":{\"actor_nationality\":\"中国\"}},\"script\":{\"source\":\"ctx._source.category='国内演员'\"}}"
}
```

---

## 二、EsIndexController - 索引管理

### 2.1 接口列表

| HTTP方法 | 接口路径 | 功能描述 |
|----------|----------|----------|
| GET | `/index/getIndexInfoByIndexName/{indexName}` | 获取索引详情 |
| GET | `/index/indices` | 获取所有索引列表 |
| POST | `/index/createIndiceMapping/{indexName}` | 创建索引 |
| PUT | `/index/updateIndiceMapping/{indexName}` | 更新索引映射 |
| DELETE | `/index/dropIndice/{indexName}` | 删除索引 |
| PUT | `/index/closeIndex/{indexName}` | 关闭索引 |
| PUT | `/index/openIndex/{indexName}` | 开启索引 |
| POST | `/index/addAlias/{indexName}/{alias}` | 添加索引别名 |
| POST | `/index/removeAlias/{indexName}/{alias}` | 移除索引别名 |

### 2.2 接口详细说明

#### 2.2.1 获取索引详情

**请求：**
```bash
GET /v1/api/index/getIndexInfoByIndexName/{indexName}
```

**响应示例：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": {
        "settings": {...},
        "mappings": {...}
    }
}
```

---

#### 2.2.2 获取所有索引列表

**请求：**
```bash
GET /v1/api/index/indices
```

**响应示例：**
```json
{
    "code": "200",
    "msg": "处理成功",
    "time": "2026-06-16T10:00:40.364Z",
    "data": [
        {
            "indexName": "actors",
            "indexType": "INDEX",
            "health": "green",
            "status": "open",
            "docsCount": 1000
        }
    ]
}
```

---

#### 2.2.3 创建索引

**请求：**
```bash
POST /v1/api/index/createIndiceMapping/{indexName}
Content-Type: application/json
```

**请求体示例：**
```json
{
    "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 2
    },
    "mappings": {
        "properties": {
            "name": {"type": "text"},
            "age": {"type": "integer"},
            "created_at": {"type": "date"}
        }
    }
}
```

---

#### 2.2.4 更新索引映射

**请求：**
```bash
PUT /v1/api/index/updateIndiceMapping/{indexName}
Content-Type: application/json
```

**请求体示例：**
```json
{
    "properties": {
        "new_field": {"type": "keyword"}
    }
}
```

---

#### 2.2.5 删除索引

**请求：**
```bash
DELETE /v1/api/index/dropIndice/{indexName}
```

---

#### 2.2.6 关闭/开启索引

**请求：**
```bash
PUT /v1/api/index/closeIndex/{indexName}
PUT /v1/api/index/openIndex/{indexName}
```

---

#### 2.2.7 添加/移除索引别名

**请求：**
```bash
POST /v1/api/index/addAlias/{indexName}/{alias}
POST /v1/api/index/removeAlias/{indexName}/{alias}
```

---

## 三、常用工具方法

### 3.1 查看所有索引表

```bash
curl -X POST http://localhost:8082/v1/api/documents/searchBySql \
  -H "Content-Type: text/plain" \
  -d "SHOW TABLES"
```

### 3.2 SQL查询示例

```bash
# 查询所有字段
curl -X POST http://localhost:8082/v1/api/documents/searchBySql \
  -H "Content-Type: text/plain" \
  -d "SELECT * FROM actors LIMIT 10"

# 条件查询
curl -X POST http://localhost:8082/v1/api/documents/searchBySql \
  -H "Content-Type: text/plain" \
  -d "SELECT name, age FROM actors WHERE country = '中国' LIMIT 5"

# 排序查询
curl -X POST http://localhost:8082/v1/api/documents/searchBySql \
  -H "Content-Type: text/plain" \
  -d "SELECT * FROM actors ORDER BY actor_id DESC LIMIT 10"
```

---

## 四、错误响应格式

```json
{
    "code": "1000",
    "success": false,
    "message": "Found 1 problem\nline 1:37: Unknown index [moer_celebrities]",
    "errors": null,
    "time": "2026-06-16 17:31:31"
}
```

---

## 五、实体类说明

### 5.1 BatchDocument

用于批量文档操作的请求实体。

**字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| data | List\<DataDTO\> | 文档数据列表 |

**DataDTO（内部类）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| index | String | 索引名称 |
| id | String | 文档ID |
| routing | String | 路由值（可选） |
| obj | Map\<String, Object\> | 文档内容 |

### 5.2 SearchRequestDTO

用于结构化搜索请求。

**字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| agg | List\<AggItemDTO\> | 聚合字段 |
| knn | List\<KnnSearchDTO\> | KNN向量检索字段 |
| queryString | QueryStringDTO | 检索参数 |
| pageInfo | PageInfoDTO | 分页信息 |
| sortInfoList | List\<SortVO\> | 排序参数 |
| collapseField | String | 折叠去重字段 |
| highlights | HighLightDTO | 高亮配置 |
| fields | List\<String\> | 返回字段列表 |

### 5.3 RequestDslDTO

用于DSL语句请求。

**字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| dslStr | String | DSL语句字符串 |

---

## 附录：代码文件位置

| 文件 | 路径 |
|------|------|
| EsDocumentController | [moer-search-service/src/main/java/com/moer/search/controller/EsDocumentController.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-service/src/main/java/com/moer/search/controller/EsDocumentController.java) |
| EsIndexController | [moer-search-service/src/main/java/com/moer/search/controller/EsIndexController.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-service/src/main/java/com/moer/search/controller/EsIndexController.java) |
| BatchDocument | [moer-search-service/src/main/java/com/moer/search/entity/BatchDocument.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-service/src/main/java/com/moer/search/entity/BatchDocument.java) |
| SearchRequestDTO | [moer-search-service/src/main/java/com/moer/search/entity/SearchRequestDTO.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-service/src/main/java/com/moer/search/entity/SearchRequestDTO.java) |
| RequestDslDTO | [moer-search-service/src/main/java/com/moer/search/entity/RequestDslDTO.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-service/src/main/java/com/moer/search/entity/RequestDslDTO.java) |
