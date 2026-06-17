# Moer Search Ontology - 本体服务使用文档

## 概述

**moer-search-ontology** 是 moer-search 项目中的本体管理模块，提供领域知识的概念建模、关系管理和语义推理能力。该模块基于 Elasticsearch 存储本体数据，并提供多种推理引擎支持。

### 核心功能

| 功能模块 | 描述 |
|----------|------|
| **概念管理** | 概念的增删改查、搜索和层次管理 |
| **关系管理** | 概念间关系的定义、查询和维护 |
| **实例管理** | 概念实例的管理和查询 |
| **子类推理** | 继承关系推理、父类/子类查询 |
| **传递推理** | 传递闭包计算、路径查找 |
| **规则推理** | 基于规则的自动推理 |
| **查询扩展** | 语义查询扩展（同义词、概念扩展） |

### 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        REST API Layer                          │
│  ConceptController          ReasoningController                │
├─────────────────────────────────────────────────────────────────┤
│                      MoerOntologyEngine                         │
│  (本体引擎核心 - 协调概念、关系、推理器)                         │
├─────────────────────────────────────────────────────────────────┤
│                        Reasoners                               │
│  SubclassReasoner    TransitiveReasoner    RuleReasoner        │
├─────────────────────────────────────────────────────────────────┤
│                      OntologyStore                             │
│  (基于 Elasticsearch 的持久化存储)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、核心数据模型

### 2.1 Concept（概念）

概念是本体的基本组成单元，用于表示领域知识中的实体、属性、事件等抽象概念。

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `conceptId` | String | 概念唯一标识符（必填） |
| `conceptName` | String | 概念中文名称（必填） |
| `conceptNameEn` | String | 概念英文名称 |
| `description` | String | 概念描述 |
| `parents` | List\<String\> | 父概念ID列表 |
| `children` | List\<String\> | 子概念ID列表 |
| `relations` | List\<Relation\> | 关系列表 |
| `semanticType` | String | 语义类型 |
| `domain` | String | 所属领域 |
| `isAbstract` | Boolean | 是否为抽象概念 |
| `synonyms` | List\<String\> | 同义词列表 |
| `attributes` | List\<String\> | 属性列表 |
| `createTime` | Long | 创建时间戳 |
| `updateTime` | Long | 更新时间戳 |

**示例：**
```json
{
    "conceptId": "person",
    "conceptName": "人物",
    "conceptNameEn": "Person",
    "description": "人类个体的抽象概念",
    "parents": ["entity"],
    "children": ["actor", "director"],
    "semanticType": "entity",
    "domain": "general",
    "isAbstract": false,
    "synonyms": ["human", "individual"],
    "attributes": ["name", "age", "nationality"]
}
```

### 2.2 Relation（关系）

关系是本体中连接概念的桥梁，用于表达概念之间的语义关联。

**预定义关系类型：**

| 关系类型 | 常量 | 说明 |
|----------|------|------|
| 继承关系 | `TYPE_IS_A` | is_a，子类继承父类 |
| 部分关系 | `TYPE_PART_OF` | part_of，部分属于整体 |
| 拥有关系 | `TYPE_HAS_A` | has_a，拥有某属性 |
| 实例关系 | `TYPE_INSTANCE_OF` | instance_of，实例属于概念 |
| 相关关系 | `TYPE_RELATED_TO` | related_to，相关联 |
| 因果关系 | `TYPE_CAUSES` | causes，导致 |
| 治疗关系 | `TYPE_TREATMENT_FOR` | treatment_for，用于治疗 |
| 位置关系 | `TYPE_LOCATED_IN` | located_in，位于 |
| 包含关系 | `TYPE_CONTAINS` | contains，包含 |
| 产生关系 | `TYPE_PRODUCES` | produces，产生 |
| 用途关系 | `TYPE_USED_FOR` | used_for，用于 |

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `relationId` | String | 关系唯一标识符 |
| `sourceConceptId` | String | 源概念ID |
| `targetConceptId` | String | 目标概念ID |
| `relationType` | String | 关系类型（见上表） |
| `relationName` | String | 关系名称 |
| `description` | String | 关系描述 |
| `weight` | Integer | 关系权重（1-10） |
| `inverseRelationId` | String | 反向关系ID |
| `isSymmetric` | Boolean | 是否对称关系 |
| `isTransitive` | Boolean | 是否传递关系 |
| `isReflexive` | Boolean | 是否自反关系 |

**示例：**
```json
{
    "relationId": "actor_is_person",
    "sourceConceptId": "actor",
    "targetConceptId": "person",
    "relationType": "is_a",
    "relationName": "是一种",
    "description": "演员是一种人物",
    "weight": 10,
    "isSymmetric": false,
    "isTransitive": true,
    "isReflexive": false
}
```

### 2.3 Instance（实例）

实例是概念的具体化，代表领域知识中的具体对象或实体。

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `instanceId` | String | 实例唯一标识符 |
| `instanceName` | String | 实例名称 |
| `conceptId` | String | 所属概念ID |
| `conceptName` | String | 所属概念名称 |
| `properties` | Map\<String, Object\> | 属性键值对 |
| `conceptTags` | List\<String\> | 概念标签列表 |
| `semanticTypes` | List\<String\> | 语义类型列表 |
| `documentId` | String | 关联文档ID |
| `isActive` | Boolean | 是否活跃 |

**示例：**
```json
{
    "instanceId": "actor_wu_jing",
    "instanceName": "吴京",
    "conceptId": "actor",
    "conceptName": "演员",
    "properties": {
        "birthDate": "1974-04-03",
        "nationality": "中国",
        "representativeWorks": ["战狼", "流浪地球"]
    },
    "conceptTags": ["actor", "director"],
    "isActive": true
}
```

---

## 三、概念管理 API

### 3.1 接口列表

| HTTP方法 | 接口路径 | 功能描述 |
|----------|----------|----------|
| GET | `/api/concept/search` | 搜索概念（支持分页） |
| GET | `/api/concept/{id}` | 获取概念详情 |
| GET | `/api/concept/list` | 获取所有概念 |
| GET | `/api/concept/{id}/children` | 获取子概念 |
| GET | `/api/concept/{id}/parents` | 获取父概念 |
| POST | `/api/concept` | 创建概念 |
| PUT | `/api/concept/{id}` | 更新概念 |
| DELETE | `/api/concept/{id}` | 删除概念 |

### 3.2 接口详细说明

#### 3.2.1 搜索概念

**请求：**
```bash
GET /api/concept/search?query=人物&pageNum=1&pageSize=10
```

**参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| query | String | 是 | - | 搜索关键词 |
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页大小 |

**响应：**
```json
{
    "data": [
        {
            "conceptId": "person",
            "conceptName": "人物",
            "description": "人类个体的抽象概念"
        }
    ],
    "total": 1,
    "pageNum": 1,
    "pageSize": 10
}
```

#### 3.2.2 获取概念详情

**请求：**
```bash
GET /api/concept/{id}
```

**路径参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | String | 概念ID |

**响应：**
```json
{
    "conceptId": "actor",
    "conceptName": "演员",
    "conceptNameEn": "Actor",
    "description": "从事表演艺术的人员",
    "parents": ["person"],
    "children": [],
    "synonyms": ["艺人", "表演者"],
    "attributes": ["name", "nationality", "birthDate"]
}
```

#### 3.2.3 创建概念

**请求：**
```bash
POST /api/concept
Content-Type: application/json
```

**请求体：**
```json
{
    "conceptId": "director",
    "conceptName": "导演",
    "conceptNameEn": "Director",
    "description": "电影或戏剧的导演",
    "parents": ["person"],
    "isAbstract": false,
    "synonyms": ["执导", "导演"],
    "attributes": ["name", "works"]
}
```

#### 3.2.4 更新概念

**请求：**
```bash
PUT /api/concept/{id}
Content-Type: application/json
```

**请求体：** 同创建概念

#### 3.2.5 删除概念

**请求：**
```bash
DELETE /api/concept/{id}
```

**响应：**
```json
{
    "success": true,
    "message": "概念删除成功"
}
```

#### 3.2.6 获取子概念

**请求：**
```bash
GET /api/concept/{id}/children
```

**响应：**
```json
[
    {
        "conceptId": "actor",
        "conceptName": "演员"
    },
    {
        "conceptId": "director",
        "conceptName": "导演"
    }
]
```

---

## 四、推理服务 API

### 4.1 接口列表

| HTTP方法 | 接口路径 | 功能描述 |
|----------|----------|----------|
| GET | `/api/reason/subclass` | 获取子类（支持递归） |
| GET | `/api/reason/superclass` | 获取父类（支持递归） |
| GET | `/api/reason/is-subclass` | 判断继承关系 |
| GET | `/api/reason/expand` | 查询扩展 |
| POST | `/api/reason/rule` | 规则推理 |
| GET | `/api/reason/transitive` | 获取传递闭包 |
| GET | `/api/reason/path` | 查找路径 |

### 4.2 接口详细说明

#### 4.2.1 子类推理

**请求：**
```bash
GET /api/reason/subclass?conceptId=person&recursive=true
```

**参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| conceptId | String | 是 | - | 概念ID |
| recursive | Boolean | 否 | true | 是否递归获取所有后代 |

**响应：**
```json
{
    "conceptId": "person",
    "recursive": true,
    "subclasses": ["actor", "director", "singer"],
    "count": 3
}
```

#### 4.2.2 父类推理

**请求：**
```bash
GET /api/reason/superclass?conceptId=actor&recursive=true
```

**响应：**
```json
{
    "conceptId": "actor",
    "recursive": true,
    "superclasses": ["person", "entity"],
    "count": 2
}
```

#### 4.2.3 判断继承关系

**请求：**
```bash
GET /api/reason/is-subclass?subConceptId=actor&superConceptId=person
```

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| subConceptId | String | 是 | 子概念ID |
| superConceptId | String | 是 | 父概念ID |

**响应：**
```json
{
    "subConceptId": "actor",
    "superConceptId": "person",
    "isSubclass": true
}
```

#### 4.2.4 查询扩展

**请求：**
```bash
GET /api/reason/expand?query=演员&expandType=synonym
```

**参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| query | String | 是 | - | 原始查询词 |
| expandType | String | 否 | synonym | 扩展类型 |

**扩展类型说明：**

| 类型 | 说明 |
|------|------|
| `synonym` | 同义词扩展 |
| `semantic` | 语义扩展 |
| `concept` | 概念扩展 |

**响应：**
```json
{
    "originalQuery": "演员",
    "expandType": "synonym",
    "expandedTerms": ["演员", "艺人", "表演者", "actor"],
    "count": 4
}
```

#### 4.2.5 规则推理

**请求：**
```bash
POST /api/reason/rule
Content-Type: application/json
```

**请求体：**
```json
{
    "conceptId": "actor",
    "properties": {
        "nationality": "中国"
    }
}
```

**响应：**
```json
{
    "input": {...},
    "results": [
        {
            "source": "actor",
            "target": "person",
            "relationType": "is_a",
            "confidence": 1.0
        }
    ],
    "count": 1
}
```

#### 4.2.6 传递推理

**请求：**
```bash
GET /api/reason/transitive?conceptId=actor&relationType=is_a
```

**参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| conceptId | String | 是 | - | 概念ID |
| relationType | String | 否 | is_a | 关系类型 |

**响应：**
```json
{
    "conceptId": "actor",
    "relationType": "is_a",
    "closure": ["person", "entity", "actor"],
    "count": 3
}
```

#### 4.2.7 路径查找

**请求：**
```bash
GET /api/reason/path?sourceId=actor&targetId=entity
```

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sourceId | String | 是 | 源概念ID |
| targetId | String | 是 | 目标概念ID |

**响应：**
```json
{
    "sourceId": "actor",
    "targetId": "entity",
    "paths": [
        ["actor", "person", "entity"]
    ],
    "count": 1
}
```

---

## 五、使用示例

### 5.1 概念管理流程

```bash
# 1. 创建顶层概念
curl -X POST http://localhost:8083/api/concept \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "entity",
    "conceptName": "实体",
    "description": "所有实体的顶层概念"
  }'

# 2. 创建子概念
curl -X POST http://localhost:8083/api/concept \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "person",
    "conceptName": "人物",
    "parents": ["entity"],
    "synonyms": ["human"]
  }'

# 3. 创建演员概念
curl -X POST http://localhost:8083/api/concept \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "actor",
    "conceptName": "演员",
    "parents": ["person"],
    "synonyms": ["艺人", "表演者"],
    "attributes": ["name", "nationality", "birthDate"]
  }'

# 4. 查询演员的所有祖先
curl -X GET "http://localhost:8083/api/reason/superclass?conceptId=actor&recursive=true"
```

### 5.2 推理服务使用

```bash
# 判断继承关系
curl -X GET "http://localhost:8083/api/reason/is-subclass?subConceptId=actor&superConceptId=entity"

# 查询扩展（语义搜索）
curl -X GET "http://localhost:8083/api/reason/expand?query=演员&expandType=synonym"

# 查找路径
curl -X GET "http://localhost:8083/api/reason/path?sourceId=actor&targetId=entity"
```

### 5.3 批量操作

```bash
# 批量导入概念（通过引擎API）
# POST /api/concept/batch (需要扩展)
```

---

## 六、配置说明

### 6.1 application.yml

```yaml
server:
  port: 8083

spring:
  application:
    name: moer-search-ontology

# Elasticsearch 配置
elasticsearch:
  rest:
    hostNames: localhost:9200
    username: admin
    password: password

# 本体索引配置
ontology:
  index:
    concept-index: moer_ontology_concepts
    relation-index: moer_ontology_relations
    instance-index: moer_ontology_instances
```

### 6.2 索引模板

系统会自动创建以下索引模板：

| 索引名称 | 用途 |
|----------|------|
| `moer_ontology_concepts` | 概念存储 |
| `moer_ontology_relations` | 关系存储 |
| `moer_ontology_instances` | 实例存储 |

---

## 七、推理引擎说明

### 7.1 SubclassReasoner（子类推理器）

基于 `is_a` 关系构建概念层次树，支持：
- 子类查询（递归/非递归）
- 父类查询（递归/非递归）
- 继承关系判断
- 最近公共父类计算

### 7.2 TransitiveReasoner（传递推理器）

支持任意关系类型的传递闭包计算：
- 传递闭包获取
- 路径查找
- 传递关系判断

### 7.3 RuleReasoner（规则推理器）

支持自定义规则的推理引擎：
- 内置默认规则
- 自定义规则添加
- 规则匹配和推理

---

## 八、API 调用示例

### 8.1 使用 curl

```bash
# 获取所有概念
curl -X GET http://localhost:8083/api/concept/list

# 搜索概念
curl -X GET "http://localhost:8083/api/concept/search?query=人物"

# 获取子类
curl -X GET "http://localhost:8083/api/reason/subclass?conceptId=person"

# 查询扩展
curl -X GET "http://localhost:8083/api/reason/expand?query=演员&expandType=synonym"
```

### 8.2 使用 JavaScript

```javascript
// 获取概念详情
async function getConcept(id) {
    const response = await fetch(`http://localhost:8083/api/concept/${id}`);
    return await response.json();
}

// 搜索概念
async function searchConcepts(query, pageNum = 1, pageSize = 10) {
    const response = await fetch(
        `http://localhost:8083/api/concept/search?query=${encodeURIComponent(query)}&pageNum=${pageNum}&pageSize=${pageSize}`
    );
    return await response.json();
}

// 子类推理
async function getSubclasses(conceptId, recursive = true) {
    const response = await fetch(
        `http://localhost:8083/api/reason/subclass?conceptId=${conceptId}&recursive=${recursive}`
    );
    return await response.json();
}
```

---

## 九、代码文件位置

| 文件 | 路径 |
|------|------|
| ConceptController | [moer-search-ontology/src/main/java/com/moer/search/ontology/controller/ConceptController.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-ontology/src/main/java/com/moer/search/ontology/controller/ConceptController.java) |
| ReasoningController | [moer-search-ontology/src/main/java/com/moer/search/ontology/controller/ReasoningController.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-ontology/src/main/java/com/moer/search/ontology/controller/ReasoningController.java) |
| MoerOntologyEngine | [moer-search-ontology/src/main/java/com/moer/search/ontology/MoerOntologyEngine.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-ontology/src/main/java/com/moer/search/ontology/MoerOntologyEngine.java) |
| Concept | [moer-search-ontology/src/main/java/com/moer/search/ontology/model/Concept.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-ontology/src/main/java/com/moer/search/ontology/model/Concept.java) |
| Relation | [moer-search-ontology/src/main/java/com/moer/search/ontology/model/Relation.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-ontology/src/main/java/com/moer/search/ontology/model/Relation.java) |
| Instance | [moer-search-ontology/src/main/java/com/moer/search/ontology/model/Instance.java](file:///Users/haobao/Work/moer/opensource/moer-search/moer-search-ontology/src/main/java/com/moer/search/ontology/model/Instance.java) |
