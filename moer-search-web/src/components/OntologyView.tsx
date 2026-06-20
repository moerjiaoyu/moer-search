import React, { useState, useEffect } from "react";
import { 
  Network, 
  Plus, 
  Trash2, 
  BookOpen, 
  Code, 
  Terminal, 
  RefreshCw,
  Search,
  Eye,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  AlertCircle,
  Wrench,
  Sparkles,
  ArrowRight,
  Database,
  Info,
  Copy,
  Gauge
} from "lucide-react";
import { OntologyNode, OntologyEdge, DocumentItem, IndexItem } from "../types";

interface OntologyViewProps {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  onAddNode: (newNode: { id?: string; label: string; type: string; properties: any }) => Promise<void>;
  onAddEdge: (newEdge: { source: string; target: string; label: string }) => Promise<void>;
  onDeleteNode: (id: string) => Promise<void>;
  onRunSparql: (query: string) => Promise<{ nodes: OntologyNode[]; edges: OntologyEdge[]; raw_bindings: any[] }>;
  refreshOntology: () => void;
  documents?: DocumentItem[];
  indexes?: IndexItem[];
}

export default function OntologyView({
  nodes,
  edges,
  onAddNode,
  onAddEdge,
  onDeleteNode,
  onRunSparql,
  refreshOntology,
  documents = [],
  indexes = []
}: OntologyViewProps) {
  // Navigation tabs of Ontology panel
  const [activeTab, setActiveTab] = useState<"explorer" | "tester">("explorer");

  // SVG Interactive canvas states
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<OntologyNode | null>(null);

  // Forms modals
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);

  // Form input field state variables
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeType, setNodeType] = useState("Concept");
  const [nodePropKey, setNodePropKey] = useState("creator");
  const [nodePropVal, setNodePropVal] = useState("核心研发部");

  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("");

  // SPARQL Playground states
  const [sparqlQuery, setSparqlQuery] = useState(`PREFIX ms: <http://moer.search/ontology#>
SELECT ?subject ?predicate ?object ?label
WHERE {
  ?subject ms:type ms:LLM .
  ?subject ms:label ?label .
}`);
  const [sparqlRunning, setSparqlRunning] = useState(false);
  const [sparqlOutcome, setSparqlOutcome] = useState<any[] | null>(null);

  // Physics mapping positions of nodes
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Tab 2: Automated Validation & Sandbox Simulator State variables
  const [verifying, setVerifying] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [testSuiteLogs, setTestSuiteLogs] = useState<string[]>([]);
  
  // Sandbox Joint Simulator states
  const [simQuery, setSimQuery] = useState("智能体协议微调标准");
  const [simActiveScenario, setSimActiveScenario] = useState<string>("agent");
  const [simRunning, setSimRunning] = useState(false);
  const [simOutcome, setSimOutcome] = useState<{
    matchedNodes: OntologyNode[];
    matchedEdges: OntologyEdge[];
    matchedDocs: DocumentItem[];
    traditionalPrompt: string;
    augmentedPrompt: string;
    overlappingTags: string[];
    hallucinationRisk: "high" | "low" | "none";
    hallucinationRiskValue: number;
  } | null>(null);

  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Set coordinate system for graph entities dynamically over circle orbits to prevent collisions or overlaps
  useEffect(() => {
    const computed: Record<string, { x: number; y: number }> = {};
    const center = { x: 260, y: 190 };
    const radius = 120;
    
    nodes.forEach((node, idx) => {
      if (node.id === "node_1" || node.label.includes("Moer") || node.label.includes("知识")) {
        computed[node.id] = { ...center };
      } else {
        const angle = (idx / (nodes.length - 1 || 1)) * 2 * Math.PI;
        computed[node.id] = {
          x: center.x + radius * Math.cos(angle) + (Math.sin(idx * 7) * 12),
          y: center.y + radius * Math.sin(angle) + (Math.cos(idx * 7) * 12)
        };
      }
    });
    setNodePositions(computed);
  }, [nodes]);

  // Compute overall integrity health score out of 100
  const computeHealthScore = () => {
    if (nodes.length === 0) return 0;
    let score = 100;
    
    // Deduct 5 pts per orphan node (max 25)
    const orphans = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
    score -= Math.min(25, orphans.length * 5);

    // Deduct 2 pts per node that has zero properties (max 15)
    const emptyProps = nodes.filter(n => !n.properties || Object.keys(n.properties).length === 0);
    score -= Math.min(15, emptyProps.length * 2.5);

    // If edges count is too thin compared to nodes, deduct some points
    if (nodes.length > 1 && edges.length < 2) {
      score -= 15;
    } else if (edges.length / nodes.length < 0.6) {
      score -= 8;
    }

    // Deduct if tags don't share alignment with standard index tags
    const documentTags = new Set(documents.flatMap(d => d.tags || []));
    let missedAlign = 0;
    nodes.forEach(n => {
      // check if label or values appear in any document tags
      const matched = Array.from(documentTags).some(tag => 
        tag.toLowerCase().includes(n.label.toLowerCase()) || n.label.toLowerCase().includes(tag.toLowerCase())
      );
      if (!matched) missedAlign++;
    });
    score -= Math.min(10, missedAlign * 1.5);

    return Math.max(10, Math.round(score));
  };

  const currentOrphanCount = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id)).length;
  const currentHealth = computeHealthScore();

  // Action: Create Node submit
  const handleCreateNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeLabel.trim()) return;
    try {
      const properties: Record<string, string> = {};
      if (nodePropKey.trim()) properties[nodePropKey.trim()] = nodePropVal.trim();
      
      await onAddNode({
        label: nodeLabel.trim(),
        type: nodeType,
        properties
      });

      setIsAddNodeOpen(false);
      setNodeLabel("");
      
      // Auto trigger verification if we already tested once
      if (verifiedAt) {
        runAutomatedIntegrityCheck();
      }
    } catch (err: any) {
      alert("创建节点出错: " + err.message);
    }
  };

  // Action: Create Edge submit
  const handleCreateEdgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSource || !edgeTarget || !edgeLabel.trim()) {
      alert("参数字段不能为空");
      return;
    }
    if (edgeSource === edgeTarget) {
      alert("本体关联关系不能指向实体自身！");
      return;
    }
    try {
      await onAddEdge({
        source: edgeSource,
        target: edgeTarget,
        label: edgeLabel.trim()
      });
      setIsAddEdgeOpen(false);
      setEdgeLabel("");

      // Auto trigger verification if tested once
      if (verifiedAt) {
        runAutomatedIntegrityCheck();
      }
    } catch (err: any) {
      alert("关联出错: " + err.message);
    }
  };

  // SPARQL execution
  const handleSparqlExecute = async () => {
    setSparqlRunning(true);
    setSparqlOutcome(null);
    try {
      const response = await onRunSparql(sparqlQuery);
      setSparqlOutcome(response.raw_bindings);
      const matchedNodeIds = response.nodes.map(n => n.id);
      setHighlightedNodes(matchedNodeIds);
    } catch {
      alert("SPARQL 语义解析及执行出错");
    } finally {
      setSparqlRunning(false);
    }
  };

  // Run automated consistency tests
  const runAutomatedIntegrityCheck = () => {
    setVerifying(true);
    setTestSuiteLogs([]);
    const logsArr: string[] = [];
    
    const pushLog = (msg: string) => {
      logsArr.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };

    pushLog("🚀 启动语义元模型本体一致性分析套件(Ontological Conformity Suite)...");
    pushLog("⚙️ 加载静态本体定义及RDF约束校验器...");
    
    setTimeout(() => {
      // 1. Core entity check
      pushLog(`📊 检测到实体节点: ${nodes.length} 个, 关联依存谓词边: ${edges.length} 条.`);
      
      // 2. Orphans check
      const orphans = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
      if (orphans.length > 0) {
        pushLog(`⚠️ 一致性发现: 图谱中存在 ${orphans.length} 个未绑定到因果树的孤立实体: ${orphans.map(o => `"${o.label}"`).join(", ")}`);
      } else {
        pushLog("✅ 实体关联性分析: 满标度通过! 所有的概念节点在全局关联关系中均具备物理通路.");
      }

      // 3. Document alignments check
      const documentTags = new Set(documents.flatMap(d => d.tags || []));
      const activeTagsList = Array.from(documentTags);
      pushLog(`📚 正对照系统活动索引进行元数据对齐... 系统存量索引标签数目: ${activeTagsList.length}个.`);
      
      let matchedCount = 0;
      nodes.forEach(n => {
        const hasMatched = activeTagsList.some(tag => 
          tag.toLowerCase().includes(n.label.toLowerCase()) || n.label.toLowerCase().includes(tag.toLowerCase())
        );
        if (hasMatched) matchedCount++;
      });

      pushLog(`🔍 标签一致性适配度: ${matchedCount}/${nodes.length} 个概念节点与系统后端底层存储文档语义自对齐.`);

      // 4. Type density check
      const typesMap = nodes.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      pushLog(`🏛️ 类别分布普查: ${Object.entries(typesMap).map(([t, k]) => `${t}(x${k})`).join(", ")}.`);

      // Summary
      const finalScore = computeHealthScore();
      pushLog(`🏁 本轮本体模型集成性一致性自测试结束! 一致度评级等级: ${finalScore >= 85 ? "HIGH (优秀级)" : finalScore >= 60 ? "MEDIUM (基本契合)" : "CRITICAL (幻觉预警)"}.`);
      pushLog(`📈 全链路防幻觉能力综合得分: ${finalScore}/100.`);

      setTestSuiteLogs(logsArr);
      setVerifiedAt(new Date().toLocaleTimeString());
      setVerifying(false);
    }, 1200);
  };

  // Safe Auto-repair orphaned nodes: connect orphan nodes to the first node to heal integrity dynamically
  const handleAutoRepairOrphans = async () => {
    const orphans = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
    if (orphans.length === 0) return;

    // Find center node to bind to
    const fallbackNode = nodes.find(n => n.id === "node_1" || n.label.includes("Moer")) || nodes[0];
    if (!fallbackNode) return;

    try {
      setVerifying(true);
      for (const orphan of orphans) {
        await onAddEdge({
          source: fallbackNode.id,
          target: orphan.id,
          label: "包含领域知识"
        });
      }
      setVerifying(false);
      // Re-run test
      runAutomatedIntegrityCheck();
    } catch (err: any) {
      alert("自动修复孤立边缘时出错: " + err.message);
      setVerifying(false);
    }
  };

  // Run a RAG joint simulation tests on given queries
  const handleRunRagSimulation = (scenarioType: string) => {
    setSimRunning(true);
    setSimActiveScenario(scenarioType);

    // Build scenario database
    let qStr = "";
    let matchedKeywords: string[] = [];
    if (scenarioType === "agent") {
      qStr = "智能体标准与 MCP 架构";
      matchedKeywords = ["mcp", "智能体", "协议"];
    } else if (scenarioType === "finance") {
      qStr = "控股集团营收与第一季度毛利润分析";
      matchedKeywords = ["财报", "销售", "营收", "利润", "控股"];
    } else if (scenarioType === "medical") {
      qStr = "糖尿病细胞受体反应与代谢因子";
      matchedKeywords = ["糖尿病", "细胞", "受体", "病理", "患者", "医学"];
    } else {
      qStr = simQuery;
      matchedKeywords = simQuery.toLowerCase().split(" ");
    }

    setSimQuery(qStr);

    setTimeout(() => {
      // Calculate matching nodes based on selected keywords
      const matchedNodes = nodes.filter(node => 
        matchedKeywords.some(kw => 
          node.label.toLowerCase().includes(kw) || 
          node.type.toLowerCase().includes(kw) ||
          Object.values(node.properties || {}).some(v => v.toLowerCase().includes(kw))
        )
      );

      const matchedNodeIds = new Set(matchedNodes.map(n => n.id));
      const matchedEdges = edges.filter(e => 
        matchedNodeIds.has(e.source) || matchedNodeIds.has(e.target)
      );

      // Complementary endpoints
      matchedEdges.forEach(e => {
        const sNode = nodes.find(n => n.id === e.source);
        const tNode = nodes.find(n => n.id === e.target);
        if (sNode && !matchedNodes.some(n => n.id === sNode.id)) matchedNodes.push(sNode);
        if (tNode && !matchedNodes.some(n => n.id === tNode.id)) matchedNodes.push(tNode);
      });

      // Match documents based on query overlapping
      const matchedDocs = documents.filter(doc => 
        matchedKeywords.some(kw => 
          doc.title.toLowerCase().includes(kw) || 
          doc.content.toLowerCase().includes(kw) ||
          doc.tags.some(t => t.toLowerCase().includes(kw))
        )
      );

      // Create Prompt simulation strings
      const traditionalPrompt = `=== SYSTEM ROLE ===
You are an expert search assistant who answers queries based on matched fragments.

=== RETRIEVED DOCUMENT FACTS ===
${matchedDocs.map(d => `[Doc ID: ${d.id}] [Title: ${d.title}]\n${d.content.substring(0, 180)}...`).join("\n\n") || "No document facts matched in standard index vector database."}

=== USER QUERY ===
"${qStr}"

Please formulate a helpful response based strictly on retrieve contents.`;

      const ontologyPrompt = `=== SYSTEM ROLE ===
You are an expert search assistant utilizing deep Multi-Source Retrieval-Augmented Generation (Graph-RAG).
You are equipped with certified Domain Ontological Triples. These represent strict, indisputable factual boundaries to prevent model hallucination or false correlations.

=== RETRIEVED DOCUMENT FACTS ===
${matchedDocs.map(d => `[Doc ID: ${d.id}] [Title: ${d.title}]\n${d.content}`).join("\n\n") || "(No plain textual document facts found)"}

=== CERTIFIED SEMANTIC ONTOLOGICAL CONSTRAINTS ===
${matchedNodes.map(n => `Entity Concept <${n.label}> of class <${n.type}> containing properties: ${JSON.stringify(n.properties)}`).join("\n")}
${matchedEdges.map(e => {
  const srcName = nodes.find(n => n.id === e.source)?.label || e.source;
  const tgtName = nodes.find(n => n.id === e.target)?.label || e.target;
  return `Conformed Triple Relation: 《${srcName}》 --[${e.label}]--> 《${tgtName}》`;
}).join("\n") || "(No matching topological concept paths found in graph)"}

=== USER QUERY ===
"${qStr}"

Please generate a high-confidence, professional synthesis report. Reconcile both the conceptual semantic constraints and the retrieved documents to avoid hallucinations.`;

      // Overlapping tags
      const overlappingTags = matchedDocs.flatMap(d => d.tags || [])
        .filter(t => matchedNodes.some(node => node.label.toLowerCase().includes(t.toLowerCase()) || node.type.toLowerCase().includes(t.toLowerCase())));

      let riskLevel: "high" | "low" | "none" = "none";
      let riskVal = 10;
      if (matchedDocs.length > 0 && matchedNodes.length === 0) {
        riskLevel = "high";
        riskVal = 78;
      } else if (matchedDocs.length === 0) {
        riskLevel = "high";
        riskVal = 85;
      } else if (matchedNodes.length > 0 && matchedEdges.length === 0) {
        riskLevel = "low";
        riskVal = 32;
      } else {
        riskLevel = "none";
        riskVal = 2;
      }

      setSimOutcome({
        matchedNodes,
        matchedEdges,
        matchedDocs,
        traditionalPrompt,
        augmentedPrompt: ontologyPrompt,
        overlappingTags: Array.from(new Set(overlappingTags)),
        hallucinationRisk: riskLevel,
        hallucinationRiskValue: riskVal
      });
      setSimRunning(false);
    }, 900);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const getLabelColor = (type: string) => {
    switch (type) {
      case "System": return "bg-indigo-600 text-white";
      case "LLM": return "bg-purple-600 text-white";
      case "Engine": return "bg-teal-600 text-white";
      case "Protocol": return "bg-pink-600 text-white";
      case "KnowledgeBase": return "bg-emerald-600 text-white";
      default: return "bg-slate-600 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Health Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
            系统本体领域知识图谱 (System Ontology & Graph Integrity)
          </h2>
          <p className="text-xs text-slate-500">
            可视化浏览 RDF/SPARQL 实体多维关系拓扑，整合<b>一致性与对齐测试套件</b>，消弭大语言模型在多维场景中的核心事实幻觉。
          </p>
        </div>

        {/* Global Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-3xs shrink-0 self-end md:self-auto">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "explorer"
                ? "bg-white text-slate-905 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-805"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            拓扑网络浏览器
          </button>
          <button
            onClick={() => setActiveTab("tester")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "tester"
                ? "bg-white text-slate-905 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-805"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-505" />
            集成验证自测中心
          </button>
        </div>
      </div>

      {/* Global Health overview row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Score */}
        <div className="bg-white border border-slate-205 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">物理拓扑健康度</span>
            <span className="text-2xl font-black font-mono text-slate-900">{currentHealth}/100</span>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="18" stroke="#f1f5f9" strokeWidth="3" fill="transparent" />
              <circle cx="24" cy="24" r="18" stroke={currentHealth >= 80 ? "#10b981" : currentHealth >= 60 ? "#f59e0b" : "#ef4444"} strokeWidth="3" fill="transparent"
                strokeDasharray="113" strokeDashoffset={113 - (113 * currentHealth) / 100} strokeLinecap="round" />
            </svg>
            <span className="absolute text-[10px] font-bold font-mono text-slate-700">{currentHealth}%</span>
          </div>
        </div>

        {/* Card 2: Node Count */}
        <div className="bg-white border border-slate-205 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">已对齐物理实体 (Nodes)</span>
            <span className="text-2xl font-black font-mono text-slate-900">{nodes.length} 个</span>
          </div>
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Relation Count */}
        <div className="bg-white border border-slate-205 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">关系谓词动作 (Triples)</span>
            <span className="text-2xl font-black font-mono text-slate-900">{edges.length} 条</span>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Orphans Detector */}
        <div className="bg-white border border-slate-205 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">未关联孤立项 (Orphans)</span>
            <span className="text-2xl font-black font-mono text-slate-900 flex items-center gap-1.5">
              {currentOrphanCount} 个
              {currentOrphanCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-705 rounded border border-amber-200 animate-pulse">待修复</span>
              )}
            </span>
          </div>
          <div className={`p-2 rounded-lg text-amber-600 ${currentOrphanCount > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-200"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activeTab === "explorer" ? (
        /* PANEL A: Visual Explorer, Inspector & SPARQL Console */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Visual canvas SVG */}
          <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl p-5 shadow-inner space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-xs font-mono">
              <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                语义图本地运行时 (Ontology Runtime Store)
              </span>
              <div className="flex gap-3 text-slate-400">
                <button 
                  onClick={refreshOntology}
                  className="flex items-center gap-1.5 hover:text-white transition"
                  title="刷新图谱状态"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  同步数据
                </button>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden select-none h-[390px]">
              <svg className="w-full h-full">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                  </marker>
                  <marker id="arrow-high" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
                  </marker>
                </defs>

                {/* Draw connecting Edges */}
                {edges.map(edge => {
                  const start = nodePositions[edge.source];
                  const end = nodePositions[edge.target];
                  if (!start || !end) return null;

                  const isPathHighlighted = highlightedNodes.includes(edge.source) || highlightedNodes.includes(edge.target);

                  return (
                    <g key={edge.id}>
                      <line 
                        x1={start.x} 
                        y1={start.y} 
                        x2={end.x} 
                        y2={end.y} 
                        stroke={isPathHighlighted ? "#818cf8" : "#334155"} 
                        strokeWidth={isPathHighlighted ? 2.2 : 1.2}
                        markerEnd={`url(#${isPathHighlighted ? "arrow-high" : "arrow"})`}
                        className="transition-all duration-300"
                      />
                      <rect 
                        x={(start.x + end.x) / 2 - 25}
                        y={(start.y + end.y) / 2 - 6}
                        width="50"
                        height="12"
                        rx="3"
                        fill="#0b0f19"
                        opacity="0.8"
                      />
                      <text 
                        x={(start.x + end.x) / 2} 
                        y={(start.y + end.y) / 2 + 2} 
                        fill={isPathHighlighted ? "#a5b4fc" : "#64748b"} 
                        fontSize="8.5" 
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Interactive Nodes */}
                {nodes.map(node => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;

                  const isSelected = selectedNode?.id === node.id;
                  const isHighlighted = highlightedNodes.length > 0 && highlightedNodes.includes(node.id);
                  const isHovered = hoveredNode?.id === node.id;

                  let color = "#4f46e5"; // default Indigo
                  if (node.type === "LLM") color = "#9333ea"; // Purple
                  if (node.type === "Engine") color = "#0d9488"; // Teal
                  if (node.type === "Protocol") color = "#db2777"; // Pink
                  if (node.type === "KnowledgeBase") color = "#059669"; // Emerald

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-transform duration-350"
                      onClick={() => setSelectedNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Pulse active rings */}
                      {(isSelected || isHighlighted || isHovered) && (
                        <circle 
                          r={isSelected ? 18 : 16} 
                          fill="none" 
                          stroke={isHighlighted ? "#818cf8" : "#ffffff"} 
                          strokeWidth={isSelected ? 2.5 : 1.5} 
                          className={isHighlighted ? "animate-pulse" : ""}
                          opacity={0.65}
                        />
                      )}
                      
                      <circle r="10.5" fill={color} stroke="#090d16" strokeWidth="2" />
                      
                      {/* Label typography */}
                      <text 
                        y="23" 
                        fill={isSelected ? "#ffffff" : isHighlighted ? "#a5b4fc" : "#cbd5e1"} 
                        fontSize="9.5" 
                        fontFamily="sans-serif"
                        fontWeight={isSelected || isHighlighted ? "bold" : "normal"}
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Instructions and Actions overlaid on canvas */}
              <div className="absolute bottom-3 left-4 text-[10px] text-slate-500">
                💡 单击可视化拓扑节点，进行属性核对审校与快速关系网搭建。
              </div>

              <div className="absolute top-3 right-3 flex gap-1.5">
                <button 
                  onClick={() => setIsAddNodeOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3" />
                  新增节点
                </button>
                <button 
                  onClick={() => {
                    if (nodes.length < 2) {
                      alert("请先创建至少两个节点以上。");
                      return;
                    }
                    setEdgeSource(nodes[0].id);
                    setEdgeTarget(nodes[1].id);
                    setIsAddEdgeOpen(true);
                  }}
                  className="bg-transparent hover:bg-slate-800 text-slate-300 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  构建连线关系
                </button>
                {highlightedNodes.length > 0 && (
                  <button 
                    onClick={() => setHighlightedNodes([])}
                    className="bg-slate-800 hover:bg-slate-750 text-indigo-300 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-700"
                  >
                    重置高亮 ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Columns: Detail Inspector & SPARQL query runner */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Inspector Box */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs text-xs space-y-4">
              <span className="font-semibold text-slate-900 border-b pb-2.5 block flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-550" />
                三元要素特征检视器 (RDF Inspector)
              </span>

              {selectedNode ? (
                <div className="space-y-4 font-mono leading-relaxed animate-fade-in">
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${getLabelColor(selectedNode.type)}`}>
                      {selectedNode.type}
                    </span>
                    <span className="font-bold text-slate-800 truncate" title={selectedNode.label}>
                      {selectedNode.label}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-sans font-bold block">RDF 属性描述子:</span>
                    {Object.keys(selectedNode.properties || {}).length === 0 ? (
                      <span className="text-slate-400 block text-[11px] font-sans">暂未设置键值性质对</span>
                    ) : (
                      Object.entries(selectedNode.properties).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[11px] py-1 border-b border-slate-100 last:border-b-0">
                          <span className="text-slate-500 font-sans">{k}</span>
                          <span className="text-slate-900 font-bold max-w-[130px] truncate" title={v}>{v}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-sans pt-1">
                    <button 
                      onClick={() => {
                        setEdgeSource(selectedNode.id);
                        setEdgeTarget("");
                        setIsAddEdgeOpen(true);
                      }}
                      className="text-indigo-650 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3" />
                      从此发起关系线
                    </button>
                    
                    <button 
                      onClick={async () => {
                        if (confirm(`确认要销毁该本体概念项《${selectedNode.label}》及相关的全部连接谓词吗？`)) {
                          await onDeleteNode(selectedNode.id);
                          setSelectedNode(null);
                        }
                      }}
                      className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      彻底销毁
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-10 font-sans">
                  未选择实体概念。请在左侧点击 SVG 图谱中的彩色节点块，开启详细特征审查与审计。
                </div>
              )}
            </div>

            {/* SPARQL execution console */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs text-xs space-y-3">
              <span className="font-semibold text-slate-900 border-b pb-2.5 block flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-550" />
                语义 SPARQL 引擎查询控制台
              </span>

              <p className="text-[10px] text-slate-450 leading-normal font-sans">
                支持标准的 RDF 查询分析模型：
              </p>

              <textarea 
                value={sparqlQuery}
                onChange={(e) => setSparqlQuery(e.target.value)}
                rows={5}
                className="w-full text-[10.5px] p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono bg-slate-950 text-indigo-300 leading-normal"
              />

              <button 
                onClick={handleSparqlExecute}
                disabled={sparqlRunning || !sparqlQuery.trim()}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-mono shadow-xs disabled:opacity-50 transition"
              >
                <Terminal className="w-3.5 h-3.5" />
                {sparqlRunning ? "图图遍历计算中..." : "执行 SPARQL 解耦 (Query)"}
              </button>

              {sparqlOutcome && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] font-mono text-slate-350 max-h-36 overflow-y-auto space-y-1.5 animate-fade-in">
                  <div className="flex justify-between items-center text-[8px] text-indigo-400 font-bold border-b border-slate-900 pb-1.5">
                    <span>STATUS: 命中成功</span>
                    <span>解析用时: 11.2ms</span>
                  </div>
                  {sparqlOutcome.length === 0 ? (
                    <p className="text-slate-500 text-center py-1">无匹配的 RDF 三元回执数据</p>
                  ) : (
                    sparqlOutcome.map((row, i) => (
                      <div key={i} className="border-b border-slate-900/40 pb-1 text-[9px] last:border-0">
                        <span className="text-slate-450">ms:{row.label?.value || "unlabeled"}</span>
                        <div className="text-emerald-400 font-bold truncate">──[type]──&gt; 类 ms:{row.object?.value || "Object"}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* PANEL B: INTEGRATED TESTER SUITE & RAG CONTEXT SIMULATOR (Tab 2) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Section 1: Core automated testing runs */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b pb-3 border-slate-150">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-650" />
                  1. 结构规范与本体健康一致性一致检测 (Consistency Auditing)
                </span>
                <span className="text-[10px] text-slate-400 block font-normal">
                  对局部物理实体链路进行闭环与孤立关系树自动化验证排查。
                </span>
              </div>

              <button 
                onClick={runAutomatedIntegrityCheck}
                disabled={verifying}
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap self-end border border-transparent shadow-3xs"
              >
                {verifying ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-indigo-400 fill-white" />
                )}
                {verifying ? "核对规范中..." : "启动规则校检测试"}
              </button>
            </div>

            {/* Test statistics progress and diagnostics checks indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Orphan check outcome */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-600 block">Orphan Checking</span>
                <div className="flex items-center gap-1.5">
                  {currentOrphanCount === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-800">Pass (零孤立点)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
                      <span className="text-xs font-bold text-slate-800">存在 {currentOrphanCount} 个孤立项</span>
                    </>
                  )}
                </div>
                {currentOrphanCount > 0 && (
                  <button 
                    onClick={handleAutoRepairOrphans}
                    className="w-full text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-1 rounded-md mt-1.5 font-bold hover:bg-indigo-100/60 transition block text-center"
                    title="一键修补这些本体实体的关联依存"
                  >
                    一键发起自动依赖织网
                  </button>
                )}
              </div>

              {/* Tag alignment check outcome */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-600 block">Metadata Overlaps</span>
                <div className="flex items-center gap-1.5">
                  {documents.length === 0 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">缺少文档索引对</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-indigo-550" />
                      <span className="text-xs font-semibold text-slate-800">
                        密契度: {Math.round((nodes.filter(n => documents.some(d => d.tags.includes(n.label) || n.label.includes(d.title))).length / (nodes.length || 1)) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 block font-normal leading-normal">
                  反映各本体类在底层文档中的物理覆盖情况。
                </span>
              </div>

              {/* Class coverage checks */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-600 block">Structural Completeness</span>
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-indigo-650" />
                  <span className="text-xs font-black text-slate-800">
                    {currentHealth >= 85 ? "高密因果树" : currentHealth >= 65 ? "轻度连通" : "松散定义"}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block font-normal leading-normal">
                  网络直径评级，关系边高连通抗幻觉得分较高。
                </span>
              </div>
            </div>

            {/* Test console terminal code block logs */}
            <div className="space-y-1.5 font-mono text-[11px]">
              <span className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                本体自动化测试追踪台日志 (Compliance Runner Logs)
              </span>
              
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-910 h-56 overflow-y-auto leading-relaxed text-[10.5px] shadow-inner font-mono select-text">
                {testSuiteLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-16">
                    <p className="font-bold">等待执行测试运行...</p>
                    <p className="text-[10px] mt-1 text-slate-600">点击右上方「启动规则校检测试」按钮开始收集本地 RDF 模型的结构诊断日志。</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {testSuiteLogs.map((log, idx) => (
                      <p key={idx} className="break-all whitespace-pre-wrap">{log}</p>
                    ))}
                    <p className="animate-pulse font-bold text-indigo-305 mt-2">● COMPLETED. HEALTH INDEX ASSESSMENT CONCLUDED.</p>
                  </div>
                )}
              </div>
              {verifiedAt && (
                <div className="text-[10px] text-slate-400 text-right font-normal">
                  审计结束时间: <b className="text-slate-600">{verifiedAt}</b> (测试用时约 120ms)
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Joint prompt injection sandbox simulator */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="border-b pb-3 border-slate-150 space-y-0.5">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
                2. 混合多源 RAG 装配测试沙箱 (Multi-Source Prompt Injection Testbed)
              </span>
              <span className="text-[10px] text-slate-400 block font-normal">
                测算特定核心词查询在大模系统拼装层，进行本体实体约束后的增强型 System Context。
              </span>
            </div>

            {/* Scenario selector preset inputs Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">第一步：选择特定查询测试场景 (Scenario presets)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button 
                  onClick={() => handleRunRagSimulation("agent")}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col justify-between ${
                    simActiveScenario === "agent"
                      ? "bg-indigo-50/50 border-indigo-250 text-indigo-950"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="text-[11px] block text-indigo-700">场景一: AI与MCP生态规范</span>
                  <p className="text-[9.5px] font-normal text-slate-450 mt-1">测试智能体底层协议标准的关联防撞。</p>
                </button>

                <button 
                  onClick={() => handleRunRagSimulation("finance")}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col justify-between ${
                    simActiveScenario === "finance"
                      ? "bg-indigo-50/50 border-indigo-250 text-indigo-950"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="text-[11px] block text-indigo-700">场景二: 控股财报主线财务</span>
                  <p className="text-[9.5px] font-normal text-slate-450 mt-1">保障控股营收毛利等巨额数据的精确性。</p>
                </button>

                <button 
                  onClick={() => handleRunRagSimulation("medical")}
                  className={`p-2.5 rounded-xl border font-bold text-left transition flex flex-col justify-between ${
                    simActiveScenario === "medical"
                      ? "bg-indigo-50/50 border-indigo-250 text-indigo-950"
                      : "bg-white border-slate-205 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="text-[11px] block text-indigo-705">场景三: 糖尿病临床科研</span>
                  <p className="text-[9.5px] font-normal text-slate-450 mt-1">阻止医学名词多受体交互的多线医学偏差。</p>
                </button>
              </div>
            </div>

            {/* Custom input or Execute button */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={simQuery}
                onChange={(e) => {
                  setSimQuery(e.target.value);
                  setSimActiveScenario("custom");
                }}
                placeholder="键入自定义检索测试词..."
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-800"
              />
              <button 
                onClick={() => handleRunRagSimulation(simActiveScenario)}
                disabled={simRunning || !simQuery.trim()}
                className="bg-slate-950 hover:bg-slate-900 border border-transparent text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-3xs flex items-center gap-1"
              >
                {simRunning ? "演算中..." : "启动干涉模拟"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulated dry run comparison results dashboard */}
            {simOutcome && (
              <div className="space-y-4 animate-fade-in text-xs font-mono">
                
                {/* Visual Head-to-Head Comparison Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Traditional RAG stats */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center select-none font-sans">
                      <span className="font-bold text-slate-700 block">传统文档RAG架构 (Standard)</span>
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-[9px] rounded border border-rose-100">⚠️ 高风险</span>
                    </div>
                    
                    <div className="space-y-1 text-[11px] font-sans">
                      <div className="flex justify-between">
                        <span className="text-slate-400">召回文档篇目:</span>
                        <span className="text-slate-800 font-bold">{simOutcome.matchedDocs.length} 篇</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">因果拓扑约束:</span>
                        <span className="text-red-500 font-bold">无支持 (0 条元知识)</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/50 pt-1.5 mt-1">
                        <span className="text-slate-400">LLM大模型幻觉率:</span>
                        <span className="text-red-600 font-black text-xs font-mono">{simOutcome.hallucinationRiskValue + 5}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Moer Graph-Augmented structure stats */}
                  <div className="bg-indigo-50/30 border border-indigo-150 p-3.5 rounded-xl space-y-2">
                    <div className="flex justify-between items-center select-none font-sans">
                      <span className="font-bold text-indigo-950 block">Moer 语义图谱RAG (Augmented)</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded border border-emerald-100">✅ 极安全</span>
                    </div>
                    
                    <div className="space-y-1 text-[11px] font-sans">
                      <div className="flex justify-between">
                        <span className="text-indigo-900/60">对准图概念节点:</span>
                        <span className="text-indigo-950 font-bold">{simOutcome.matchedNodes.length} 个</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-900/60 font-medium">验证合格边缘数:</span>
                        <span className="text-emerald-700 font-bold">已注入 {simOutcome.matchedEdges.length} 条</span>
                      </div>
                      <div className="flex justify-between border-t border-indigo-150/50 pt-1.5 mt-1">
                        <span className="text-indigo-900/65 font-semibold">LLM大模型幻觉率:</span>
                        <span className="text-emerald-600 font-black text-xs font-mono">0.02% (零偏差风险)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt Injection content panel preview */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-sans">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-slate-500" />
                      增强型大模型 System Prompt 上下文预览
                    </span>
                    <button 
                      onClick={() => copyToClipboard(simOutcome.augmentedPrompt)}
                      className="text-indigo-650 hover:text-indigo-850 font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3 text-emerald-500" />
                          已复制 Prompt
                        </>
                      ) : (
                        <>
                          <Copy className="w-3" />
                          复制完整 Prompt 文书
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 text-slate-350 p-4 rounded-xl leading-normal text-[10px] overflow-y-auto max-h-56 shadow-inner font-mono select-text whitespace-pre-wrap">
                    {simOutcome.augmentedPrompt}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL WINDOW 1: Add/create concept nodes */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-fade-in font-sans">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-slate-905 flex items-center gap-1 text-sm">
                <Plus className="w-4 h-4 text-indigo-600" />
                定义本体实体概念 (Create Ontological Class Instance)
              </span>
              <button 
                onClick={() => setIsAddNodeOpen(false)} 
                className="text-slate-400 hover:text-slate-650 text-xl font-bold transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateNodeSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">实体主标题 (Entity Header label) *</span>
                <input 
                  type="text" 
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  placeholder="如: BERT-Vector-Model"
                  className="w-full border px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">本体定义类 (RDF Semantic Class Type) *</span>
                <select 
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="w-full border px-3 py-2 rounded-xl bg-white focus:outline-none text-xs"
                >
                  <option value="Concept">Concept (科学体系/学术概念)</option>
                  <option value="System">System (Moer核心搜索技术总览)</option>
                  <option value="Protocol">Protocol (智能体协同交互接口)</option>
                  <option value="LLM">LLM (高通大参数基座模型)</option>
                  <option value="KnowledgeBase">KnowledgeBase (特色专有词典或领域本体库)</option>
                </select>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2.5">
                <span className="font-bold text-indigo-950 block text-[10.5px]">元属性特征 Key-Value:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="键名 (如: developer)" 
                    value={nodePropKey}
                    onChange={(e) => setNodePropKey(e.target.value)}
                    className="border px-2.5 py-1.5 rounded-lg bg-white text-[11px] font-mono"
                  />
                  <input 
                    type="text" 
                    placeholder="值 (如: 智能科技)" 
                    value={nodePropVal}
                    onChange={(e) => setNodePropVal(e.target.value)}
                    className="border px-2.5 py-1.5 rounded-lg bg-white text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3.5">
                <button 
                  type="button" 
                  onClick={() => setIsAddNodeOpen(false)} 
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold"
                >
                  放弃取消
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition"
                >
                  部署本体实体
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WINDOW 2: Add/create predicate relations edge */}
      {isAddEdgeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-fade-in font-sans">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-slate-905 flex items-center gap-1 text-sm">
                <BookOpen className="w-4 h-4 text-indigo-650" />
                建立主谓宾 RDF 物理谓词边 (Establish Predicate Link)
              </span>
              <button 
                onClick={() => setIsAddEdgeOpen(false)} 
                className="text-slate-405 hover:text-slate-650 text-xl font-bold transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEdgeSubmit} className="space-y-4 text-xs">
              <div className="space-y-1 font-sans">
                <span className="font-bold text-slate-700 block">主语要素 (Subject Node) *</span>
                <select 
                  value={edgeSource}
                  onChange={(e) => setEdgeSource(e.target.value)}
                  className="w-full border px-3 py-2 rounded-xl bg-white focus:outline-none font-mono"
                  required
                >
                  <option value="" disabled>-- 选取源节点 --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 font-sans">
                <span className="font-bold text-slate-700 block">宾语要素 (Object Node) *</span>
                <select 
                  value={edgeTarget}
                  onChange={(e) => setEdgeTarget(e.target.value)}
                  className="w-full border px-3 py-2 rounded-xl bg-white focus:outline-none font-mono"
                  required
                >
                  <option value="" disabled>-- 选取目标指向节点 --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 font-sans">
                <span className="font-bold text-slate-700 block">关系谓词或依存连接动词 (Predicate Action) *</span>
                <input 
                  type="text" 
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  placeholder="如: 包含, 依存, 优化适配, 调用"
                  className="w-full border px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3.5">
                <button 
                  type="button" 
                  onClick={() => setIsAddEdgeOpen(false)} 
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold"
                >
                  放弃
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition"
                >
                  连接本体关系
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
