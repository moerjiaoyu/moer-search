import React, { useState } from "react";
import { 
  Code, 
  Terminal, 
  Play, 
  CheckCircle, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown,
  Database,
  Search,
  Sparkles,
  RefreshCw,
  Cpu
} from "lucide-react";

interface ApiEndpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  category: "Index" | "Document" | "Search" | "Graph" | "AI & Model";
  description: string;
  requestBodyExample: any;
}

export default function ApiDocsView() {
  const [activeEndpoint, setActiveEndpoint] = useState<ApiEndpoint | null>(null);
  
  // Try it out states
  const [editablePayload, setEditablePayload] = useState<string>("");
  const [callLoading, setCallLoading] = useState(false);
  const [callResponse, setCallResponse] = useState<string | null>(null);
  const [tookTimeMs, setTookTimeMs] = useState<number | null>(null);

  const endpoints: ApiEndpoint[] = [
    // Index Management APIs
    {
      method: "GET",
      path: "/api/indexes",
      category: "Index",
      description: "获取集群内所有登记部署的混合与高维向量索引列表及分片配置参数。",
      requestBodyExample: null
    },
    {
      method: "POST",
      path: "/api/indexes",
      category: "Index",
      description: "部署全新的索引并规划自定义 Mapping 字段类型（如 keyword, text, vector 等）。",
      requestBodyExample: {
        name: "patent_v3_dense",
        type: "hybrid",
        shards: 3,
        replicas: 1,
        fields: [
          { name: "id", type: "keyword", searchable: true, description: "主键" },
          { name: "title", type: "text", searchable: true, description: "专利主标题" },
          { name: "abstract", type: "text", searchable: true, description: "摘要" },
          { name: "doc_vector", type: "dense_vector[1536]", searchable: true, description: "高维向量特征" }
        ],
        aliases: ["patent_active"]
      }
    },

    // Documents
    {
      method: "GET",
      path: "/api/documents",
      category: "Document",
      description: "根据索引 ID 过滤，召回文档库内当前注入的内容列表。不填参数则返回全库内容。",
      requestBodyExample: null
    },
    {
      method: "POST",
      path: "/api/documents",
      category: "Document",
      description: "写入单条富文本文档。在 vector 或者是 hybrid 型索引下，会自动生成向量维数指针。",
      requestBodyExample: {
        indexId: "idx_kb_finance",
        title: "2026战略研判及供应链去库存情况数据",
        content: "第一季度主要去库存目标已达成 90%，多级智能中枢成功在全省范围内统筹调度物流节点。",
        tags: ["去库存", "供应链", "Q1预测"]
      }
    },

    // Hybrid search
    {
      method: "POST",
      path: "/api/search",
      category: "Search",
      description: "混合高性能全文语义检索接口，合并倒排词频 BM25 与向量 Cosine 相似度，支持大语言模型 Rerank（重排）和智能总结增强。",
      requestBodyExample: {
        query: "智能体接入规范 MCP",
        indexId: "idx_kb_finance",
        searchType: "hybrid",
        minScore: 0.15,
        topK: 5,
        isAiEnhance: true
      }
    },

    // SPARQL Graph
    {
      method: "GET",
      path: "/api/ontologies",
      category: "Graph",
      description: "拉取本体引擎图库内所有的节点（Subject/Object Entity）与谓词关系边列表。",
      requestBodyExample: null
    },
    {
      method: "POST",
      path: "/api/ontologies/sparql",
      category: "Graph",
      description: "采用标准 SPARQL 三元组（PREFIX / SELECT）对图数据库中的跨级概念路径执行联合查询。",
      requestBodyExample: {
        query: "PREFIX ms: <http://moer.search/ontology#>\nSELECT ?subject ?label WHERE {\n  ?subject ms:type ms:LLM .\n  ?subject ms:label ?label .\n}"
      }
    },

    // AI Q&A and Challenger
    {
      method: "POST",
      path: "/api/ai/qa",
      category: "AI & Model",
      description: "基于本地现有知识背景文档库，触发 Gemini RAG 模型进行深度问答、对齐并回馈其 reasoning 思维解析轨迹。",
      requestBodyExample: {
        question: "糖尿病的并发症应该如何被临床本体库捕捉？有哪些直接链接的实体？"
      }
    },
    {
      method: "POST",
      path: "/api/ai/model-compare",
      category: "AI & Model",
      description: "多模型并行适配测试。传入一段通用提示，调度 Qwen、DeepSeek、Claude、Gemini 进行并行比较并评分。",
      requestBodyExample: {
        prompt: "对比全文本混合重排和向量检索在响应时间上的表现差异。"
      }
    }
  ];

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setActiveEndpoint(endpoint);
    setEditablePayload(endpoint.requestBodyExample ? JSON.stringify(endpoint.requestBodyExample, null, 2) : "");
    setCallResponse(null);
    setTookTimeMs(null);
  };

  const executeTryItOut = async () => {
    const endpoint = activeEndpoint;
    if (!endpoint) return;

    setCallLoading(true);
    setCallResponse(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" }
      };

      if (endpoint.method !== "GET" && editablePayload.trim()) {
        options.body = editablePayload.trim();
      }

      // If GET but requests query parameters
      let targetPath = endpoint.path;
      if (endpoint.method === "GET" && endpoint.path === "/api/documents") {
        targetPath += "?indexId=idx_kb_finance"; // Set sample query string parameter automatically
      }

      const res = await fetch(targetPath, options);
      const data = await res.json();
      const end = performance.now();

      setCallResponse(JSON.stringify(data, null, 2));
      setTookTimeMs(Math.round(end - start));
    } catch (err: any) {
      setCallResponse(JSON.stringify({ error: "API 调试失败", detail: err.message }, null, 2));
    } finally {
      setCallLoading(false);
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET": return "bg-sky-500 text-white font-mono";
      case "POST": return "bg-emerald-500 text-white font-mono";
      default: return "bg-rose-500 text-white font-mono";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans">
      
      {/* Intro info */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">OpenAPI 交互式在线测试（交互测试）</h2>
        <p className="text-xs text-slate-500 mt-1">
          类 Swagger UI 平台。直接编辑 Request Body 实测调用 HTTP API 端点，秒级获取真实的 JSON 回报与性能耗时曲线。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Side: Expandable endpoints tree */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <span className="font-semibold text-slate-900 block border-b pb-2">REST API 目录列表</span>

          <div className="space-y-3">
            {["Index", "Document", "Search", "Graph", "AI & Model"].map(cat => {
              const catEndpoints = endpoints.filter(e => e.category === cat);
              return (
                <div key={cat} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                    {cat} 系列接口 ({catEndpoints.length})
                  </span>
                  <div className="space-y-1">
                    {catEndpoints.map(end => (
                      <div 
                        key={`${end.method}-${end.path}`}
                        onClick={() => handleEndpointSelect(end)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition space-y-2 hover:border-slate-350 ${
                          activeEndpoint?.path === end.path && activeEndpoint?.method === end.method ? "bg-slate-50 border-slate-400 shadow-xs" : "bg-white border-slate-150"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getMethodBadgeClass(end.method)}`}>
                            {end.method}
                          </span>
                          <span className="font-mono font-semibold text-slate-800 text-[11px] truncate flex-1">{end.path}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-normal">{end.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Interactive request and output console */}
        <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
          {activeEndpoint ? (
            <div className="space-y-5 animate-fade-in">
              
              <div className="border-b pb-3 flex justify-between items-center">
                <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5 font-sans">
                  <Terminal className="w-4 h-4 text-slate-500" />
                  接口在线调试沙盒
                </span>
              </div>

              {/* Editable argument payload if method is not GET */}
              {editablePayload ? (
                <div className="space-y-1.5 font-mono">
                  <span className="text-[10px] font-semibold text-slate-600 block">请求负载参数 (Editable Payload)</span>
                  <textarea 
                    value={editablePayload}
                    onChange={(e) => setEditablePayload(e.target.value)}
                    rows={8}
                    className="w-full text-[10.5px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono bg-slate-950 text-indigo-300 leading-normal"
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-500">
                  ℹ️ 本接口属于 <b>GET 无参请求</b>。在测试阶段，我们将直接向后端拉取数据或自动配齐 <code>?indexId=idx_kb_finance</code> 样本参数。
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-end pt-1">
                <button 
                  onClick={executeTryItOut}
                  disabled={callLoading}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition select-none font-mono disabled:opacity-55"
                >
                  {callLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {callLoading ? "正在请求中..." : "触发 API 真实调用"}
                </button>
              </div>

              {/* JSON code response */}
              {callResponse && (
                <div className="space-y-2 border-t border-slate-100 pt-5 animate-fade-in">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>RESPONSE / JSON OUTPUT</span>
                    <span className="text-emerald-600 font-semibold">耗时延迟: {tookTimeMs} ms</span>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[10px] overflow-x-auto leading-relaxed max-h-[350px] shadow-sm border border-slate-900">{callResponse}</pre>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-24 text-slate-400">
              请在左侧接口树中，选择任意想要进行实测调试的 REST API 接口端点
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
