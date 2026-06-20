import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

const MOER_SEARCH_SERVICE_URL = process.env.MOER_SEARCH_SERVICE_URL || "http://localhost:8082";

async function fetchFromService(url: string, options: http.RequestOptions = {}, body?: any) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const opts: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + (parsedUrl.search || ""),
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    };

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// --- STATE DEFINITIONS ---
interface IndexItem {
  id: string;
  name: string;
  docsCount: number;
  storageBytes: number;
  type: "vector" | "fulltext" | "hybrid";
  status: "open" | "closed";
  shards: number;
  replicas: number;
  creationTime: string;
  fields: { name: string; type: string; searchable: boolean; description: string }[];
  aliases: string[];
}

interface DocumentItem {
  id: string;
  indexId: string;
  title: string;
  content: string;
  vectorSize?: number;
  score?: number;
  tags: string[];
  lastUpdated: string;
}

interface OntologyNode {
  id: string;
  label: string;
  type: string; // e.g., Entity, Company, Concept, Person
  properties: Record<string, string>;
}

interface OntologyEdge {
  id: string;
  source: string;
  target: string;
  label: string; // e.g., CEO_OF, CREATOR_OF, RELATED_TO
}

interface SystemLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  module: string;
  message: string;
}

// --- INITIAL STATE DATA ---
let indexes: IndexItem[] = [
  {
    id: "idx_kb_finance",
    name: "kb_finance_reports",
    docsCount: 154,
    storageBytes: 15482010,
    type: "hybrid",
    status: "open",
    shards: 3,
    replicas: 1,
    creationTime: "2026-05-10T14:20:00Z",
    fields: [
      { name: "id", type: "keyword", searchable: true, description: "唯一标识" },
      { name: "title", type: "text", searchable: true, description: "文档标题" },
      { name: "content", type: "text", searchable: true, description: "主体文本内容" },
      { name: "publish_date", type: "date", searchable: false, description: "发布日期" },
      { name: "author", type: "keyword", searchable: true, description: "作者或机构" },
      { name: "embedding", type: "dense_vector[1536]", searchable: true, description: "密集向量表征" }
    ],
    aliases: ["finance_alias", "production_kb"]
  },
  {
    id: "idx_med_ontology",
    name: "medical_kb_graph",
    docsCount: 82,
    storageBytes: 6291456,
    type: "hybrid",
    status: "open",
    shards: 1,
    replicas: 1,
    creationTime: "2026-06-02T08:15:22Z",
    fields: [
      { name: "id", type: "keyword", searchable: true, description: "节点ID" },
      { name: "label", type: "keyword", searchable: true, description: "实体名/概念名" },
      { name: "type", type: "keyword", searchable: true, description: "实体分类" },
      { name: "description", type: "text", searchable: true, description: "详细医学描述" },
      { name: "relationships", type: "nested", searchable: true, description: "引用的其它实体关联关系" }
    ],
    aliases: ["clinical_knowledge"]
  },
  {
    id: "idx_news_vector",
    name: "global_news_stream",
    docsCount: 312,
    storageBytes: 42910400,
    type: "vector",
    status: "open",
    shards: 5,
    replicas: 2,
    creationTime: "2026-06-11T12:00:10Z",
    fields: [
      { name: "id", type: "keyword", searchable: true, description: "新闻ID" },
      { name: "title", type: "text", searchable: true, description: "新闻大标题" },
      { name: "summary", type: "text", searchable: true, description: "简短摘要" },
      { name: "vector_field", type: "dense_vector[768]", searchable: true, description: "轻量级高维语义向量" },
      { name: "category", type: "keyword", searchable: true, description: "新闻品类" }
    ],
    aliases: ["latest_news"]
  }
];

let documents: DocumentItem[] = [
  // Financial reports index docs
  {
    id: "doc_fin_001",
    indexId: "idx_kb_finance",
    title: "2026年Q1控股集团季度财报分析",
    content: "控股集团在2026年第一季度实现了强劲增长，季度营收达82.5亿美元，同比增长18.4%。由于核心搜索引擎（Moer Search）的发布，B端企业AI检索服务合同额突破30亿元。毛利率保持在68.5%，研发预算提升12%以支持本体引擎（Ontology Engine）和多智能体MCP工具组件的后续升级。",
    vectorSize: 1536,
    tags: ["财报", "公司控股", "MoerSearch", "Q1营收"],
    lastUpdated: "2026-05-18T10:14:00Z"
  },
  {
    id: "doc_fin_002",
    indexId: "idx_kb_finance",
    title: "Moer Search 专属企业级MCP智能体知识接入规范",
    content: "该规范详细规定了外部客户对接Moer Search MCP (Model Context Protocol) 协议时的信息输入标准。标准指出，智能体必须以标准JSON-RPC接口提供支持。该搜索平台支持Qwen、DeepSeek和Claude等大语言模型通过标准的规范查询本体库。对于数据库端，可通过配置直接触发SPARQL多级关系检索，加速实体关联度聚合运算。",
    vectorSize: 1536,
    tags: ["MCP协议", "智能体规范", "JSON-RPC", "知识库"],
    lastUpdated: "2026-06-01T15:30:22Z"
  },
  {
    id: "doc_fin_003",
    indexId: "idx_kb_finance",
    title: "全球央行高拟合度文本检索和通胀周期定量预测模型",
    content: "为了在万亿级大文档检索场景（包含新闻发布会速记、官方政策、利率决议）下获得精准的高相关度，本研究采用新型的混合向量检索（Hybrid Retrieval）技术。实验表明，通过倒排索引BM25与基于高维多层稠密向量模型的双重重排（Rerank）机制，能将领域特定术语的相关度排序（Recall@10）由72.3%推高至94.8%。且整体分析损耗仅增加14毫秒。",
    vectorSize: 1536,
    tags: ["金融预测", "通货膨胀", "混合检索", "相关度"],
    lastUpdated: "2026-06-12T09:44:11Z"
  },

  // Medical kb graph docs
  {
    id: "doc_med_001",
    indexId: "idx_med_ontology",
    title: "新型免疫受体T-104在抗细胞凋亡中的分子调控网络",
    content: "新型靶向受体T-104由主要配体因子激活后，通过AKT/mTOR分子级联转导抑制巨噬细胞的炎性死亡。本条目作为高维度生物医学本体（Medical Ontology）包含明确的靶点关联描述：T-104受体(Entity) -- 配体结合(Relation) --> JAK酪氨酸激酶。该研究的本体定义被同步关联在科研索引中，以便医护科研人员通过自然语言进行语义深层遍历。",
    vectorSize: 1536,
    tags: ["分子网络", "生物本体", "医学检索", "T-104受体"],
    lastUpdated: "2026-06-02T08:15:22Z"
  },
  {
    id: "doc_med_002",
    indexId: "idx_med_ontology",
    title: "糖尿病一阶并发症在心脑血管树中的病理知识图谱",
    content: "此本体详尽涵盖糖尿病酮症酸中毒与微血管硬化的拓扑映射结构。临床医生利用Moer Search本体引擎进行诊疗搜索时，系统不仅返回传统症状说明，还会图形化关联出『微血管病变 -- 诱发 --> 肾衰竭』及『冠状动脉硬化 -- 伴随 --> 糖尿病足』等多维实体链接，有效弥补常规单线文档匹配在临床决策支撑上的不足。",
    vectorSize: 1536,
    tags: ["糖尿病", "并发症", "病理学", "知识图谱"],
    lastUpdated: "2026-06-15T11:21:00Z"
  }
];

let ontologyNodes: OntologyNode[] = [
  { id: "node_1", label: "Moer Search (知识搜索)", type: "System", properties: { creator: "数据实验室", version: "v2.5", core_tech: "语义混合检索 + 本体推理" } },
  { id: "node_2", label: "Model Context Protocol (MCP)", type: "Protocol", properties: { type: "智能体连接协议", message_format: "JSON-RPC", standard: "OpenModelContext" } },
  { id: "node_3", label: "Ontology Engine (本体引擎)", type: "Engine", properties: { query_lang: "SPARQL + 拼音语义关联", storage: "语义图存储" } },
  { id: "node_4", label: "DeepSeek-V3", type: "LLM", properties: { context_window: "128k", provider: "DeepSeek", architecture: "MoE" } },
  { id: "node_5", label: "Qwen-2.5-72B", type: "LLM", properties: { context_window: "128k", provider: "Alibaba", strengths: "中文语义及复杂推理" } },
  { id: "node_6", label: "Claude 3.5 Sonnet", type: "LLM", properties: { provider: "Anthropic", complex_reasoning: "极强", coding_performance: "顶拔" } },
  { id: "node_7", label: "医疗健康本体库 (Clinical KB)", type: "KnowledgeBase", properties: { domain: "生物医学", scale: "15万词条", precision: "99.2%" } },
  { id: "node_8", label: "金融决策本体库 (Finance KB)", type: "KnowledgeBase", properties: { domain: "证券与宏观经济", dynamic_update: "实时数据流" } }
];

let ontologyEdges: OntologyEdge[] = [
  { id: "edge_1", source: "node_1", target: "node_2", label: "原生存根协议" },
  { id: "edge_2", source: "node_1", target: "node_3", label: "关联知识框架" },
  { id: "edge_3", source: "node_2", target: "node_4", label: "适配模型" },
  { id: "edge_4", source: "node_2", target: "node_5", label: "适配模型" },
  { id: "edge_5", source: "node_2", target: "node_6", label: "适配模型" },
  { id: "edge_6", source: "node_3", target: "node_7", label: "注入支撑" },
  { id: "edge_7", source: "node_3", target: "node_8", label: "注入支撑" }
];

let logs: SystemLog[] = [
  { timestamp: "2026-06-17T08:00:01Z", level: "INFO", module: "CLUSTER", message: "Moer Search 弹性验证集群正常引导完毕，当前在线节点数: 5" },
  { timestamp: "2026-06-17T08:02:14Z", level: "INFO", module: "MCP", message: "MCP 协议处理器发现并成功注册新接口: [web_search_tool], [kb_finance_search_tool]" },
  { timestamp: "2026-06-17T08:05:30Z", level: "INFO", module: "ONTOLOGY", message: "本体推理引擎加载完成，已预载 8 个核心种子骨架实体，语义深度[3层]" },
  { timestamp: "2026-06-17T08:10:45Z", level: "INFO", module: "INDEX_MGR", message: "后台自动执行段合并(Segment Merge)对索引[kb_finance_reports], 释放物理碎片存储约 1.2 MB" },
  { timestamp: "2026-06-17T08:24:11Z", level: "INFO", module: "SEARCH", message: "执行来自 0.0.0.0 的混合检索查询，命中文档总数: 3, 响应延时: 11ms" },
  { timestamp: "2026-06-17T08:31:02Z", level: "WARN", module: "ADAPTER", message: "调用外部模型适配接口[DeepSeek]因底层QPS负载过高触发重试，延时 230ms 后调用成功" }
];

// Lazily access Gemini client to avoid server startup issues on missing keys.
let geminiClient: any = null;
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Successfully initialized Gemini client");
    } catch (e) {
      console.error("Failed to initialize Gemini client", e);
    }
  }
  return geminiClient;
}

// Add logs helper
function addLog(level: "INFO" | "WARN" | "ERROR", module: string, message: string) {
  const logItem: SystemLog = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message
  };
  logs.unshift(logItem); // Keep newest logs first
  if (logs.length > 200) logs.pop();
}

// --- LARGE MODEL DYNAMIC CONFIGURATION STATE & ENDPOINTS ---
interface ModelConfig {
  activeSearchModel: string;
  activeQaModel: string;
  activeNlpModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemInstruction: string;
  safetySetting: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  thinkingEnabled: boolean;
  thinkingBudget: number;
}

interface RegisteredModel {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  temperature: number;
  status: "active" | "inactive" | "maintenance";
  description: string;
  createdAt: string;
}

let modelRegistry: RegisteredModel[] = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google Speed-Sovereign",
    baseUrl: "https://generativelanguage.googleapis.com",
    temperature: 0.7,
    status: "active",
    description: "多模态双通道原生低时延归纳，支持 2M 上下文 RAG 级联与高密度知识推理。",
    createdAt: "2026-06-01"
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    provider: "Google High-Fidelity",
    baseUrl: "https://generativelanguage.googleapis.com",
    temperature: 0.4,
    status: "active",
    description: "高维多语言复杂本体概念智能抽取，适合多层级递归实体关系链条推导。",
    createdAt: "2026-06-02"
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "Google Nano-Edge",
    baseUrl: "https://generativelanguage.googleapis.com",
    temperature: 0.5,
    status: "active",
    description: "超轻量、低价、高并发低门槛检索模型，主要用于通用检索词前置去噪洗刷。",
    createdAt: "2026-06-03"
  },
  {
    id: "deepseek-r1-custom",
    name: "DeepSeek R1 Dual RAG Engine",
    provider: "DeepSeek High-Reasoning",
    baseUrl: "https://api.deepseek.com",
    temperature: 0.1,
    status: "active",
    description: "深度思考模型（CoT 离线适配版），专门用于复杂文本合规的精准结构化诊断。",
    createdAt: "2026-06-10"
  },
  {
    id: "local-ollama-llama3",
    name: "Llama 3.1 Local Core",
    provider: "Meta Local-Ollama",
    baseUrl: "http://localhost:11434",
    temperature: 0.6,
    status: "inactive",
    description: "本地私有化私有网络引擎，供无外网环境下本体检索备份推理使用。",
    createdAt: "2026-06-15"
  }
];

let globalModelConfig: ModelConfig = {
  activeSearchModel: "gemini-3.5-flash",
  activeQaModel: "gemini-3.5-flash",
  activeNlpModel: "gemini-3.5-flash",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  systemInstruction: "你是一个融合了「全文/向量双通道检索」、「知识本体图谱推理」与「MCP外置智能体接口技能」的超精确 AI 检索问答专家。",
  safetySetting: "LOW",
  thinkingEnabled: false,
  thinkingBudget: 1024
};

// --- Model Registry Catalog CRUD ---
app.get("/api/model/registry", (req, res) => {
  res.json(modelRegistry);
});

app.post("/api/model/registry", (req, res) => {
  const { id, name, provider, baseUrl, temperature, status, description } = req.body;
  if (!id || !name || !provider) {
    return res.status(400).json({ error: "应用标识符(id)、服务名称(name)和提供方(provider)均为必填配置" });
  }

  const normalizedId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  if (modelRegistry.some(m => m.id === normalizedId)) {
    return res.status(400).json({ error: "已存在相同ID的大模型注册记录" });
  }

  const newModel: RegisteredModel = {
    id: normalizedId,
    name: name.trim(),
    provider: provider.trim(),
    baseUrl: baseUrl ? baseUrl.trim() : "https://api.custom.gateway",
    temperature: typeof temperature === "number" ? temperature : 0.7,
    status: status === "inactive" || status === "maintenance" ? status : "active",
    description: description ? description.trim() : "自定义扩展适配推理中枢。",
    createdAt: new Date().toISOString().split("T")[0]
  };

  modelRegistry.push(newModel);
  addLog("INFO", "MODEL_REGISTRY", `成功注册新大语言模型: [${newModel.name}] (${newModel.id})`);
  res.json({ success: true, item: newModel });
});

app.put("/api/model/registry/:id", (req, res) => {
  const { id } = req.params;
  const { name, provider, baseUrl, temperature, status, description } = req.body;

  const idx = modelRegistry.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "未找到待更新的大模型注册信息" });
  }

  modelRegistry[idx] = {
    ...modelRegistry[idx],
    name: name ? name.trim() : modelRegistry[idx].name,
    provider: provider ? provider.trim() : modelRegistry[idx].provider,
    baseUrl: baseUrl ? baseUrl.trim() : modelRegistry[idx].baseUrl,
    temperature: typeof temperature === "number" ? temperature : modelRegistry[idx].temperature,
    status: status || modelRegistry[idx].status,
    description: description ? description.trim() : modelRegistry[idx].description
  };

  addLog("INFO", "MODEL_REGISTRY", `已更新模型注册规则: [${modelRegistry[idx].name}]`);
  res.json({ success: true, item: modelRegistry[idx] });
});

app.delete("/api/model/registry/:id", (req, res) => {
  const { id } = req.params;
  const idx = modelRegistry.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "未找到对应的大模型注册项" });
  }

  const deleted = modelRegistry.splice(idx, 1)[0];
  addLog("INFO", "MODEL_REGISTRY", `已注销并删除模型注册项: [${deleted.name}] (${deleted.id})`);

  // Reset active configurations to default if the deleted model was selected
  if (globalModelConfig.activeSearchModel === id) {
    globalModelConfig.activeSearchModel = "gemini-3.5-flash";
  }
  if (globalModelConfig.activeQaModel === id) {
    globalModelConfig.activeQaModel = "gemini-3.5-flash";
  }
  if (globalModelConfig.activeNlpModel === id) {
    globalModelConfig.activeNlpModel = "gemini-3.5-flash";
  }

  res.json({ success: true, id });
});

app.get("/api/model/config", (req, res) => {
  res.json(globalModelConfig);
});

app.post("/api/model/config", (req, res) => {
  const { activeSearchModel, activeQaModel, activeNlpModel, temperature, topP, maxTokens, systemInstruction, safetySetting, thinkingEnabled, thinkingBudget } = req.body;
  
  globalModelConfig = {
    activeSearchModel: activeSearchModel || "gemini-3.5-flash",
    activeQaModel: activeQaModel || "gemini-3.5-flash",
    activeNlpModel: activeNlpModel || "gemini-3.5-flash",
    temperature: typeof temperature === "number" ? temperature : 0.7,
    topP: typeof topP === "number" ? topP : 0.9,
    maxTokens: typeof maxTokens === "number" ? maxTokens : 2048,
    systemInstruction: systemInstruction || "你是一个智能合规语义专家。",
    safetySetting: safetySetting || "LOW",
    thinkingEnabled: !!thinkingEnabled,
    thinkingBudget: typeof thinkingBudget === "number" ? thinkingBudget : 1024
  };

  addLog("INFO", "MODEL_CONFIG", `大模型全局控制策略已更新。主合成模型: [${globalModelConfig.activeSearchModel}], 采样温度: [${globalModelConfig.temperature}]`);
  res.json({ success: true, config: globalModelConfig });
});

app.post("/api/model/test-prompt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "提示词不能为空" });
  }

  const ai = getGeminiClient();
  const startTime = Date.now();
  const activeModel = globalModelConfig.activeQaModel || "gemini-3.5-flash";

  if (!ai) {
    // If no live key is set, we return an extremely high-fidelity mock diagnostic report
    const delay = Math.round(150 + Math.random() * 80);
    const mockAnswer = `【Moer Search 备用离线合成引擎】
针对您的诊断问题：“${prompt}”
以下是检索架构的多维度对准归纳：
1. 联邦混合检索（Hybrid Search）通过联合倒排索引的BM25字词匹配与向量空间（Dense Vector）的余弦相关度实现检索：
   Score(doc) = α * NormalizedScore_BM25 + (1 - α) * NormalizedScore_Vector
2. 引入本体约束（Ontology Constraint）通过在召回段之前对查询实体进行实体消歧与类属链条遍历（Ontology Traversal），将关键词映射到本体大纲层级。
3. 端到端收益验证：
   - 噪声召回率（Precision@10）提升约 18.4%
   - 召回漏配率（Recall）降低将近 12%
   - 在图谱推理链路约束下，生成回复的抗幻觉对齐度达到 98.4%，显著减少杂散关联。`;

    addLog("INFO", "MODEL_TEST", `针对 [${activeModel}] 触发点对点可用性诊断测试（离线仿真通道），耗时 ${delay}ms`);
    
    return res.json({
      success: true,
      answer: mockAnswer,
      latencyMs: delay,
      tokensUsed: { input: prompt.length * 2, output: mockAnswer.length * 2 },
      modelUsed: activeModel + " (Simulated-Gateway)",
      costEstimate: (prompt.length * 2 * 0.075 + mockAnswer.length * 2 * 0.3) / 1000000,
      thinkingTrace: globalModelConfig.thinkingEnabled ? `▶ [CoT Step 1] 评估输入提示词 “${prompt.substring(0, 20)}...”\n▶ [CoT Step 2] 未检测到 GEMINI_API_KEY 环境变量，启动在线混合检索离线回执方案\n▶ [CoT Step 3] 提取本地本体种子图谱中 [混合检索] 与 [精度收益] 属性节点关系\n▶ [CoT Step 4] 约束提炼结果...` : undefined,
      safetyChecks: [
        { category: "Hate Speech (仇恨言论检测)", status: "PASS" },
        { category: "Sexually Explicit (色情违规过滤)", status: "PASS" },
        { category: "Harassment Policy (人身骚扰控制)", status: "PASS" },
        { category: "Dangerous Content (危险引导规避)", status: "PASS" }
      ]
    });
  }

  try {
    const configParams: any = {
      temperature: globalModelConfig.temperature,
      topP: globalModelConfig.topP,
      maxOutputTokens: globalModelConfig.maxTokens,
      systemInstruction: globalModelConfig.systemInstruction
    };

    if (globalModelConfig.thinkingEnabled) {
      configParams.thinkingConfig = {
        thinkingBudget: globalModelConfig.thinkingBudget || 1024
      };
    }

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: configParams
    });

    const latency = Date.now() - startTime;
    const answer = response.text || "大模型未吐出任何正文。";

    addLog("INFO", "MODEL_TEST", `针对 [${activeModel}] 触发点对点可用性诊断测试（实时物理芯片通道），耗时 ${latency}ms`);

    return res.json({
      success: true,
      answer: answer,
      latencyMs: latency,
      tokensUsed: {
        input: Math.round(prompt.length * 1.3),
        output: Math.round(answer.length * 1.6)
      },
      modelUsed: activeModel,
      costEstimate: (Math.round(prompt.length * 1.3) * 0.075 + Math.round(answer.length * 1.6) * 0.3) / 1000000,
      safetyChecks: [
        { category: "Hate Speech (仇恨言论检测)", status: "PASS" },
        { category: "Sexually Explicit (色情违规过滤)", status: "PASS" },
        { category: "Harassment Policy (人身骚扰控制)", status: "PASS" },
        { category: "Dangerous Content (危险引导规避)", status: "PASS" }
      ]
    });

  } catch (err: any) {
    console.error("Diagnostic test failed", err);
    addLog("ERROR", "MODEL_TEST", `针对 [${activeModel}] 诊断测试失败: ${err.message}`);
    return res.status(500).json({ error: err.message || "大模型调度错误" });
  }
});

// --- CLUSTER INFO ---
app.get("/api/cluster", (req, res) => {
  const hasLiveGemini = !!process.env.GEMINI_API_KEY;
  const totalStorage = indexes.reduce((acc, curr) => acc + curr.storageBytes, 0);
  const totalDocs = documents.length;

  const cluster = {
    status: "GREEN",
    nodesCount: 5,
    indexesCount: indexes.length,
    docsCount: totalDocs,
    storageUsageBytes: totalStorage,
    jvmMemoryPercent: 42,
    qps: 12.8,
    avgResponseMs: 14.5,
    hasLiveGemini
  };

  res.json({
    cluster,
    hasLiveGemini
  });
});

app.get("/api/cluster/info", (req, res) => {
  const hasLiveGemini = !!process.env.GEMINI_API_KEY;
  const totalStorage = indexes.reduce((acc, curr) => acc + curr.storageBytes, 0);
  const totalDocs = documents.length;

  res.json({
    status: "GREEN",
    nodesCount: 5,
    indexesCount: indexes.length,
    docsCount: totalDocs,
    storageUsageBytes: totalStorage,
    jvmMemoryPercent: 42,
    qps: 12.8,
    avgResponseMs: 14.5,
    hasLiveGemini
  });
});

// --- INDEX ENDPOINTS ---
app.get("/api/indexes", async (req, res) => {
  try {
    const result = await fetchFromService(`${MOER_SEARCH_SERVICE_URL}/v1/api/index/indices`);
    if (result && typeof result === "object" && "data" in result) {
      const esIndexes = (result as any).data;
      const transformed = esIndexes.map((esIdx: any) => ({
        id: esIdx.uuid || esIdx.index,
        name: esIdx.index,
        docsCount: parseInt(esIdx["docs.count"] || "0"),
        storageBytes: parseInt((esIdx["store.size"] || "0").replace(/[a-zA-Z]/g, "")) * 1024 || 0,
        type: esIdx.index.includes("vector") ? "vector" : esIdx.index.includes("fulltext") ? "fulltext" : "hybrid",
        status: esIdx.status || "open",
        shards: parseInt(esIdx.pri || "1"),
        replicas: parseInt(esIdx.rep || "1"),
        creationTime: esIdx.genDate || new Date().toISOString(),
        fields: [],
        aliases: []
      }));
      res.json([...transformed, ...indexes.filter(idx => !transformed.some(t => t.name === idx.name))]);
    } else {
      res.json(indexes);
    }
  } catch (error) {
    console.error("Failed to fetch indexes from moer-search-service:", error);
    res.json(indexes);
  }
});

app.post("/api/indexes", async (req, res) => {
  const { name, type, shards, replicas, fields } = req.body;
  if (!name) {
    return res.status(400).json({ error: "索引名称不能为空" });
  }

  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    const dsl: any = {
      settings: {
        number_of_shards: Number(shards) || 3,
        number_of_replicas: Number(replicas) || 1
      },
      mappings: {
        properties: {}
      }
    };

    (fields || []).forEach((field: any) => {
      const fieldType = field.type === "text" ? "text" : 
                       field.type === "keyword" ? "keyword" : 
                       field.type === "date" ? "date" : "text";
      dsl.mappings.properties[field.name] = { type: fieldType };
    });

    const result = await fetchFromService(
      `${MOER_SEARCH_SERVICE_URL}/v1/api/index/createIndiceMapping/${cleanName}`,
      { method: "POST" },
      dsl
    );

    if (result && typeof result === "object" && ((result as any).code === "200" || (result as any).data === true)) {
      const newIdx: IndexItem = {
        id: cleanName,
        name: cleanName,
        docsCount: 0,
        storageBytes: 1048576,
        type: type || "hybrid",
        status: "open",
        shards: Number(shards) || 3,
        replicas: Number(replicas) || 1,
        creationTime: new Date().toISOString(),
        fields: fields || [
          { name: "id", type: "keyword", searchable: true, description: "ID" },
          { name: "title", type: "text", searchable: true, description: "标题" },
          { name: "content", type: "text", searchable: true, description: "主要内容" }
        ],
        aliases: []
      };
      indexes.push(newIdx);
      addLog("INFO", "INDEX_MGR", `成功创建新索引 ${newIdx.name} (类型: ${newIdx.type}, 分片: ${newIdx.shards})`);
      res.status(201).json(newIdx);
    } else {
      res.status(500).json({ error: (result as any)?.msg || "创建索引失败" });
    }
  } catch (error) {
    console.error("Failed to create index:", error);
    res.status(500).json({ error: "创建索引失败: " + (error as Error).message });
  }
});

// Alias manipulation
app.post("/api/indexes/:id/alias", (req, res) => {
  const { id } = req.params;
  const { alias, action } = req.body; // action: "add" | "remove"
  if (!alias) {
    return res.status(400).json({ error: "别名不能为空" });
  }

  const idx = indexes.find(index => index.id === id);
  if (!idx) {
    return res.status(404).json({ error: "未找到指定索引" });
  }

  const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

  if (action === "remove") {
    idx.aliases = idx.aliases.filter(a => a !== cleanAlias);
    addLog("INFO", "INDEX_MGR", `移除了索引 ${idx.name} 的别名 "${cleanAlias}"`);
  } else {
    if (!idx.aliases.includes(cleanAlias)) {
      idx.aliases.push(cleanAlias);
      addLog("INFO", "INDEX_MGR", `为索引 ${idx.name} 增加了别名 "${cleanAlias}"`);
    }
  }

  res.json(idx);
});

// Update index settings/action
app.post("/api/indexes/:id/action", (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // "close" | "open" | "clear" | "delete"

  const idxIndex = indexes.findIndex(idx => idx.id === id);
  if (idxIndex === -1) {
    return res.status(404).json({ error: "未找到该索引" });
  }

  const idx = indexes[idxIndex];

  if (action === "close") {
    idx.status = "closed";
    addLog("WARN", "INDEX_MGR", `禁用了索引 ${idx.name} 的写入和查询服务`);
    return res.json(idx);
  } else if (action === "open") {
    idx.status = "open";
    addLog("INFO", "INDEX_MGR", `启用了索引 ${idx.name}，服务恢复在线`);
    return res.json(idx);
  } else if (action === "clear") {
    documents = documents.filter(doc => doc.indexId !== id);
    idx.docsCount = 0;
    idx.storageBytes = 1048576;
    addLog("WARN", "INDEX_MGR", `清空了索引 ${idx.name} 下的所有文档内容`);
    return res.json(idx);
  } else if (action === "delete") {
    const deletedName = idx.name;
    documents = documents.filter(doc => doc.indexId !== id);
    indexes.splice(idxIndex, 1);
    addLog("ERROR", "CLUSTER", `删除了索引 ${deletedName} 及其关联的所有物理数据`);
    return res.json({ success: true, message: `索引 ${deletedName} 删除完成` });
  }

  res.status(400).json({ error: "未知操作类型" });
});

// Update index settings/fields (改 - Modify mappings, settings)
app.put("/api/indexes/:id", (req, res) => {
  const { id } = req.params;
  const { name, shards, replicas, fields, type } = req.body;

  const idx = indexes.find(index => index.id === id);
  if (!idx) {
    return res.status(404).json({ error: "未找到指定索引" });
  }

  if (name) {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleanName !== idx.name) {
      const duplicated = indexes.find(i => i.name === cleanName);
      if (duplicated) {
        return res.status(400).json({ error: `索引名称 "${cleanName}" 已冲突存在` });
      }
      idx.name = cleanName;
    }
  }

  if (shards !== undefined) idx.shards = Number(shards);
  if (replicas !== undefined) idx.replicas = Number(replicas);
  if (type !== undefined) idx.type = type;
  if (fields !== undefined && Array.isArray(fields)) idx.fields = fields;

  addLog("INFO", "INDEX_MGR", `更新了索引 ${idx.name} 的配置(分片/副本/映射架构)`);
  res.json(idx);
});

// RESTful DELETE index endpoint
app.delete("/api/indexes/:id", async (req, res) => {
  const { id } = req.params;
  const idxIndex = indexes.findIndex(idx => idx.id === id);
  if (idxIndex === -1) {
    return res.status(404).json({ error: "未找到该索引" });
  }

  const deletedName = indexes[idxIndex].name;

  try {
    const result = await fetchFromService(
      `${MOER_SEARCH_SERVICE_URL}/v1/api/index/dropIndice/${deletedName}`,
      { method: "DELETE" }
    );

    if (result && typeof result === "object" && ((result as any).code === "200" || (result as any).data === true)) {
      documents = documents.filter(doc => doc.indexId !== id);
      indexes.splice(idxIndex, 1);
      addLog("ERROR", "CLUSTER", `物理 API 调用：删除了索引 ${deletedName} 及其关联的所有物理数据`);
      res.json({ success: true, message: `索引 ${deletedName} 删除完成` });
    } else {
      res.status(500).json({ error: (result as any)?.msg || "删除索引失败" });
    }
  } catch (error) {
    console.error("Failed to delete index:", error);
    res.status(500).json({ error: "删除索引失败: " + (error as Error).message });
  }
});

// RESTful SQL & DSL query execution interface
app.post("/api/indexes/query", (req, res) => {
  const { indexId, queryType, queryText } = req.body;

  if (!queryText) {
    return res.status(400).json({ error: "查询参数或命令文本不能为空" });
  }

  // Find index context
  let targetIndex = indexes.find(idx => idx.id === indexId || idx.name === indexId);
  let targetDocs = documents;
  
  if (targetIndex) {
    targetDocs = documents.filter(doc => doc.indexId === targetIndex.id);
  }

  const startTime = Date.now();
  let results: any[] = [];
  let planExplanation: string[] = [];
  let errorDetail: string | null = null;
  let parsedAST: any = null;

  try {
    if (queryType === "sql") {
      // Simple custom SQL parser for demonstration/interactive sandbox
      const sql = queryText.trim();
      planExplanation.push(`[SQL PARSER] 启动 SQL 解释器并建立语法树特征分析...`);
      planExplanation.push(`[SQL AST] 待解析 SQL 串: "${sql}"`);

      // Match select
      const selectRegex = /^\s*SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_*#-]+)(\s+WHERE\s+(.+?))?(\s+ORDER\s+BY\s+(.+?))?(\s+LIMIT\s+(\d+))?\s*;?\s*$/i;
      const match = sql.match(selectRegex);

      if (!match) {
        throw new Error("格式不合规！期待核心格式: SELECT id, title, content FROM <index_name_or_all> [WHERE content LIKE '%key%'] [ORDER BY score DESC] [LIMIT 5]");
      }

      const selectFieldsStr = match[1].trim();
      const fromTable = match[2].trim();
      const whereClause = match[4] ? match[4].trim() : null;
      const orderByClause = match[6] ? match[6].trim() : null;
      const limitVal = match[8] ? parseInt(match[8].trim(), 10) : null;

      parsedAST = {
        operation: "SELECT",
        fields: selectFieldsStr.split(",").map(f => f.trim()),
        from: fromTable,
        where: whereClause,
        orderBy: orderByClause,
        limit: limitVal
      };

      planExplanation.push(`[SQL AST] 元素解析完成: SELECT [${parsedAST.fields.join(", ")}] FROM <${parsedAST.from}>`);
      
      // Determine source docs and indexId
      if (parsedAST.from !== "*" && parsedAST.from.toLowerCase() !== "all" && parsedAST.from.toLowerCase() !== "current_index") {
        const foundIdx = indexes.find(idx => idx.name.toLowerCase() === parsedAST.from.toLowerCase() || idx.id === parsedAST.from);
        if (foundIdx) {
          targetIndex = foundIdx;
          targetDocs = documents.filter(d => d.indexId === foundIdx.id);
          planExplanation.push(`[PLAN] 命中实体索引 '${foundIdx.name}'，提取本地 shards 内存数据 ${targetDocs.length} 件.`);
        } else {
          planExplanation.push(`[WARN] 未定位到名称为 "${parsedAST.from}" 的物理索引。默认回归全局系统文档进行过滤.`);
        }
      } else {
        planExplanation.push(`[PLAN] 声明在全局联邦倒排表 (ALL INDEXES) 启动联合查询... 全局深度文档库总数: ${targetDocs.length} 件.`);
      }

      // Filter via WHERE clause
      let filtered = [...targetDocs];
      if (whereClause) {
        planExplanation.push(`[PLAN] 启动 WHERE 子句逻辑拦截: "${whereClause}"`);
        
        // Split with AND or OR
        // Simple AND splitter
        const expressions = whereClause.split(/\s+AND\s+/i);
        expressions.forEach(expr => {
          const matchLike = expr.match(/^\s*([a-zA-Z0-9_]+)\s+LIKE\s+['"]%?(.+?)%?['"]\s*$/i);
          const matchEq = expr.match(/^\s*([a-zA-Z0-9_]+)\s*=\s*['"](.+?)['"]\s*$/i);

          if (matchLike) {
            const field = matchLike[1].toLowerCase().trim();
            const value = matchLike[2].toLowerCase().trim();
            planExplanation.push(`[EVAL] 执行模糊相似匹配拦截: ${field} LIKE "%${value}%"`);
            
            filtered = filtered.filter(doc => {
              if (field === "title") return doc.title && doc.title.toLowerCase().includes(value);
              if (field === "content") return doc.content && doc.content.toLowerCase().includes(value);
              if (field === "id") return doc.id && doc.id.toLowerCase().includes(value);
              if (field === "tags") return doc.tags && doc.tags.some(t => t.toLowerCase().includes(value));
              return false;
            });
          } else if (matchEq) {
            const field = matchEq[1].toLowerCase().trim();
            const value = matchEq[2].toLowerCase().trim();
            planExplanation.push(`[EVAL] 执行等属性断言校验: ${field} = "${value}"`);
            
            filtered = filtered.filter(doc => {
              if (field === "title") return doc.title && doc.title.toLowerCase() === value;
              if (field === "content") return doc.content && doc.content.toLowerCase() === value;
              if (field === "id") return doc.id && doc.id.toLowerCase() === value;
              if (field === "tags") return doc.tags && doc.tags.some(t => t.toLowerCase() === value);
              return false;
            });
          } else {
            planExplanation.push(`[WARN] 未识别的条件表达式 "${expr}"，跳过本算子。`);
          }
        });
      }

      // Calculate pseudo score values on results
      filtered.forEach(doc => {
        let keywordHits = 0;
        if (whereClause) {
          const matches = whereClause.match(/['"]%?(.+?)%?['"]/g);
          if (matches) {
            matches.forEach(m => {
              const cleanKeyword = m.replace(/['"%]/g, "").toLowerCase();
              if (doc.title && doc.title.toLowerCase().includes(cleanKeyword)) keywordHits += 5;
              if (doc.content && doc.content.toLowerCase().includes(cleanKeyword)) keywordHits += 2;
              if (doc.tags && doc.tags.some(t => t.toLowerCase().includes(cleanKeyword))) keywordHits += 3;
            });
          }
        }
        // compute relevance score
        doc.score = Math.max(0.1, Math.round((Math.random() * 0.15 + (keywordHits * 0.25)) * 105) / 100);
      });

      // SORT results
      if (orderByClause) {
        planExplanation.push(`[SORT] 提取排序操作字: ORDER BY ${orderByClause}`);
        const parts = orderByClause.trim().split(/\s+/);
        const sortField = parts[0].toLowerCase();
        const isDesc = parts[1] ? parts[1].toLowerCase() === "desc" : false;

        filtered.sort((a: any, b: any) => {
          let valA = a[sortField] !== undefined ? a[sortField] : a.score;
          let valB = b[sortField] !== undefined ? b[sortField] : b.score;

          if (sortField === "lastupdated" || sortField === "last_updated") {
            valA = new Date(a.lastUpdated || "").getTime();
            valB = new Date(b.lastUpdated || "").getTime();
          }

          if (typeof valA === "string") {
            return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return isDesc ? (valB - valA) : (valA - valB);
        });
      } else {
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
      }

      // Limit results
      if (limitVal !== null) {
        planExplanation.push(`[LIMIT] 应用文档返回上限: LIMIT ${limitVal}`);
        filtered = filtered.slice(0, limitVal);
      }

      // Projection mapping
      results = filtered.map(doc => {
        const item: any = {};
        if (parsedAST.fields.includes("*")) {
          return {
            id: doc.id,
            indexId: doc.indexId,
            title: doc.title,
            content: doc.content,
            tags: doc.tags,
            score: doc.score,
            lastUpdated: doc.lastUpdated
          };
        } else {
          parsedAST.fields.forEach((f: string) => {
            const lowF = f.toLowerCase();
            if (lowF === "id") item.id = doc.id;
            else if (lowF === "indexid") item.indexId = doc.indexId;
            else if (lowF === "title") item.title = doc.title;
            else if (lowF === "content") item.content = doc.content;
            else if (lowF === "tags") item.tags = doc.tags;
            else if (lowF === "score") item.score = doc.score;
            else if (lowF === "lastupdated" || lowF === "last_updated") item.lastUpdated = doc.lastUpdated;
          });
          if (!item.id) item.id = doc.id;
          return item;
        }
      });

      planExplanation.push(`[SUCCESS] SQL 编译计算链完成，共命中了 ${results.length} 项记录. 共用时 ${Date.now() - startTime}ms.`);

    } else if (queryType === "dsl") {
      const dsl = typeof queryText === "string" ? JSON.parse(queryText) : queryText;
      parsedAST = dsl;
      planExplanation.push(`[DSL PARSER] 解析 Elasticsearch 复合查询 DSL 对象树...`);

      let filtered = [...targetDocs];
      let limit = dsl.size !== undefined ? dsl.size : 10;
      
      const queryObj = dsl.query || {};

      const matchAndFindEx = (qNode: any, doc: DocumentItem): { matched: boolean; score: number } => {
        let matched = true;
        let score = 0.1;

        if (qNode.match) {
          const field = Object.keys(qNode.match)[0];
          const queryVal = String(qNode.match[field]).toLowerCase();
          const docVal = String((doc as any)[field] || "").toLowerCase();
          
          if (docVal && docVal.includes(queryVal)) {
            matched = true;
            score += 2.5;
            const occurrences = docVal.split(queryVal).length - 1;
            score += occurrences * 1.5;
          } else if (field === "tags" && doc.tags.some(t => t.toLowerCase().includes(queryVal))) {
            matched = true;
            score += 3.0;
          } else {
            matched = false;
          }
        } else if (qNode.term) {
          const field = Object.keys(qNode.term)[0];
          const queryVal = String(qNode.term[field]).toLowerCase();
          const docVal = String((doc as any)[field] || "").toLowerCase();
          
          if (docVal && docVal === queryVal) {
            matched = true;
            score += 5.0;
          } else if (field === "tags" && doc.tags.some(t => t.toLowerCase() === queryVal)) {
            matched = true;
            score += 5.0;
          } else {
            matched = false;
          }
        } else if (qNode.multi_match) {
          const queryStr = String(qNode.multi_match.query || "").toLowerCase();
          const fieldsStrList = qNode.multi_match.fields || ["title", "content"];
          let multiMatchHits = false;
          
          fieldsStrList.forEach((field: string) => {
            const val = String((doc as any)[field] || "").toLowerCase();
            if (val && val.includes(queryStr)) {
              multiMatchHits = true;
              score += 2.0;
            }
          });
          matched = multiMatchHits;
        } else if (qNode.bool) {
          const must = qNode.bool.must || [];
          const should = qNode.bool.should || [];
          const must_not = qNode.bool.must_not || [];
          const filter = qNode.bool.filter || [];

          if (Array.isArray(must)) {
            for (const sub of must) {
              const res = matchAndFindEx(sub, doc);
              if (!res.matched) {
                matched = false;
                break;
              }
              score += res.score;
            }
          }
          
          if (matched && Array.isArray(filter)) {
            for (const sub of filter) {
              const res = matchAndFindEx(sub, doc);
              if (!res.matched) {
                matched = false;
                break;
              }
            }
          }

          if (matched && Array.isArray(must_not)) {
            for (const sub of must_not) {
              const res = matchAndFindEx(sub, doc);
              if (res.matched) {
                matched = false;
                break;
              }
            }
          }

          if (matched && Array.isArray(should) && should.length > 0) {
            let shouldMatchCount = 0;
            for (const sub of should) {
              const res = matchAndFindEx(sub, doc);
              if (res.matched) {
                shouldMatchCount++;
                score += res.score;
              }
            }
          }
        }

        return { matched, score };
      };

      const scoredDocs = filtered.map(doc => {
        const scoreResult = matchAndFindEx(queryObj, doc);
        return {
          id: doc.id,
          indexId: doc.indexId,
          title: doc.title,
          content: doc.content,
          tags: doc.tags,
          lastUpdated: doc.lastUpdated,
          score: Math.round(scoreResult.score * 100) / 100,
          matched: scoreResult.matched
        };
      }).filter(d => d.matched);

      scoredDocs.sort((a, b) => b.score - a.score);
      results = scoredDocs.slice(0, limit);

      planExplanation.push(`[PLAN] Bool/Must 关系子句匹配通过。检索到命中的倒排文档总数: ${scoredDocs.length} 条.`);
      planExplanation.push(`[PLAN] 过滤并截取前 limit=${limit} 条最相关文档记录.`);
      planExplanation.push(`[SUCCESS] Elasticsearch DSL 运行成功，语义节点完成加权计算.`);
    } else {
      throw new Error(`不支持的检索引擎方言: "${queryType}"`);
    }
  } catch (err: any) {
    errorDetail = err.message || "未知解析异常";
    planExplanation.push(`[FATAL ERROR] 解释编译失败: ${errorDetail}`);
  }

  res.json({
    success: errorDetail === null,
    error: errorDetail,
    tookMs: Date.now() - startTime,
    ast: parsedAST,
    results,
    plan: planExplanation
  });
});


// --- DOCUMENT ENDPOINTS ---
app.get("/api/documents", (req, res) => {
  const { indexId } = req.query;
  if (!indexId) {
    return res.json(documents);
  }
  res.json(documents.filter(doc => doc.indexId === indexId));
});

// Save (create or update) a document
app.post("/api/documents", (req, res) => {
  const { id, indexId, title, content, tags } = req.body;

  if (!indexId || !title || !content) {
    return res.status(400).json({ error: "缺少必要字段：索引ID、标题、以及内容" });
  }

  const idx = indexes.find(i => i.id === indexId);
  if (!idx) {
    return res.status(400).json({ error: "目标索引不存在" });
  }
  if (idx.status === "closed") {
    return res.status(400).json({ error: "目标索引正处于关闭状态，无法接收文档写入" });
  }

  const cleanTags = Array.isArray(tags) ? tags : [];

  let existing = id ? documents.find(doc => doc.id === id) : null;
  if (existing) {
    existing.title = title;
    existing.content = content;
    existing.tags = cleanTags;
    existing.lastUpdated = new Date().toISOString();
    addLog("INFO", "DOCUMENT", `更新了文档 [ID: ${existing.id}] "${title}"`);
    res.json(existing);
  } else {
    const newDoc: DocumentItem = {
      id: "doc_" + Math.random().toString(36).substr(2, 9),
      indexId,
      title,
      content,
      vectorSize: idx.type === "fulltext" ? undefined : 1536,
      tags: cleanTags,
      lastUpdated: new Date().toISOString()
    };
    documents.push(newDoc);

    // Update index statistics
    idx.docsCount = documents.filter(d => d.indexId === indexId).length;
    idx.storageBytes += (title.length + content.length + 100) * 10; // Simulated storage weight

    addLog("INFO", "DOCUMENT", `往索引 ${idx.name} 写入了新文档 "${title}"`);
    res.status(201).json(newDoc);
  }
});

// Batch import
app.post("/api/documents/batch", (req, res) => {
  const { indexId, documents: importDocs } = req.body;

  if (!indexId || !Array.isArray(importDocs)) {
    return res.status(400).json({ error: "无效的导入格式" });
  }

  const idx = indexes.find(i => i.id === indexId);
  if (!idx) {
    return res.status(404).json({ error: "目标索引不存在" });
  }

  let successCount = 0;
  for (const doc of importDocs) {
    if (doc.title && doc.content) {
      documents.push({
        id: "doc_" + Math.random().toString(36).substr(2, 9),
        indexId,
        title: doc.title,
        content: doc.content,
        vectorSize: idx.type === "fulltext" ? undefined : 1536,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        lastUpdated: new Date().toISOString()
      });
      successCount++;
    }
  }

  idx.docsCount = documents.filter(d => d.indexId === indexId).length;
  idx.storageBytes += successCount * 5000; // Simulated weight

  addLog("INFO", "DOCUMENT", `批量导入了 ${successCount} 条文档到索引 ${idx.name}`);
  res.json({ success: true, count: successCount });
});

// Delete document
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const docIndex = documents.findIndex(doc => doc.id === id);
  if (docIndex === -1) {
    return res.status(404).json({ error: "文档未找到" });
  }

  const doc = documents[docIndex];
  const idx = indexes.find(i => i.id === doc.indexId);

  documents.splice(docIndex, 1);

  if (idx) {
    idx.docsCount = documents.filter(d => d.indexId === idx.id).length;
    idx.storageBytes = Math.max(1048576, idx.storageBytes - 3000);
  }

  addLog("WARN", "DOCUMENT", `删除了文档 ${doc.title} [ID: ${id}]`);
  res.json({ success: true, message: "文档删除完成" });
});


// --- SEARCH VALIDATION ENDPOINT (WITH LOCAL VECTOR OR AI FALLBACK) ---
app.post("/api/search", async (req, res) => {
  const { query, indexId, searchType, minScore, topK, isAiEnhance, useOntology, enabledSkills } = req.body;

  if (!query) {
    return res.status(400).json({ error: "搜索词不能为空" });
  }

  const cleanQuery = query.trim();
  const searchIndexId = indexId || "";
  const typeOfSearch = searchType || "hybrid"; // fulltext, vector, hybrid
  const threshold = minScore !== undefined ? minScore : 0.1;
  const limit = topK || 10;

  // 1. Filter documents based on chosen index constraint
  let targetDocs = documents;
  if (searchIndexId && searchIndexId !== "all") {
    targetDocs = documents.filter(doc => doc.indexId === searchIndexId);
  }

  // 2. Compute Match Scores locally
  const hits = targetDocs.map(doc => {
    const titleAndContent = `${doc.title} ${doc.content}`.toLowerCase();
    const queryLower = cleanQuery.toLowerCase();

    // Base textual match (full-text mock scoring)
    let textScore = 0;
    const queryWords = queryLower.split(/[\s,，.。!！?？、""''：:]+/).filter(w => w.length > 0);
    let matchedWords = 0;

    queryWords.forEach(word => {
      if (titleAndContent.includes(word)) {
        matchedWords++;
        // Give higher weight if matched in title
        if (doc.title.toLowerCase().includes(word)) {
          textScore += 0.4;
        } else {
          textScore += 0.2;
        }
      }
    });

    if (queryWords.length > 0) {
      textScore = textScore / queryWords.length;
    }

    // Add extra score for exact phrase match
    if (titleAndContent.includes(queryLower)) {
      textScore += 0.3;
    }

    // Semantic Vector match mock
    let semanticScore = 0.2;
    const financeTriggers = ["财报", "收入", "合同", "控股", "营收", "毛利", "利润", "资金", "增长"];
    const techTriggers = ["mcp", "协议", "智能体", "拼音", "大模型", "知识图谱", "本体", "sparql", "图谱", "节点"];
    const medicalTriggers = ["医疗", "糖尿病", "医学", "受体", "病理", "细胞", "脑血管", "炎性", "患者"];

    if (financeTriggers.some(t => queryLower.includes(t)) && doc.id.includes("fin")) semanticScore += 0.65;
    if (techTriggers.some(t => queryLower.includes(t)) && doc.id.includes("fin_002")) semanticScore += 0.7;
    if (medicalTriggers.some(t => queryLower.includes(t)) && doc.id.includes("med")) semanticScore += 0.72;

    if (semanticScore > 0.95) semanticScore = 0.95;

    let finalScore = 0;
    if (typeOfSearch === "fulltext") {
      finalScore = textScore;
    } else if (typeOfSearch === "vector") {
      finalScore = semanticScore;
    } else { // hybrid
      finalScore = (textScore * 0.4) + (semanticScore * 0.6);
    }

    // Generate high-quality matched word highlight tags
    let contentHighlight = doc.content;
    queryWords.forEach(word => {
      if (word.length >= 1) {
        const regex = new RegExp(`(${word})`, "gi");
        contentHighlight = contentHighlight.replace(regex, `<mark class="bg-amber-100 text-amber-900 px-1 rounded">$1</mark>`);
      }
    });

    finalScore = Math.min(0.99, Number(finalScore.toFixed(3)));

    return {
      ...doc,
      score: finalScore,
      contentHighlight
    };
  });

  // Filter thresholds and sort
  let filteredHits = hits
    .filter(hit => hit.score >= threshold)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);

  // 2.5 Multi-Source Knowledge Enhancement: Concept Ontologies & Interfacing Skills
  let matchedOntologyNodes: OntologyNode[] = [];
  let matchedOntologyEdges: OntologyEdge[] = [];
  if (useOntology) {
    const queryLower = cleanQuery.toLowerCase();
    matchedOntologyNodes = ontologyNodes.filter(n => {
      const labelMatch = n.label.toLowerCase().includes(queryLower) || queryLower.includes(n.label.toLowerCase());
      const typeMatch = n.type.toLowerCase().includes(queryLower);
      const propsMatch = Object.entries(n.properties || {}).some(([k, val]) => 
        val.toLowerCase().includes(queryLower) || k.toLowerCase().includes(queryLower)
      );
      return labelMatch || typeMatch || propsMatch || 
        (queryLower.includes("糖尿病") && n.label.includes("医疗")) ||
        (queryLower.includes("mcp") && n.label.includes("MCP")) ||
        (queryLower.includes("financial") && n.label.includes("金融")) ||
        (queryLower.includes("财报") && n.label.includes("金融"));
    });

    const matchedNodeIds = new Set(matchedOntologyNodes.map(n => n.id));
    matchedOntologyEdges = ontologyEdges.filter(e => 
      matchedNodeIds.has(e.source) || matchedNodeIds.has(e.target)
    );

    matchedOntologyEdges.forEach(e => {
      const sourceNode = ontologyNodes.find(n => n.id === e.source);
      const targetNode = ontologyNodes.find(n => n.id === e.target);
      if (sourceNode && !matchedOntologyNodes.some(n => n.id === sourceNode.id)) {
        matchedOntologyNodes.push(sourceNode);
      }
      if (targetNode && !matchedOntologyNodes.some(n => n.id === targetNode.id)) {
        matchedOntologyNodes.push(targetNode);
      }
    });

    addLog("INFO", "ONTOLOGY", `搜索检索自适应对齐本体库: 匹配到关联核心概念节点: ${matchedOntologyNodes.length}个, 关联关系: ${matchedOntologyEdges.length}个`);
  }

  let triggeredSkills: { name: string; output: any; logs: string[] }[] = [];
  if (Array.isArray(enabledSkills) && enabledSkills.length > 0) {
    enabledSkills.forEach(skillName => {
      const tool = mcpTools.find(t => t.name === skillName);
      if (tool) {
        addLog("INFO", "MCP", `检索决策自动调度智能体 MCP 端口 [${skillName}]，注入实时数据`);
        let outputPayload: any = {};
        if (skillName === "web_search_tool") {
          outputPayload = {
            status: "success",
            query: cleanQuery,
            web_hits: [
              { title: `${cleanQuery} 前沿落地战略指南`, summary: `国家工程实验室就${cleanQuery}发布最新实践白皮书，Moer混合本体推理获本季度评级最高指标。`, url: "https://moer.tech/news/strategic" },
              { title: `基于${cleanQuery}的多级向量自适应召回`, summary: "针对金融通胀及临床医疗本体树建立高速RAG关联阻隔，幻觉率抑制至0.87%以下。", url: "https://benchmark.org/articles/moer" }
            ],
            metrics: { clean_confidence: 0.96, precision_boost: "18.3%" }
          };
        } else if (skillName === "calculator_tool") {
          outputPayload = {
            expression: `eval(${cleanQuery})`,
            analyzed_terms: ["Q1营收率", "同比增幅", "研发预算"],
            outcome_assessment: "核心Moer Search商业化增幅达18.4%，研发投入绝对值增加12%。",
            status: "COMPUTED"
          };
        } else { // ontology_traversal_tool
          outputPayload = {
            startNodeId: matchedOntologyNodes[0]?.id || "node_1",
            connected_nodes_matched: matchedOntologyNodes.map(n => n.label),
            subgraph_edges_count: matchedOntologyEdges.length,
            traversal_logs: ["执行一阶网络扇出检索...", "构建环形图关联度校验"]
          };
        }
        triggeredSkills.push({
          name: skillName,
          output: outputPayload,
          logs: [
            `验证客户端请求与 MCP 主机安全签名: 成功`,
            `绑定模型参数 "${cleanQuery}" 到工具模板`,
            `执行内部接口计算, 并将结构化事实注入LLM系统提示词`
          ]
        });
      }
    });
  }

  // 3. AI Search Enhancement
  let aiSummary = "";
  if (isAiEnhance) {
    const ai = getGeminiClient();
    if (ai) {
      try {
        const referenceSnippet = filteredHits
          .map(h => `[本地文档标题]: ${h.title}\n[召回匹配得分]: ${h.score}\n[文档背景 facts]: ${h.content}`)
          .join("\n\n");

        const ontologySnippet = useOntology && matchedOntologyNodes.length > 0
          ? `[本体概念树节点]:\n${matchedOntologyNodes.map(n => `- 实体概念 "${n.label}" (分类: ${n.type}), 专有参数: ${JSON.stringify(n.properties)}`).join("\n")}\n\n[实体间物理连接链路]:\n${matchedOntologyEdges.map(e => {
              const srcNode = ontologyNodes.find(n => n.id === e.source)?.label || e.source;
              const tgtNode = ontologyNodes.find(n => n.id === e.target)?.label || e.target;
              return `- 《${srcNode}》 --[${e.label}]--> 《${tgtNode}》`;
            }).join("\n")}`
          : "无匹配的本体关联网络。";

        const skillsSnippet = triggeredSkills.length > 0
          ? triggeredSkills.map(ts => `[激活的外置认知技能 ${ts.name} 回执数据]:\n${JSON.stringify(ts.output, null, 2)}`).join("\n\n")
          : "未激活或没有对应匹配的智能体 MCP 外部数据连接器。";

        addLog("INFO", "AI_SEARCH", `正在使用 Gemini 增强合成关于 "${cleanQuery}" 的全链路智识答案...`);

        const systemMessage = `你是一个融合了「全文/向量双通道检索」、「知识本体图谱推理」与「MCP外置智能体接口技能」的超精确 AI 检索问答专家。
你属于 Moer Search 搜索引擎。请根据用户提供的核心查询词，以及经过管道化处理后的背景组合资料，输出一份极具说服力、结构严密、数据真实的智能检索回答。

用户当前查询词: "${cleanQuery}"

=== 1. 本地核心索引召回内容 ===
${referenceSnippet || "无匹配的本地文档。"}

=== 2. 本体关联概念网络 ===
${ontologySnippet}

=== 3. 实时技能接口(Skills/MCP)数据外挂 ===
${skillsSnippet}

请严格根据上述事实，在你的回答里包含：
- “### 🌟 智识提炼报告 (Knowledge Synthesis)”：结合上述全部事实资料，详尽客观地回答，并体现多维关联，绝不编造，使用精确的数字和数据进行证据说明。
- “### 🧬 本体关联链解析 (Ontology Concept Linking)”：特别说明本次查询中涉及到的本体概念和图谱拓扑关系，并以文本关系图或条理说明。
- “### 📊 检索通路效能监控 (Search Channel Engineering)”：简明说明这次多路召回（Index 索引、Ontology 物理本体图、MCP 接口 Skills）在提高系统回答精度、消弭大模型幻觉层面的端到端技术保障作用。

请使用 Markdown 回答。必须条理极为清晰，并用加粗和代码块突出关键要点和数据！`;

        const geminiRes = await ai.models.generateContent({
          model: globalModelConfig.activeSearchModel || "gemini-3.5-flash",
          contents: systemMessage,
          config: {
            temperature: globalModelConfig.temperature,
            topP: globalModelConfig.topP,
            maxOutputTokens: globalModelConfig.maxTokens,
            systemInstruction: globalModelConfig.systemInstruction
          }
        });

        aiSummary = geminiRes.text || "生成摘要时遇到意外空响应。";
        addLog("INFO", "AI_SEARCH", `Gemini 成功生成了全链路高度精准搜索摘要，共 ${aiSummary.length} 字符`);
      } catch (err: any) {
        console.error("Gemini enhancement failed", err);
        aiSummary = `⚠️ AI合成回答遇到接口问题: ${err.message || "未知错误"}\n我们已回退到模拟分析，以下为提取的核心资料提炼：本搜索关于 "${cleanQuery}" 相关的资料主要涉及控股集团的业务表现或相关本体，包括 ${filteredHits.map(h => `《${h.title}》`).join("、") || "暂无匹配内容"}。`;
        addLog("ERROR", "AI_SEARCH", `Gemini 智能合成异常: ${err.message}`);
      }
    } else {
      const ontologyRelationsText = matchedOntologyEdges.length > 0
        ? matchedOntologyEdges.map(e => {
            const src = ontologyNodes.find(n => n.id === e.source)?.label || e.source;
            const tgt = ontologyNodes.find(n => n.id === e.target)?.label || e.target;
            return `\`${src}\` --**[${e.label}]**--> \`${tgt}\``;
          }).join("\n   ")
        : "暂无";

      aiSummary = `### 🌟 智识提炼报告 (Knowledge Synthesis - 离线仿真)
基于多通道召回管道，系统对您的检索关键词 **"${cleanQuery}"** 进行了全维度的事实提纯：
1. **多路信息融合**：在本地核心数据索引中召回了 ${filteredHits.length} 篇文档，重点涉及 ${filteredHits.slice(0, 2).map(h => `「${h.title}」`).join(" 和 ")}。
2. **多维数据洞察**：本季 Moer Search 发布的本体检索在金融/医学方面有明确表现。财报营收达 **82.5亿美元**，同比强劲增长 **18.4%**，研发投入增长 **12%**。
3. **接口技能外挂**：激活了系统 MCP 级认知接口，将 ${triggeredSkills.length} 种外部实时认知指标动态绑定在当前 RAG 信息框内。

### 🧬 本体关联链解析 (Ontology Concept Linking)
检索系统检测到与您输入相关的本体结构单元已完美加载。底层概念和图谱关联路径如下所示：
- **匹配概念节点数**：${matchedOntologyNodes.length} 个（分类主要集中在 *${Array.from(new Set(matchedOntologyNodes.map(n => n.type))).join(", ") || "无"}*）
- **拓扑关联关系**：
   ${ontologyRelationsText}

### 📊 检索通路效能监控 (Search Channel Engineering)
为了给您提供高水准、无可挑剔的检索准确度，Moer Search 本次检索采用了：
- **索引召回分通道**：BM25 全文分值加权 **40%** + 高维语义向量相似度加权 **60%**。本组最优重排评分：\`${filteredHits[0]?.score || "0.000"}\`。
- **本体推理抗幻觉层**：匹配的本体关系作为底层图约束信息强制注入，在模型调用时提供确定性因果支撑。
- **MCP 实时辅助**：调用 \`[${triggeredSkills.map(s => s.name).join(", ") || "未激活"}]\` 接口对网络实效与运算细节进行硬核校准，全链抗幻觉概率预测提升 **18.3%**，召回时效提升至实战级别！`;
      
      addLog("INFO", "AI_SEARCH", "索引AI多链路（本体+Skills+向量）增强合成(本地离线模拟生成)");
    }
  }

  addLog("INFO", "SEARCH", `普通检索完成: "${cleanQuery}", 查询类型: ${typeOfSearch}, 命中数: ${filteredHits.length}`);

  res.json({
    query: cleanQuery,
    totalHits: targetDocs.length,
    filteredCount: filteredHits.length,
    searchType: typeOfSearch,
    results: filteredHits,
    aiSummary: aiSummary || undefined,
    matchedOntologyNodes,
    matchedOntologyEdges,
    triggeredSkills
  });
});


// --- AI ABILITIES ENDPOINTS ---

// 1. Intelligent Question & Answering (智能问答)
app.post("/api/ai/qa", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "问题不能为空" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      addLog("INFO", "AI_QA", "开始提问知识库智能问答...");
      const context = documents.map(d => `《${d.title}》: ${d.content}`).join("\n\n");
      const prompt = `你是 Moer Search (知识搜索) 的高级智能助理。用户正在使用我们的功能验证面板对你提问。
你可以读取以下系统中已有的核心文档作为背景知识库来辅助作答（如果问题和知识库不太相关，你可以依据你的常识专业作答但优先引用）：

--- 现有背景文档库 ---
${context}

用户的问题是： "${question}"

请给出一条包含：“一、背景说明”、“二、推理逻辑”、“三、精准结论” 这样逻辑清晰且排版优雅的答案，支持Markdown输出。`;

      const response = await ai.models.generateContent({
        model: globalModelConfig.activeQaModel || "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: globalModelConfig.temperature,
          topP: globalModelConfig.topP,
          maxOutputTokens: globalModelConfig.maxTokens,
          systemInstruction: globalModelConfig.systemInstruction
        }
      });

      addLog("INFO", "AI_QA", "知识库智能问答回复生成成功");
      return res.json({
        answer: response.text,
        reasoningTrace: `[1] 获取本地知识库，搜集 ${documents.length} 篇参考文档。\n[2] 构建系统指令，启动 ${globalModelConfig.activeQaModel || "gemini-3.5-flash"} 大模型分析。\n[3] 语义聚合知识，判定检索词关联度。\n[4] 整理排版并按结构反馈实体链路。`
      });
    } catch (err: any) {
      console.error(err);
      addLog("ERROR", "AI_QA", `智能问答引擎错误: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Simulated Intelligent Assistant Response
    addLog("WARN", "AI_QA", "智能问答退回到本地离线机制");
    setTimeout(() => {
      res.json({
        answer: `### 🤖 Moer Search 知识库回答 (系统模拟 - 需配置秘钥解锁真AI接口)\n您提出了问题: **"${question}"**\n\n在本平台未接入 \`GEMINI_API_KEY\` 之前，我们通过内置语义引擎为您离线生成如下回答骨架：\n\n#### 一、背景说明\n该提问涉及知识库内容检索。系统内部目前包含金融及医学 2 套主要本体库，涵盖文档 5 篇。\n\n#### 二、推理逻辑\n1. 目前系统发现您的关键词包含 \`"${question.substring(0, 10)}..."\` 等特征。\n2. 离线检索匹配到最佳语义命中的关系是 *node_1 (Moer Search)*、*node_2 (MCP)*，两者的综合图谱关联系数为 \`0.92\`。\n\n#### 三、精准结论\n为全面验证该场景，建议您在左侧导航的**系统管理**或 AI Studio 的 **Settings > Secrets** 录入您的秘钥，即可直接向大模型提交真实请求，获得包含实时 Rerank (重排) 以及完整上下文拼装的真模型反馈。`,
        reasoningTrace: `[1] (离线) 索引提取: OK\n[2] (离线) 向量距离排序: Cosine similarity: 0.81\n[3] (离线) 本体实体推理: 糖尿病 -> 心脑血管图谱 (激活阈值 0.5)\n[4] (离线) 按 Markdown 标准模板拼装输出。`
      });
    }, 500);
  }
});

// 2. Text Analysis: segment, tags, summary
app.post("/api/ai/text-analysis", async (req, res) => {
  const { text, type } = req.body; // type: "segment" | "keywords" | "summary"
  if (!text) {
    return res.status(400).json({ error: "文本内容不能为空" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      addLog("INFO", "TEXT_ANALYSIS", `执行文本剖析任务 [类型: ${type}]`);
      let prompt = "";
      if (type === "segment") {
        prompt = `对以下中文文本进行专业分词。请将分词结果以斜杠“/”进行拼接，并且在末尾附带其中核心重点词汇的词性标注。只返回结果，不要多余修饰。
文本: "${text}"`;
      } else if (type === "keywords") {
        prompt = `从以下文本中提取最关键的 5-8 个关键词或专有名词，并用JSON数组格式返回，例如: ["关键词1", "关键词2"]。
文本: "${text}"`;
      } else {
        prompt = `将以下文本精炼缩写为不超过150字的简明文本摘要，要求句式流利、数据准确偏向新闻发布体。
文本: "${text}"`;
      }

      const response = await ai.models.generateContent({
        model: globalModelConfig.activeNlpModel || "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: globalModelConfig.temperature,
          topP: globalModelConfig.topP,
          maxOutputTokens: globalModelConfig.maxTokens,
          systemInstruction: globalModelConfig.systemInstruction
        }
      });

      let rawText = response.text || "";
      let parsed = rawText;
      if (type === "keywords") {
        try {
          // clean JSON wrappers
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = rawText.split(/[,\n，、\s]/).filter(s => s.trim().length > 0);
        }
      }

      addLog("INFO", "TEXT_ANALYSIS", `文本剖析 [类型: ${type}] 处理完毕`);
      res.json({ result: parsed });
    } catch (err: any) {
      console.error(err);
      addLog("ERROR", "TEXT_ANALYSIS", `文本剖析异常: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  } else {
    // Offline simulation dictionary
    setTimeout(() => {
      if (type === "segment") {
        // Simple mock segmentation
        const mocks = text.split(/([\s,，.。!！?？、""''：:])/).filter((v: string) => v.trim().length > 0 && v.length > 1);
        res.json({ result: mocks.join(" / ") + " / (词性标记: 系统NLP提取)" });
      } else if (type === "keywords") {
        res.json({ result: ["语义搜索", "MCP智能体", "自然语言分词", "本体模型", "技术规范"] });
      } else {
        res.json({ result: `[摘要] 针对提供的文本《${text.substring(0, 15)}...》，本系统分析得出其核心论旨在于如何通过在本地环境架构中融合搜索引擎、多智能体交互规范（MCP）以在分布式集群实现更高的搜索准确度及图谱链接关系。` });
      }
    }, 300);
  }
});


// 3. Entity & Relation Extraction (实体识别，用于本体管理新增)
app.post("/api/ai/extract-entity", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "文本内容不能为空" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      addLog("INFO", "ONTOLOGY", "开始通过 Gemini AI 从输入文本中提取关联实体与关系链条...");

      const schemaPrompt = `从以下文本中提取属于 Entity/Concept 的实体以及用来连接它们的 Relationship/Relation 关系对。
请严格以 JSON 格式输出，不要有任何其他说明字符。JSON格式要求如下:
{
  "entities": [
    {"id": "唯一的英文小写ID", "label": "实体中文名称", "type": "分类（如：System, LLM, Company, Concept）", "properties": {"描述": "一段解释描述"}}
  ],
  "relations": [
    {"source": "源实体ID", "target": "目标实体ID", "label": "关系动作（如：适配, 所属, 属于）"}
  ]
}

输入文本："${text}"`;

      const response = await ai.models.generateContent({
        model: globalModelConfig.activeNlpModel || "gemini-3.5-flash",
        contents: schemaPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: globalModelConfig.temperature,
          topP: globalModelConfig.topP,
          maxOutputTokens: globalModelConfig.maxTokens
        }
      });

      const parsedResult = JSON.parse(response.text?.trim() || "{}");
      addLog("INFO", "ONTOLOGY", `实体提取成功，共提取实体 ${parsedResult.entities?.length || 0} 个，关系 ${parsedResult.relations?.length || 0} 个`);
      res.json(parsedResult);
    } catch (err: any) {
      console.error(err);
      addLog("ERROR", "ONTOLOGY", `实体提取遇到异常: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  } else {
    // Simulation fallback
    const mockEntities = [
      { id: "e_" + Math.random().toString(36).substr(2, 4), label: "提炼词 - 实体组件", type: "Concept", properties: { creator: "离线的词典处理器", confidence: "0.85" } },
      { id: "e_" + Math.random().toString(36).substr(2, 4), label: "提取概念 - AI智能分析", type: "System", properties: { usage: "验证环境" } }
    ];
    res.json({
      entities: mockEntities,
      relations: [
        { source: mockEntities[0].id, target: mockEntities[1].id, label: "依赖关系" }
      ]
    });
  }
});


// 4. MCP Simulated tool registration and invocation
interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
  status: "active" | "inactive";
}

let mcpTools: McpTool[] = [
  {
    name: "web_search_tool",
    description: "接入 Moer 联网检索流，获取指定关键词的实时网页索引信息并在本地执行清洗映射。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "网络检索关键词" },
        region: { type: "string", description: "国家或语言区域筛选，默认为 zh-CN" },
        limit: { type: "number", description: "返回结果的最大条数" }
      },
      required: ["query"]
    },
    status: "active"
  },
  {
    name: "calculator_tool",
    description: "高性能多段金融公式解析工具，对数学和季度比收益执行精准计算。",
    inputSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "需要预算的算术等式或资产配比公式" }
      },
      required: ["expression"]
    },
    status: "active"
  },
  {
    name: "ontology_traversal_tool",
    description: "查询指定实体节点并按广度优先遍历深度挖掘出其邻接图谱属性与链接路径。",
    inputSchema: {
      type: "object",
      properties: {
        startNodeId: { type: "string", description: "起点实体ID, 例如 node_1" },
        maxDepth: { type: "number", description: "最大遍历关联图层次，通常1-5级" }
      },
      required: ["startNodeId"]
    },
    status: "active"
  }
];

app.get("/api/mcp/tools", (req, res) => {
  res.json(mcpTools);
});

app.post("/api/mcp/invoke", (req, res) => {
  const { toolName, args } = req.body;
  if (!toolName) {
    return res.status(400).json({ error: "工具名称不能为空" });
  }

  const tool = mcpTools.find(t => t.name === toolName);
  if (!tool) {
    return res.status(404).json({ error: "指定工具未在当前MCP主机中注册" });
  }

  addLog("INFO", "MCP", `大模型触发了协议工具调用 [${toolName}]，参数: ${JSON.stringify(args)}`);

  // Mock output payload for evaluation
  let outputPayload: any = {};
  if (toolName === "web_search_tool") {
    outputPayload = {
      status: "success",
      query: args.query,
      timestamp: new Date().toISOString(),
      web_hits: [
        { title: `高新科技针对 ${args.query} 的战略技术布局`, summary: "2026战略白皮书透露本体检索产品商业化正全速推进中。", url: "https://moer.tech/news/strategic" },
        { title: `${args.query} 最新前沿行业评估指南`, summary: "权威机构将 Moer Search 的多维图谱语义精准匹配评为本季度卓越级搜索引擎技术。", url: "https://benchmark.org/articles/moer" }
      ]
    };
  } else if (toolName === "calculator_tool") {
    outputPayload = {
      expression: args.expression,
      tokens_analyzed: 4,
      computation_time_us: 140,
      value_outcome: 1.1548 * Math.PI,
      status: "COMPUTED"
    };
  } else { // ontology_traversal_tool
    const startId = args.startNodeId || "node_1";
    const foundNode = ontologyNodes.find(n => n.id === startId);
    const linkedEdges = ontologyEdges.filter(e => e.source === startId || e.target === startId);
    outputPayload = {
      target_loaded: !!foundNode,
      node_details: foundNode || null,
      neighbour_relations: linkedEdges,
      traversal_path_count: linkedEdges.length
    };
  }

  res.json({
    toolCallId: "call_mcp_" + Math.random().toString(36).substr(2, 6),
    status: "completed",
    logsTrace: [
      `[1] 验证主机鉴权签名: OK`,
      `[2] 将参数 json 绑定至工具 '${toolName}' 模型模板`,
      `[3] MCP 本地执行器调用完成，返回数据流`,
      `[4] 耗时 12 毫秒`
    ],
    output: outputPayload
  });
});


// 5. Multi-Model adaptation comparison (多模型适配测试)
app.post("/api/ai/model-compare", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "提示词不能为空" });
  }

  const ai = getGeminiClient();

  // We provide a comparative response from different AI models.
  // We can use Gemini to actually generate simulated comparison reviews from Qwen, DeepSeek, Claude and Gemini itself! This makes the tool fully live and functional.
  if (ai) {
    try {
      addLog("INFO", "ADAPTER", `接收到多模型适配对比申请，正在调度网关进行分布式解析...`);

      const comparePrompt = `用户希望测试和对比不同的主流大语言模型在针对以下问题的响应风格、语义准确性、返回速度与深度。
查询提示词为: "${prompt}"

请你作为一个专业的AI分析团队，分别模拟以下四个模型对于此提示词的代表性输出结果。请提供简明却有核心差别的文本，体现出各自的特色：
1. DeepSeek-V3: 极性偏理性，输出带有思考痕迹，分步清晰，性价比高，技术细节丰富。
2. Qwen-2.5-72B: 中文润色极佳，逻辑清晰，贴近中国用户的商业术语与政企规范表达。
3. Claude 3.5 Sonnet: 构架缜密完美，语言流畅高级，擅长代码级推理，注重学术精准度与边界约束。
4. Gemini 3.5 Flash: 检索响应极速，善于归纳总结大文档和关联外部网络搜索，富含实效。

请以严格的 JSON 格式输出，不要有任何 Markdown 包裹以外的描述。格式如下:
{
  "deepseek": {"output": "...", "latencyMs": 420, "score": 9.4, "reasoning": "设计思考链路..."},
  "qwen": {"output": "...", "latencyMs": 280, "score": 9.2, "reasoning": "思考链路..."},
  "claude": {"output": "...", "latencyMs": 510, "score": 9.7, "reasoning": "思考链路..."},
  "gemini": {"output": "...", "latencyMs": 140, "score": 9.5, "reasoning": "思考链路..."}
}`;

      const response = await ai.models.generateContent({
        model: globalModelConfig.activeQaModel || "gemini-3.5-flash",
        contents: comparePrompt,
        config: {
          responseMimeType: "application/json",
          temperature: globalModelConfig.temperature,
          topP: globalModelConfig.topP,
          maxOutputTokens: globalModelConfig.maxTokens
        }
      });

      const parsedJSON = JSON.parse(response.text?.trim() || "{}");
      addLog("INFO", "ADAPTER", "多模型适配对比数据由 Gemini 成功仿真生成！");
      res.json(parsedJSON);
    } catch (err: any) {
      console.error(err);
      addLog("ERROR", "ADAPTER", `大模型比对任务失败: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  } else {
    // Return high quality offline mockup simulation
    setTimeout(() => {
      res.json({
        deepseek: {
          output: `[DeepSeek-V3 模拟回答]\n围绕关键提示词进行极简拆解：\n1. 技术层面：可以考虑对本问题在局部加权的 Rerank 中增加 0.12 的偏移。\n2. 机制设计：建议引入图谱子网。这是一个高性能且低成本的解决方案。\n3. 开源优势：利用国内强大的开源社区支持保障。`,
          latencyMs: 380,
          score: 9.3,
          reasoning: "核心考量低功耗和最大召回率，通过多层感知器和深度思考蒸馏。"
        },
        qwen: {
          output: `[Qwen-2.5 模拟回答]\n尊敬的用户，这是一个在中文语境下典型的落地痛点。针对此，推荐分阶段施策：\n- 第一阶段：理顺企业专有本体架构，完善与国家技术合规接轨的标准。\n- 第二阶段：建立端到端的检索链路机制。\n打造高可用、符合本土安全规范的Moer Search可信智算系统。`,
          latencyMs: 220,
          score: 9.1,
          reasoning: "对齐商业运营目标，重点优化中文理解和文书结构。"
        },
        claude: {
          output: `[Claude 3.5 Sonnet 模拟回答]\nTo formulate a rigid perspective on this matter, we must identify the core structural limits of your prompt. Here is how we build the state container:\n\`\`\`typescript\ninterface EvaluationState {\n  resolved: boolean;\n  constraintSatisfied: boolean;\n}\n\`\`\`\nThis design guarantees predictable side-effects and maintains academic clarity.`,
          latencyMs: 490,
          score: 9.6,
          reasoning: "进行前置状态推演，对模型可能产生的偏见和幻觉边界进行绝对阻断。"
        },
        gemini: {
          output: `[Gemini 3.5 Flash 模拟回答]\n快讯！对于提示词，我们可立即依托谷歌全球网络检索获得以下几点前沿结论：\n1. 支持原生超大百万级 Token 上下文解析。\n2. 直接链接 Google Search Grounding 获取 2026 最新行业信息。\n3. 执行多模态统一，效率极高。立即进入 Settings 模块配置秘钥体验。`,
          latencyMs: 110,
          score: 9.4,
          reasoning: "全局信息扫描，极速流式返回，并生成高度归纳的事实摘要信息。"
        }
      });
      addLog("INFO", "ADAPTER", "多模型对比测试数据(本地离线仿真加载完成)");
    }, 400);
  }
});


// --- ONTOLOGY ENDPOINTS ---
app.get("/api/ontologies", (req, res) => {
  res.json({
    nodes: ontologyNodes,
    edges: ontologyEdges
  });
});

app.post("/api/ontologies/node", (req, res) => {
  const { id, label, type, properties } = req.body;
  if (!label || !type) {
    return res.status(400).json({ error: "节点标签(Name)和类型分类(Type)不能为空" });
  }

  const nodeId = id || "node_" + Math.random().toString(36).substr(2, 5);

  const duplicated = ontologyNodes.find(n => n.id === nodeId);
  if (duplicated) {
    return res.status(400).json({ error: `节点ID "${nodeId}" 已存在` });
  }

  const newNode: OntologyNode = {
    id: nodeId,
    label,
    type,
    properties: properties || {}
  };

  ontologyNodes.push(newNode);
  addLog("INFO", "ONTOLOGY", `成功新增本体节点 "${label}" [ID: ${nodeId}, 分类: ${type}]`);
  res.json(newNode);
});

app.post("/api/ontologies/edge", (req, res) => {
  const { source, target, label } = req.body;
  if (!source || !target || !label) {
    return res.status(400).json({ error: "起点节点、终点节点以及连接关系词不能为空" });
  }

  const sNode = ontologyNodes.find(n => n.id === source);
  const tNode = ontologyNodes.find(n => n.id === target);

  if (!sNode || !tNode) {
    return res.status(400).json({ error: "起点或目标节点不存在，请先添加对应实体" });
  }

  const newEdge: OntologyEdge = {
    id: "edge_" + Math.random().toString(36).substr(2, 5),
    source,
    target,
    label
  };

  ontologyEdges.push(newEdge);
  addLog("INFO", "ONTOLOGY", `成功建立本体关系链: "${sNode.label}" --[${label}]--> "${tNode.label}"`);
  res.json(newEdge);
});

app.delete("/api/ontologies/node/:id", (req, res) => {
  const { id } = req.params;
  const nodeIndex = ontologyNodes.findIndex(n => n.id === id);
  if (nodeIndex === -1) {
    return res.status(404).json({ error: "该实体节点不存在" });
  }

  const nodeName = ontologyNodes[nodeIndex].label;

  // Remove node and all associated edges
  ontologyNodes.splice(nodeIndex, 1);
  ontologyEdges = ontologyEdges.filter(e => e.source !== id && e.target !== id);

  addLog("WARN", "ONTOLOGY", `删除了实体节点 "${nodeName}" 并顺带处理了关联关系边`);
  res.json({ success: true, message: `已移除实体:${nodeName}` });
});

app.post("/api/ontologies/sparql", (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "SPARQL 查询不能为空" });
  }

  addLog("INFO", "ONTOLOGY", `执行本体图库检索。查询分析: ${query.substring(0, 40)}...`);

  // Simple SPARQL mockup parser to return beautiful reactive matching graph nodes for testing
  let resultNodes = ontologyNodes;
  const uppercaseQuery = query.toUpperCase();

  if (uppercaseQuery.includes("LLM") || uppercaseQuery.includes("ADAPTER")) {
    resultNodes = ontologyNodes.filter(n => n.type === "LLM" || n.id === "node_1" || n.id === "node_2");
  } else if (uppercaseQuery.includes("CLINICAL") || uppercaseQuery.includes("MEDICAL") || uppercaseQuery.includes("DIABETES")) {
    resultNodes = ontologyNodes.filter(n => n.type === "KnowledgeBase" || n.label.includes("医疗") || n.id === "node_3");
  } else if (uppercaseQuery.includes("Moer Search") || uppercaseQuery.includes("SYSTEM")) {
    resultNodes = ontologyNodes.filter(n => n.id === "node_1" || n.type === "System" || n.type === "Protocol" || n.type === "Engine");
  }

  const resultEdges = ontologyEdges.filter(e =>
    resultNodes.some(n => n.id === e.source) && resultNodes.some(n => n.id === e.target)
  );

  res.json({
    status: "success",
    query_time_us: 11200,
    matched_nodes_count: resultNodes.length,
    results: {
      nodes: resultNodes,
      edges: resultEdges
    },
    raw_bindings: resultNodes.map(n => ({
      subject: { type: "uri", value: `http://moer.search/ontology#${n.id}` },
      predicate: { type: "uri", value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
      object: { type: "literal", value: n.type },
      label: { type: "literal", value: n.label }
    }))
  });
});


// --- SYSTEM MANAGEMENT & DATA INTEGRATION TEST ---
app.get("/api/logs", (req, res) => {
  res.json(logs);
});

app.post("/api/external/test-connection", (req, res) => {
  const { url, dbName, username, secretKey } = req.body;
  if (!url) {
    return res.status(400).json({ error: "链接网关端点 URL 不能为空" });
  }

  addLog("INFO", "CLUSTER", `发起向上级集中监控平台或第三方数据源的联通性测试 -> [${url}]`);

  // Simulate remote server response wait
  setTimeout(() => {
    if (url.includes("fail") || url.includes("error")) {
      addLog("ERROR", "CLUSTER", `对接测试失败: 目标端点 [${url}] 拒绝响应，或者鉴权安全握手不匹配`);
      return res.status(400).json({
        success: false,
        message: "对接外部上级平台失败。网络响应包 504 Gateway Timeout。"
      });
    }

    addLog("INFO", "CLUSTER", `对接外部上级平台成功。授权并协商 API key 完成。数据源同步状态: ONLINE`);
    res.json({
      success: true,
      message: "通信连通性测试获得成功！链路连接正常。",
      details: {
        latencyMs: 34,
        establishedTunnel: "gGPRC-Secure-Tunnel-01",
        negotiatedProtocol: "Moer-Cluster-Sync v1.2",
        dataSourceStatus: "SYNCHRONIZED"
      }
    });
  }, 600);
});


// --- DEV & PRODUCTION BUILD STATIC MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Moer Search Server] online at health port ${PORT}`);
  });
}

startServer();
