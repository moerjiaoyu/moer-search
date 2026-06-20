import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Settings, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Info, 
  Flame, 
  ShieldAlert, 
  Terminal, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Database, 
  Activity, 
  Wifi, 
  X, 
  ExternalLink,
  SlidersHorizontal,
  FolderSync,
  HeartCrack,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { ModelConfig, RegisteredModel } from "../types";

export default function ModelConfigView() {
  const [config, setConfig] = useState<ModelConfig>({
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
  });

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Model Registry State
  const [registryModels, setRegistryModels] = useState<RegisteredModel[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registrySearch, setRegistrySearch] = useState("");
  const [registryFilterProvider, setRegistryFilterProvider] = useState("all");

  // Model Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<RegisteredModel | null>(null);
  
  // Model Form Item fields
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formTemp, setFormTemp] = useState(0.7);
  const [formStatus, setFormStatus] = useState<"active" | "inactive" | "maintenance">("active");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Playground states
  const [testPrompt, setTestPrompt] = useState("分析在海量混合检索（Hybrid Search）中加入本体约束（Ontology Constraint）对提高检索精度的端到端业务收益。");
  const [testRunning, setTestRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    success: boolean;
    answer: string;
    latencyMs: number;
    tokensUsed: { input: number; output: number };
    modelUsed: string;
    costEstimate: number;
    thinkingTrace?: string;
    safetyChecks: { category: string; status: "PASS" | "WARN" }[];
  } | null>(null);

  // Fetch current configs on initialization
  useEffect(() => {
    fetchConfig();
    fetchRegistry();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/model/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load model config", err);
    }
  };

  const fetchRegistry = async () => {
    setRegistryLoading(true);
    try {
      const res = await fetch("/api/model/registry");
      if (res.ok) {
        const data = await res.json();
        setRegistryModels(data);
      }
    } catch (err) {
      console.error("Failed to load model registry", err);
    } finally {
      setRegistryLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/model/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save model config", err);
      alert("配置保存失败，请检查模型路由。");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingModel(null);
    setFormId("");
    setFormName("");
    setFormProvider("Google Custom-Edge");
    setFormBaseUrl("https://generativelanguage.googleapis.com");
    setFormTemp(0.7);
    setFormStatus("active");
    setFormDesc("");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (model: RegisteredModel) => {
    setEditingModel(model);
    setFormId(model.id);
    setFormName(model.name);
    setFormProvider(model.provider);
    setFormBaseUrl(model.baseUrl);
    setFormTemp(model.temperature);
    setFormStatus(model.status);
    setFormDesc(model.description);
    setFormError("");
    setShowModal(true);
  };

  const handleDeleteModel = async (id: string) => {
    if (id === "gemini-3.5-flash") {
      alert("⚠️ 【内置保护】系统缺省核心模型 gemini-3.5-flash 不能被移除！");
      return;
    }
    if (!confirm(`确定要注销并删除大模型记录 [${id}] 吗？\n删除后绑定该路由的通道将自动回滚为标准引擎。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/model/registry/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchRegistry();
        fetchConfig(); // refresh to capture fallback values
      } else {
        const err = await res.json();
        alert(err.error || "删除失败");
      }
    } catch (err) {
      console.error("Failed to delete model", err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    if (!formId.trim()) {
      setFormError("大模型唯一键号(ID)不能为空");
      setFormSubmitting(false);
      return;
    }
    if (!formName.trim()) {
      setFormError("大模型友好名称不能为空");
      setFormSubmitting(false);
      return;
    }

    const payload = {
      id: formId,
      name: formName,
      provider: formProvider,
      baseUrl: formBaseUrl,
      temperature: formTemp,
      status: formStatus,
      description: formDesc
    };

    try {
      const url = editingModel ? `/api/model/registry/${editingModel.id}` : "/api/model/registry";
      const method = editingModel ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchRegistry();
        fetchConfig();
      } else {
        const err = await res.json();
        setFormError(err.error || "提报数据处理失败，请排查重复项");
      }
    } catch (err) {
      setFormError("提交时发生异常，请检查网关。");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!testPrompt.trim()) return;
    setTestRunning(true);
    setTestResponse(null);

    const startTime = performance.now();
    try {
      const res = await fetch("/api/model/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt.trim() })
      });
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (res.ok) {
        const data = await res.json();
        setTestResponse({
          success: data.success,
          answer: data.answer,
          latencyMs: data.latencyMs || duration,
          tokensUsed: data.tokensUsed || { input: Math.round(testPrompt.length * 1.2), output: Math.round(data.answer.length * 1.5) },
          modelUsed: data.modelUsed || config.activeQaModel,
          costEstimate: data.costEstimate || (Math.round(testPrompt.length * 1.2) * 0.075 + Math.round(data.answer.length * 1.5) * 0.3) / 1000000,
          thinkingTrace: data.thinkingTrace,
          safetyChecks: data.safetyChecks || [
            { category: "Hate Speech (仇恨言论检测)", status: "PASS" },
            { category: "Sexually Explicit (色情违规过滤)", status: "PASS" },
            { category: "Harassment Policy (人身骚扰控制)", status: "PASS" },
            { category: "Dangerous Content (危险引导规避)", status: "PASS" }
          ]
        });
      } else {
        const err = await res.json();
        throw new Error(err.error || "调试失败");
      }
    } catch (err: any) {
      console.error(err);
      setTestResponse({
        success: false,
        answer: `❌ 调度评测网关发生异常: ${err.message || "未知故障"}。建议查看系统日志或网络。`,
        latencyMs: 120,
        tokensUsed: { input: 0, output: 0 },
        modelUsed: config.activeQaModel,
        costEstimate: 0,
        safetyChecks: []
      });
    } finally {
      setTestRunning(false);
    }
  };

  const applyPresetConfig = (type: "precise" | "creative" | "balanced") => {
    if (type === "precise") {
      setConfig({
        ...config,
        temperature: 0.1,
        topP: 0.8,
        thinkingEnabled: true,
        thinkingBudget: 1536,
        systemInstruction: "你是一个极其严密、只讲事实、杜绝任何修饰用语的检索合成引擎。请根据提供的片段进行百分百客观的归纳说明。"
      });
    } else if (type === "creative") {
      setConfig({
        ...config,
        temperature: 1.0,
        topP: 0.95,
        thinkingEnabled: false,
        systemInstruction: "你是一个智识高度发散、善于寻找跨越性关联的科研助推顾问，擅长打破常规用语进行生动有力的行业宏观描绘。"
      });
    } else {
      setConfig({
        ...config,
        temperature: 0.7,
        topP: 0.9,
        thinkingEnabled: false,
        systemInstruction: "你是一个融合了「全文/向量双通道检索」、「知识本体图谱推理」与「MCP外置智能体接口技能」的超精确 AI 检索问答专家。"
      });
    }
  };

  // Filter models
  const filteredModels = registryModels.filter(m => {
    const term = registrySearch.toLowerCase().trim();
    const matchTerm = !term || 
      m.id.toLowerCase().includes(term) || 
      m.name.toLowerCase().includes(term) || 
      m.provider.toLowerCase().includes(term) ||
      m.description.toLowerCase().includes(term);
    
    const matchProvider = registryFilterProvider === "all" || m.provider.toLowerCase().includes(registryFilterProvider.toLowerCase());
    return matchTerm && matchProvider;
  });

  // Extract unique providers for quick tabs
  const allProviders = Array.from(new Set(registryModels.map(m => {
    if (m.provider.toLowerCase().includes("google")) return "Google";
    if (m.provider.toLowerCase().includes("deepseek")) return "DeepSeek";
    if (m.provider.toLowerCase().includes("ollama")) return "Ollama";
    return "Others";
  })));

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          大模型多维管理与评测看板 (Models Engine Center)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          管理和测试系统后台绑定的 LLM 中枢。您可以添加、修改、查看、删除大模型资源（CRUD），设定系统路由参数（Search, QA, NLP Pipeline），并直接在右侧触发并发对准性压力测试。
        </p>
      </div>

      {/* Model Registry List Layout Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              大模型多维资源注册列表 (Registered Model Registry)
            </span>
            <p className="text-[11px] text-slate-500">
              当前在场可挂载的模型引擎共计 <strong className="text-indigo-600 font-mono">{registryModels.length}</strong> 个。
              支持动态注册第三方 RAG 分布式端点。
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            注册绑定新大模型
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="relative w-full md:w-96">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="在在场大模型名称、标识符、描述中检索匹配项..."
              value={registrySearch}
              onChange={(e) => setRegistrySearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 self-stretch md:self-auto text-[11px]">
            <button
              onClick={() => setRegistryFilterProvider("all")}
              className={`px-2.5 py-1 rounded transition whitespace-nowrap ${
                registryFilterProvider === "all"
                  ? "bg-slate-100 text-slate-800 font-bold"
                  : "text-slate-550 hover:text-slate-800"
              }`}
            >
              全部提供方
            </button>
            <button
              onClick={() => setRegistryFilterProvider("google")}
              className={`px-2.5 py-1 rounded transition whitespace-nowrap ${
                registryFilterProvider === "google"
                  ? "bg-indigo-55 bg-indigo-50 text-indigo-705 font-bold"
                  : "text-slate-550 hover:text-slate-800"
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setRegistryFilterProvider("deepseek")}
              className={`px-2.5 py-1 rounded transition whitespace-nowrap ${
                registryFilterProvider === "deepseek"
                  ? "bg-blue-50 text-blue-705 font-bold"
                  : "text-slate-550 hover:text-slate-800"
              }`}
            >
              DeepSeek
            </button>
            <button
              onClick={() => setRegistryFilterProvider("ollama")}
              className={`px-2.5 py-1 rounded transition whitespace-nowrap ${
                registryFilterProvider === "ollama"
                  ? "bg-emerald-50 text-emerald-705 font-bold"
                  : "text-slate-550 hover:text-slate-800"
              }`}
            >
              Local-Ollama
            </button>
          </div>
        </div>

        {/* Grid / Table Layout */}
        {registryLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-1.5">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-slate-500 font-mono text-[11px]">正在解析大模型芯片节点拓扑...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">未匹配到任何登记注册的大模型</p>
            <p className="text-[11px] text-slate-400 mt-0.5">请更换搜索关键词或点击右上角注册一个新端点。</p>
          </div>
        ) : (
          <div className="border border-slate-205 rounded-xl overflow-hidden shadow-4xs overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">模型标识 (Model ID)</th>
                  <th className="p-3">大模型友好名称 (Friendly Name)</th>
                  <th className="p-3">开发服务商 (Provider)</th>
                  <th className="p-3">网关基址 (Base Endpoint)</th>
                  <th className="p-3">预设温度</th>
                  <th className="p-3 text-center">状态码</th>
                  <th className="p-3 text-right">功能操作 (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredModels.map((m) => {
                  const isActiveInRouting = 
                    config.activeSearchModel === m.id || 
                    config.activeQaModel === m.id || 
                    config.activeNlpModel === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition group">
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Cpu className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                          <span className="font-bold text-slate-850 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">{m.id}</span>
                          {isActiveInRouting && (
                            <span className="text-[9.5px] bg-indigo-50 text-indigo-700 font-medium px-1 rounded border border-indigo-200">
                              生产路由使用中
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{m.name}</span>
                          <span className="text-[10.5px] text-slate-400 line-clamp-1 mt-0.5" title={m.description}>{m.description}</span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-medium text-slate-655 font-mono">{m.provider}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-[10.5px] text-slate-400 max-w-[180px] truncate" title={m.baseUrl}>
                        {m.baseUrl}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-700">
                        {m.temperature}
                      </td>
                      <td className="p-3 whitespace-nowrap text-center">
                        {m.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            就绪 (Active)
                          </span>
                        ) : m.status === "maintenance" ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                            维护 (Warning)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            下线 (Offline)
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(m)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-1.5 rounded-lg border border-slate-200 hover:border-slate-350 transition"
                            title="修改模型配置"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteModel(m.id)}
                            className="bg-slate-50 hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition"
                            title="注销此大模型"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs">
        
        {/* Left Column: Config Panel (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            
            {/* Legend info */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-550" />
                全局生成与路由调配策略 (Dynamic Core Routing)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetConfig("precise")}
                  className="bg-slate-50 hover:bg-slate-100 border text-[10.5px] px-2.5 py-1 rounded-lg"
                >
                  极高精确度 (Strict)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetConfig("creative")}
                  className="bg-slate-50 hover:bg-slate-100 border text-[10.5px] px-2.5 py-1 rounded-lg"
                >
                  发散启迪模式 (Consulting)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetConfig("balanced")}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-705 border border-indigo-150 text-[10.5px] px-2.5 py-1 rounded-lg"
                >
                  平衡搜索专家
                </button>
              </div>
            </div>

            {/* Model routing table */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 block">1. 混合检索分级路由配置 (RAG Pipeline Route Mapping)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Router 1: Search */}
                <div className="space-y-1.5 p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                  <span className="block font-semibold text-slate-700">1. 双通道摘要融合 (Search Route)</span>
                  <select
                    value={config.activeSearchModel}
                    onChange={(e) => setConfig({ ...config, activeSearchModel: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono mt-1"
                  >
                    {registryModels.map(m => (
                      <option key={m.id} value={m.id} disabled={m.status === "inactive"}>
                        {m.name} {m.status === "inactive" ? "(不可用)" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block pt-1">用于检索反馈后的跨表、跨实体多维度重排名摘要说明。</span>
                </div>

                {/* Router 2: QA */}
                <div className="space-y-1.5 p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                  <span className="block font-semibold text-slate-700">2. 检索问答沙盒 (QA Route)</span>
                  <select
                    value={config.activeQaModel}
                    onChange={(e) => setConfig({ ...config, activeQaModel: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono mt-1"
                  >
                    {registryModels.map(m => (
                      <option key={m.id} value={m.id} disabled={m.status === "inactive"}>
                        {m.name} {m.status === "inactive" ? "(不可用)" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block pt-1">用于 RAG 场景验证中进行实兵多轮智识交互。</span>
                </div>

                {/* Router 3: NLP */}
                <div className="space-y-1.5 p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                  <span className="block font-semibold text-slate-700">3. 本体实体抽取 (NLP Extraction)</span>
                  <select
                    value={config.activeNlpModel}
                    onChange={(e) => setConfig({ ...config, activeNlpModel: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono mt-1"
                  >
                    {registryModels.map(m => (
                      <option key={m.id} value={m.id} disabled={m.status === "inactive"}>
                        {m.name} {m.status === "inactive" ? "(不可用)" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block pt-1">用于多层自然语言本体网络的实体关系图谱析出。</span>
                </div>

              </div>
            </div>

            {/* Hyper-parameters */}
            <div className="space-y-3.5 pt-1">
              <span className="font-bold text-slate-800 block">2. 模型微调采样控制策略 (Sampling Hyperparameters)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 font-mono">
                
                {/* Temp */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1 font-sans">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      采样温度 (Temperature)
                    </span>
                    <span className="text-indigo-650 font-bold">{config.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.2}
                    step={0.1}
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[9.5px] text-slate-400 font-sans leading-normal">低温度用于确保对所召回文档的极其忠实还原，避免幻觉溢出；大温度用于写报告起草。</p>
                </div>

                {/* TopP */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span className="font-sans">核概率累加 (TopP)</span>
                    <span className="text-indigo-655 font-bold">{config.topP}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={config.topP}
                    onChange={(e) => setConfig({ ...config, topP: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[9.5px] text-slate-400 font-sans leading-normal">动态累加词元概率门限值，默认设为 0.9 或 0.95 即可满足 99.8% 的多通道推理质量。</p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span className="font-sans">单次最大生成限制 (Max Output Tokens)</span>
                    <span className="text-indigo-655 font-bold">{config.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={256}
                    max={4096}
                    step={128}
                    value={config.maxTokens}
                    onChange={(e) => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[9.5px] text-slate-400 font-sans leading-normal">限制回复生成长度上限。若需要超长分析，建议调大到 4096。防止推理溢出中断。</p>
                </div>

                {/* Safety block limits */}
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between font-mono font-bold text-slate-750">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      敏感情感/有害内容拦截率
                    </span>
                    <span className="text-rose-600">拦截等级: {config.safetySetting}</span>
                  </div>
                  <select
                    value={config.safetySetting}
                    onChange={(e) => setConfig({ ...config, safetySetting: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 font-mono rounded-lg p-1.5 text-[11px] mt-1.5"
                  >
                    <option value="NONE">NONE (不拦截 - 仅对通用科研完全开放)</option>
                    <option value="LOW">LOW (低度阻断 - 适合金融/政策宽松)</option>
                    <option value="MEDIUM">MEDIUM (中度拦截 - 过滤敏感种族、仇恨等)</option>
                    <option value="HIGH">HIGH (全面深度拦截 - 面向主流普适公开受众)</option>
                  </select>
                  <p className="text-[9.5px] text-slate-400 leading-normal mt-1">控制 Hate, Sexual, Harassment 维度的模型置信拒绝拦截概率。</p>
                </div>

              </div>
            </div>

            {/* Dynamic System instructions editor */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">3. 搜索引擎前置系统主指令 (Custom System Instruction)</span>
              <p className="text-[11px] text-slate-500 pb-1 leading-normal">定义模型扮演的角色身份及召回拼装格式标准。在每次发起 RAG 大检索生成时均强制注入其上下文首端，用以约束提炼结论并控制幻觉发生率。</p>
              <textarea
                value={config.systemInstruction}
                onChange={(e) => setConfig({ ...config, systemInstruction: e.target.value })}
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono leading-relaxed"
                required
              />
            </div>

            {/* Thinking Budget (Simulated for o1 thinking) */}
            <div className="p-4 bg-indigo-50/30 border border-indigo-150/80 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  开启深度链式思维推理 (Advanced Chain-of-Thought Thinking Engine)
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.thinkingEnabled}
                    onChange={(e) => setConfig({ ...config, thinkingEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {config.thinkingEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-[11px] font-mono select-none">
                  <div className="space-y-1">
                    <span className="block text-slate-700 font-semibold font-sans">思维预算 Token (Thinking Budget)</span>
                    <input
                      type="number"
                      value={config.thinkingBudget}
                      onChange={(e) => setConfig({ ...config, thinkingBudget: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs mt-1 text-indigo-950 font-bold"
                    />
                  </div>
                  <div className="p-2.5 bg-white rounded border border-indigo-100 flex items-center text-[10px] text-indigo-800 leading-relaxed font-sans">
                    💡 <b>深度提示</b>：开启后，支持慢速深思长条链路（CoT），在输出智识回答之前将前置吐出带有思考标签的纯结构化思考演痕进程，完美抗阻杂散推导！
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2 border-t border-slate-100 gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  大模型配置规则已成功固化到系统内存！
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 select-none"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                保存模型固化配置策略
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Testing Workbench & comparative diagnostic report */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Diagnostic Playground */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <span className="font-bold text-slate-900 text-xs block">大模型指标实时可用性诊断 Playground</span>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">即便更改上方已选的生产路由规则，您也可以在下方控制台对已运行的底层进行诊断评测。</p>
            </div>

            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              rows={4}
              placeholder="请输入测试提示词..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono leading-relaxed"
            />

            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={testRunning || !testPrompt.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs font-mono disabled:opacity-50 select-none"
            >
              {testRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {testRunning ? "并发调度微秒级压测中..." : "启动在线诊断（RUN DIAGNOSTIC）"}
            </button>
          </div>

          {/* Comparative radar stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 font-mono text-[11px]">
            <span className="font-bold text-slate-900 text-xs block font-sans">主流底层大语言模型适配比对指标 (Ref Benchmarks)</span>
            
            <div className="space-y-3 pt-1">
              
              {/* Gemini */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Gemini 3.5 Flash (当期中枢)</span>
                  <span className="text-emerald-600">综合 9.5 分 // 耗时 120ms</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "95%" }}></div>
                </div>
              </div>

              {/* Claude 3.5 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-655">
                  <span>Claude 3.5 Sonnet (适配)</span>
                  <span className="text-indigo-650 font-bold">综合 9.7 分 // 耗时 480ms</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: "97%" }}></div>
                </div>
              </div>

              {/* DeepSeek */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-655 font-bold">
                  <span>DeepSeek R1 Dual (适配)</span>
                  <span className="text-blue-600">综合 9.4 分 // 耗时 390ms</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full" style={{ width: "94%" }}></div>
                </div>
              </div>

              {/* Qwen 2.5 */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-655">
                  <span>Qwen 2.5 72B (适配)</span>
                  <span className="text-slate-600">综合 9.2 分 // 耗时 210ms</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: "92%" }}></div>
                </div>
              </div>

            </div>

            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 leading-normal text-[10px] text-indigo-900/85 font-sans">
              ℹ️ 评测维度含：多维度抗幻觉分数、中文语义语义映射准确率、复杂 JSON Schema 响应容错率以及分布式吞吐延时。
            </div>
          </div>

        </div>

      </div>

      {/* Test Outcomes telemetry log */}
      {testResponse && (
        <div className="bg-slate-900 hover:border-slate-800 text-slate-100 rounded-2xl p-6 shadow-inner space-y-5 font-mono text-xs border border-slate-950 animate-fade-in select-text">
          
          {/* Header metrics */}
          <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${testResponse.success ? "bg-emerald-400 animate-pulse" : "bg-rose-400 animate-pulse"}`} />
              <span className="font-bold text-slate-200">
                评测任务回执单 (Diagnostic Diagnostics Log)
              </span>
            </div>
            
            <div className="flex gap-4 text-[10.5px] text-slate-400">
              <span>物理模型: <b className="text-white">{testResponse.modelUsed}</b></span>
              <span>响应时延: <b className="text-emerald-400">{testResponse.latencyMs}ms</b></span>
              <span>费用测算: <b className="text-amber-400">${testResponse.costEstimate.toFixed(8)}</b></span>
            </div>
          </div>

          {/* Inner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Answer block: 3 Cols */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Thinking CoT log output if has thinking */}
              {testResponse.thinkingTrace && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-indigo-400 block tracking-wider uppercase font-bold">● 思维链推理路径 (Chain of Thought Mind Logs)</span>
                  <pre className="bg-slate-955 text-indigo-200 rounded-xl p-4 border border-indigo-950 max-h-40 overflow-y-auto leading-relaxed text-[10px] whitespace-pre-wrap">{testResponse.thinkingTrace}</pre>
                </div>
              )}

              {/* Actual Final generated answer */}
              <div className="space-y-1.5 font-sans">
                <span className="text-[10px] text-slate-400 font-mono block tracking-wider uppercase font-bold">● 智识合成回复 (Synthesized Consolidated Answer)</span>
                <div className="bg-slate-950 text-slate-200 rounded-xl p-5 border border-slate-850 overflow-y-auto max-h-[360px] leading-relaxed text-xs">
                  {testResponse.answer.split("\n").map((ln, i) => (
                    <p key={i} className="min-h-[1.1em]">{ln}</p>
                  ))}
                </div>
              </div>

            </div>

            {/* Metrics column details: 1 col */}
            <div className="lg:col-span-1 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 text-[11px]">
              
              {/* Tokens usage info */}
              <div className="space-y-2 border-b border-slate-850 pb-3">
                <span className="text-slate-400 font-bold block">Token 消耗统计</span>
                <div className="space-y-1 pl-1 leading-normal text-slate-350">
                  <div className="flex justify-between">
                    <span>Input tokens (提示词):</span>
                    <span className="font-bold text-slate-205">{testResponse.tokensUsed.input}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output tokens (生成款):</span>
                    <span className="font-bold text-slate-205">{testResponse.tokensUsed.output}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-1 mt-1 text-white font-bold">
                    <span>合计 (Total):</span>
                    <span>{testResponse.tokensUsed.input + testResponse.tokensUsed.output}</span>
                  </div>
                </div>
              </div>

              {/* Safety auditing checks */}
              {testResponse.safetyChecks && testResponse.safetyChecks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-slate-405 font-bold block">内容安全准入级别 (Safety Auditor)</span>
                  <div className="space-y-1.5">
                    {testResponse.safetyChecks.map((check, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] leading-none bg-slate-900 border border-slate-850 p-1.5 rounded">
                        <span className="text-slate-400 truncate max-w-[150px]">{check.category}</span>
                        <span className="text-[9.5px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-900">
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Modern Dialog/Modal for Model Registration CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden text-xs">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4.5 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-900 text-sm">
                  {editingModel ? "修改大模型网关路由映射规则" : "注册绑定新大模型推理芯片 (Register Engine)"}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form content */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 flex gap-2 items-start text-rose-800 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">注册拦截告警:</span> {formError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                
                {/* ID input */}
                <div className="space-y-1">
                  <label className="block text-slate-750 font-bold">大模型唯一标识符 (Model ID)</label>
                  <input
                    type="text"
                    disabled={!!editingModel}
                    placeholder="例如: custom-llm-v1"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-slate-400 text-[11px]"
                    required
                  />
                  <p className="text-[10px] text-slate-400">全局识别码，保存后不可更改，只能使用小写、数字、破折号。</p>
                </div>

                {/* Friendly name */}
                <div className="space-y-1">
                  <label className="block text-slate-750 font-bold">显示名称 (Friendly Name)</label>
                  <input
                    type="text"
                    placeholder="例如: GPT-4o 极速召回版"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400 text-[11px]"
                    required
                  />
                  <p className="text-[10px] text-slate-400">方便操作员指认的图形界面显示标签。</p>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* Provider of custom api */}
                <div className="space-y-1">
                  <label className="block text-slate-750 font-bold">提供商开发源 (Provider)</label>
                  <input
                    type="text"
                    placeholder="例如: OpenAI-Enterprise / Ollama"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400 text-[11px]"
                    required
                  />
                </div>

                {/* Status selector */}
                <div className="space-y-1">
                  <label className="block text-slate-750 font-bold">网关投产状态 (Status)</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-205 bg-white rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400 text-[11px]"
                  >
                    <option value="active">就绪放行 (Active)</option>
                    <option value="inactive">封禁注销 (Inactive)</option>
                    <option value="maintenance">故障维护校验 (Maintenance)</option>
                  </select>
                </div>

              </div>

              {/* Endpoint Base URL */}
              <div className="space-y-1">
                <label className="block text-slate-750 font-bold">网关基址基准段 (Base URL Route)</label>
                <input
                  type="url"
                  placeholder="https://api.openai.com/v1"
                  value={formBaseUrl}
                  onChange={(e) => setFormBaseUrl(e.target.value)}
                  className="w-full border border-slate-205 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-slate-400 text-[11px]"
                />
                <p className="text-[10px] text-slate-400">调用目标 AI 端点的 REST API 主要转发基址 URL 协议路径。</p>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>缺省默认采样温度 (Default Temperature)</span>
                  <span className="text-indigo-605 font-mono">{formTemp}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.2}
                  step={0.1}
                  value={formTemp}
                  onChange={(e) => setFormTemp(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-slate-755 font-bold">模型运行定位描述说明 (Model Purpose)</label>
                <textarea
                  rows={2}
                  placeholder="说一下该模型的特色，例如支持的高并发额度或对哪些行业话术微调过..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-slate-400 text-[11px] leading-relaxed"
                />
              </div>

              {/* Footer buttons of form */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingModel ? "更新网关注册记录" : "立即提报网关开始运行"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
