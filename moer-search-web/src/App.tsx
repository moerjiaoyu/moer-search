import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Database, 
  FileText, 
  Search, 
  Sparkles, 
  Network, 
  Settings, 
  Code,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Boxes,
  Cpu
} from "lucide-react";
import { IndexItem, DocumentItem, OntologyNode, OntologyEdge, SystemLog, ClusterInfo, ModelCompareResponse } from "./types";

// Import view components
import DashboardView from "./components/DashboardView";
import IndexMgrView from "./components/IndexMgrView";
import DocumentMgrView from "./components/DocumentMgrView";
import SearchValidatorView from "./components/SearchValidatorView";
import AiAbilitiesView from "./components/AiAbilitiesView";
import OntologyView from "./components/OntologyView";
import SystemView from "./components/SystemView";
import ApiDocsView from "./components/ApiDocsView";
import ModelConfigView from "./components/ModelConfigView";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Core synchronized server states
  const [indexes, setIndexes] = useState<IndexItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [ontologyNodes, setOntologyNodes] = useState<OntologyNode[]>([]);
  const [ontologyEdges, setOntologyEdges] = useState<OntologyEdge[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [cluster, setCluster] = useState<ClusterInfo | null>(null);
  const [hasLiveGemini, setHasLiveGemini] = useState<boolean>(false);

  // Load backend telemetry on startup
  useEffect(() => {
    fetchAllStates();
    // Start continuous log polling simulation
    const interval = setInterval(() => {
      fetchLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllStates = async () => {
    await Promise.all([
      fetchIndexes(),
      fetchDocuments(),
      fetchOntology(),
      fetchLogs(),
      fetchCluster()
    ]);
  };

  const fetchIndexes = async () => {
    try {
      const res = await fetch("/api/indexes");
      const data = await res.json();
      setIndexes(data);
    } catch (err) {
      console.error("Could not load indexes index", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Could not load doc repository", err);
    }
  };

  const fetchOntology = async () => {
    try {
      const res = await fetch("/api/ontologies");
      const data = await res.json();
      setOntologyNodes(data.nodes || []);
      setOntologyEdges(data.edges || []);
    } catch (err) {
      console.error("Could not load ontology triplets", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Could not load tracking logs", err);
    }
  };

  const fetchCluster = async () => {
    try {
      const res = await fetch("/api/cluster");
      const data = await res.json();
      setCluster(data.cluster);
      setHasLiveGemini(data.hasLiveGemini);
    } catch (err) {
      console.error("Could not load cluster telemetry", err);
    }
  };

  // --- ACTIONS ---

  // Index Manager Actions
  const handleCreateIndex = async (newIdx: { name: string; type: "vector" | "fulltext" | "hybrid"; shards: number; replicas: number; fields: any[] }) => {
    const res = await fetch("/api/indexes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIdx)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建索引失败");
    }
    await fetchIndexes();
    await fetchLogs();
  };

  const handleIndexAction = async (id: string, action: "close" | "open" | "clear" | "delete") => {
    const res = await fetch(`/api/indexes/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "动作执行失败");
    }
    await Promise.all([fetchIndexes(), fetchDocuments(), fetchLogs()]);
  };

  const handleAddAlias = async (id: string, alias: string) => {
    const res = await fetch(`/api/indexes/${id}/alias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias, action: "add" })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "添加别名失败");
    }
    await fetchIndexes();
    await fetchLogs();
  };

  const handleRemoveAlias = async (id: string, alias: string) => {
    const res = await fetch(`/api/indexes/${id}/alias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias, action: "remove" })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "移除别名失败");
    }
    await fetchIndexes();
    await fetchLogs();
  };

  // Document Manager Actions
  const handleSaveDocument = async (doc: Partial<DocumentItem>) => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "归宿索引保存错误");
    }
    await Promise.all([fetchDocuments(), fetchIndexes(), fetchLogs()]);
  };

  const handleDeleteDocument = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "物理文书删除错误");
    }
    await Promise.all([fetchDocuments(), fetchIndexes(), fetchLogs()]);
  };

  const handleBatchImport = async (indexId: string, docs: { title: string; content: string; tags: string[] }[]) => {
    const res = await fetch("/api/documents/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indexId, documents: docs })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "批量写入异常");
    }
    await Promise.all([fetchDocuments(), fetchIndexes(), fetchLogs()]);
  };

  // Search Analyzer
  const handleTriggerSearch = async (payload: any) => {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "索引遍历重排失败");
    }
    return res.json();
  };

  // AI sandbox Sandbox actions
  const handleQaSubmit = async (question: string) => {
    const res = await fetch("/api/ai/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "提向失败");
    }
    return res.json();
  };

  const handleMcpInvoke = async (toolName: string, args: any) => {
    const res = await fetch("/api/mcp/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolName, arguments: args })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "回调失败");
    }
    return res.json();
  };

  const handleModelCompare = async (prompt: string) => {
    const res = await fetch("/api/ai/model-compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "多对决召回失败");
    }
    return res.json();
  };

  const handleExtractEntity = async (text: string) => {
    const res = await fetch("/api/ai/extract-entity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "自动提取节点发生缺陷");
    }
    return res.json();
  };

  const handleInjectEntitiesToGraph = async (payload: { entities: any[]; relations: any[] }) => {
    const res = await fetch("/api/ontologies/inject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "注入失败");
    }
    await fetchOntology();
    await fetchLogs();
  };

  const handleTestConnection = async (payload: { url: string; dbName: string; username: string; secretKey: string }) => {
    const res = await fetch("/api/sync/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "对接失败");
    }
    return res.json();
  };

  // Ontology node creation
  const handleAddNode = async (newNode: { id?: string; label: string; type: string; properties: any }) => {
    const res = await fetch("/api/ontologies/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNode)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "新增本体概念点失败");
    }
    await fetchOntology();
    await fetchLogs();
  };

  const handleAddEdge = async (newEdge: { source: string; target: string; label: string }) => {
    const res = await fetch("/api/ontologies/edges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEdge)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "新增谓词路径失败");
    }
    await fetchOntology();
    await fetchLogs();
  };

  const handleDeleteNode = async (id: string) => {
    const res = await fetch(`/api/ontologies/nodes/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "摧毁本体概念点失败");
    }
    await fetchOntology();
    await fetchLogs();
  };

  const handleRunSparql = async (query: string) => {
    const res = await fetch("/api/ontologies/sparql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "SPARQL 查询执行失败");
    }
    return res.json();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {/* Top clean unified brand header */}
      <header className="bg-slate-900 text-white shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg font-bold text-white tracking-wider">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Moer Search 搜索功能验证系统</h1>
              <p className="text-[10px] text-slate-400">高维混合全文及向量语义检索 - Ontology 本体数据库联合验证底座</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Real online key metadata */}
            <div className={`p-1 px-2.5 rounded-full flex items-center gap-1.5 font-mono text-[10px] ${
              hasLiveGemini 
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-900" 
                : "bg-indigo-950 text-indigo-300 border border-indigo-900"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasLiveGemini ? "bg-emerald-400 animate-pulse" : "bg-indigo-400 animate-pulse"}`} />
              {hasLiveGemini ? "GEMINI SECRETS ACTIVE (LIVE)" : "GEMINI EMBEDDING FALLBACK"}
            </div>
          </div>
        </div>
      </header>

      {/* Main double panel page shell */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row px-4 md:px-6 py-6 gap-6 overflow-hidden">
        
        {/* Left elegant controller navigation: 220px */}
        <aside className="w-full md:w-[220px] shrink-0 space-y-2">
          
          <nav className="space-y-1 bg-white p-2.5 rounded-2xl border border-slate-250 select-none text-xs">
            
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "dashboard" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              首页概览 (Home)
            </button>

            <button 
              onClick={() => setActiveTab("index_mgr")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "index_mgr" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Boxes className="w-4 h-4" />
              索引管理 (Indices)
            </button>

            <button 
              onClick={() => setActiveTab("doc_mgr")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "doc_mgr" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              文档库管理 (Docs)
            </button>

            <div className="h-[1px] bg-slate-100 my-2" />

            <button 
              onClick={() => setActiveTab("search")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "search" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Search className="w-4 h-4" />
              检索沙盒 (Query)
            </button>

            <button 
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "ai" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI 场景验证 (AI)
            </button>

            <button 
              onClick={() => setActiveTab("model_config")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "model_config" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-600" />
              大模型多维管理 (Models)
            </button>

            <button 
              onClick={() => setActiveTab("ontology")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "ontology" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Network className="w-4 h-4 text-indigo-500" />
              本体概念网 (Graph)
            </button>

            <div className="h-[1px] bg-slate-100 my-2" />

            <button 
              onClick={() => setActiveTab("system")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "system" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Settings className="w-4 h-4" />
              系统管理 (Cluster)
            </button>

            <button 
              onClick={() => setActiveTab("api_doc")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition ${
                activeTab === "api_doc" ? "bg-slate-950 text-white shadow-xs font-semibold" : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Code className="w-4 h-4" />
              API 在线交互 (Rest)
            </button>

          </nav>

          {/* Quick cluster physical stats sidebar panel */}
          <div className="hidden md:block p-4 bg-white rounded-2xl border border-slate-200 space-y-3 font-mono text-[10.5px]">
            <div className="flex items-center gap-1 text-slate-400 font-sans font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              CLUSTER TELEMETRY
            </div>
            
            <div className="space-y-1 text-slate-550 border-t border-slate-50 pt-2 leading-relaxed">
              <div className="flex justify-between">
                <span>Indexes Count:</span>
                <span className="font-bold text-slate-800">{indexes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Physical Docs:</span>
                <span className="font-bold text-slate-800">{documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Ontologies:</span>
                <span className="font-bold text-indigo-700">{ontologyNodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Live QPS throughput:</span>
                <span className="font-bold text-emerald-600">{cluster?.qps || 12.8}/s</span>
              </div>
            </div>
          </div>

        </aside>

        {/* Right Content Space: dynamic mounting */}
        <main className="flex-1 min-w-0">
          
          <div className="space-y-6">
            
            {/* SWITCH CONDITIONAL RENDERING */}
            {activeTab === "dashboard" && (
              <DashboardView 
                cluster={cluster}
                onNavigate={(tab) => {
                  if (tab === "indexes") setActiveTab("index_mgr");
                  else if (tab === "documents") setActiveTab("doc_mgr");
                  else if (tab === "search") setActiveTab("search");
                  else if (tab === "ai") setActiveTab("ai");
                  else if (tab === "ontology") setActiveTab("ontology");
                }}
                isLoading={!cluster}
              />
            )}

            {activeTab === "index_mgr" && (
              <IndexMgrView 
                indexes={indexes}
                onCreateIndex={handleCreateIndex}
                onAddAlias={handleAddAlias}
                onRemoveAlias={handleRemoveAlias}
                onIndexAction={handleIndexAction}
                refreshIndexes={fetchIndexes}
              />
            )}

            {activeTab === "doc_mgr" && (
              <DocumentMgrView 
                indexes={indexes}
                documents={documents}
                onSaveDocument={handleSaveDocument}
                onDeleteDocument={handleDeleteDocument}
                onBatchImport={handleBatchImport}
                refreshDocuments={fetchDocuments}
              />
            )}

            {activeTab === "search" && (
              <SearchValidatorView 
                indexes={indexes}
                onTriggerSearch={handleTriggerSearch}
              />
            )}

            {activeTab === "ai" && (
              <AiAbilitiesView 
                onQaSubmit={handleQaSubmit}
                onMcpInvoke={handleMcpInvoke}
                onModelCompare={handleModelCompare}
                onExtractEntity={handleExtractEntity}
                onInjectEntitiesToGraph={handleInjectEntitiesToGraph}
                hasLiveGemini={hasLiveGemini}
              />
            )}

            {activeTab === "model_config" && (
              <ModelConfigView />
            )}

            {activeTab === "ontology" && (
              <OntologyView 
                nodes={ontologyNodes}
                edges={ontologyEdges}
                onAddNode={handleAddNode}
                onAddEdge={handleAddEdge}
                onDeleteNode={handleDeleteNode}
                onRunSparql={handleRunSparql}
                refreshOntology={fetchOntology}
                documents={documents}
                indexes={indexes}
              />
            )}

            {activeTab === "system" && (
              <SystemView 
                cluster={cluster}
                logs={logs}
                onTestConnection={handleTestConnection}
              />
            )}

            {activeTab === "api_doc" && (
              <ApiDocsView />
            )}

          </div>

        </main>

      </div>

      {/* Humble Footer taglines */}
      <footer className="bg-white border-t border-slate-200 py-3.5 mt-auto select-none">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>&copy; 2026 MOER LABS INC. ALL RIGHTS RESERVED.</span>
          <span>SPARQL INTEGRAL DB ADAPTER V2.0 // LZ4 COMPRESSED INDEXING</span>
        </div>
      </footer>

    </div>
  );
}
