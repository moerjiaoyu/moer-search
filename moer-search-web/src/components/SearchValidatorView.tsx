import React, { useState } from "react";
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  HelpCircle, 
  Layers, 
  Award, 
  Cpu, 
  Bookmark, 
  Zap, 
  History,
  CheckCircle2,
  GitBranch,
  Database,
  Terminal,
  ArrowRight,
  Activity,
  Network,
  Info
} from "lucide-react";
import { DocumentItem, IndexItem, OntologyNode, OntologyEdge } from "../types";

// Simple custom markdown renderer helper for simplicity because of react-markdown guidelines
function MiniMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-xs leading-relaxed font-sans text-slate-800">
      {lines.map((line, idx) => {
        if (line.startsWith("### ")) {
          return <h4 key={idx} className="text-xs font-bold text-slate-900 pt-2 border-b border-indigo-50/60 pb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-500" />{line.replace("### ", "")}</h4>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={idx} className="text-sm font-bold text-indigo-950 pt-3 border-b border-indigo-100 pb-1 flex items-center gap-1.5">{line.replace("## ", "")}</h3>;
        }
        if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
          return <p key={idx} className="pl-4 relative flex gap-1.5"><span className="text-indigo-600 font-mono font-bold shrink-0">{line.substring(0, 2)}</span><span>{line.substring(3)}</span></p>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <p key={idx} className="pl-4 relative flex gap-1.5"><span className="text-slate-400 font-bold shrink-0">•</span><span>{line.substring(2)}</span></p>;
        }
        
        // Simple bold replacements **text** -> <strong>text</strong>
        let renderedLine: React.ReactNode = line;
        if (line.includes("**")) {
          const parts = line.split("**");
          renderedLine = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-950 bg-indigo-50/50 px-1 rounded">{part}</strong> : part);
        }

        return <p key={idx} className="min-h-[1em]">{renderedLine}</p>;
      })}
    </div>
  );
}

interface SearchValidatorViewProps {
  indexes: IndexItem[];
  onTriggerSearch: (payload: { 
    query: string; 
    indexId: string; 
    searchType: string; 
    minScore: number; 
    topK: number; 
    isAiEnhance: boolean;
    useOntology?: boolean;
    enabledSkills?: string[];
  }) => Promise<{
    results: (DocumentItem & { contentHighlight?: string })[];
    aiSummary?: string;
    totalHits: number;
    filteredCount: number;
    matchedOntologyNodes?: OntologyNode[];
    matchedOntologyEdges?: OntologyEdge[];
    triggeredSkills?: { name: string; output: any; logs: string[] }[];
  }>;
}

export default function SearchValidatorView({ indexes, onTriggerSearch }: SearchValidatorViewProps) {
  const [query, setQuery] = useState("Q1 控股集团 架构");
  const [indexConstraint, setIndexConstraint] = useState("all");
  const [searchMethod, setSearchMethod] = useState<"hybrid" | "fulltext" | "vector">("hybrid");
  const [isAiSearch, setIsAiSearch] = useState(true);
  
  // Weights / Sorters / Advanced parameters
  const [minScore, setMinScore] = useState(0.15);
  const [topK, setTopK] = useState(5);
  const [showConfig, setShowConfig] = useState(true); // Open by default for easier testing of multi-source setup
  const [useOntology, setUseOntology] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["web_search_tool", "ontology_traversal_tool"]);

  // Results state
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchHits, setSearchHits] = useState<(DocumentItem & { contentHighlight?: string })[]>([]);
  const [aiResponseSummary, setAiResponseSummary] = useState<string | null>(null);
  
  // Custom multi-source response fields
  const [matchedNodes, setMatchedNodes] = useState<OntologyNode[]>([]);
  const [matchedEdges, setMatchedEdges] = useState<OntologyEdge[]>([]);
  const [triggeredSkills, setTriggeredSkills] = useState<{ name: string; output: any; logs: string[] }[]>([]);

  const [metrics, setMetrics] = useState({
    totalCount: 0,
    filteredCount: 0,
    tookMs: 0
  });

  const [searchHistory, setSearchHistory] = useState<string[]>([
    "Q1 控股集团 架构",
    "智能体协议 web_search_tool",
    "糖尿病足 临床医学",
    "2026 营收 同比增长"
  ]);

  const handleSearchExecute = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q || !q.trim()) return;

    if (overrideQuery) {
      setQuery(overrideQuery);
    }

    setSearching(true);
    setSearchDone(false);
    setAiResponseSummary(null);
    setMatchedNodes([]);
    setMatchedEdges([]);
    setTriggeredSkills([]);
    
    const start = performance.now();

    try {
      const response = await onTriggerSearch({
        query: q.trim(),
        indexId: indexConstraint,
        searchType: searchMethod,
        minScore,
        topK,
        isAiEnhance: isAiSearch,
        useOntology,
        enabledSkills: selectedSkills
      });

      const end = performance.now();
      
      setSearchHits(response.results);
      if (response.aiSummary) {
        setAiResponseSummary(response.aiSummary);
      }
      
      setMatchedNodes(response.matchedOntologyNodes || []);
      setMatchedEdges(response.matchedOntologyEdges || []);
      setTriggeredSkills(response.triggeredSkills || []);

      setMetrics({
        totalCount: response.totalHits,
        filteredCount: response.filteredCount,
        tookMs: Math.round(end - start + 12) // Simulate network/database engine overhead
      });
      setSearchDone(true);

      // Append query to local search history
      if (!overrideQuery && !searchHistory.includes(q.trim())) {
        setSearchHistory([q.trim(), ...searchHistory.slice(0, 3)]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const getIndexName = (indexId: string) => {
    const found = indexes.find(i => i.id === indexId);
    return found ? found.name : indexId;
  };

  return (
    <div className="space-y-6">
      {/* Intro info */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">图谱与技能双通路 RAG 演练台</h2>
          <p className="text-xs text-slate-500 mt-1">
            围绕提供准确知识，无缝融通<b>「搜索索引结构化召回」</b>、<b>「知识本体图谱概念对齐」</b>与<b>「MCP智能体接口技能」</b>，对大模型进行高准确度场景化上下文装配。
          </p>
        </div>
      </div>

      {/* Primary search dashboard component */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Mode configuration selector */}
        <div className="flex border-b border-slate-100 pb-3 justify-between items-center text-xs">
          <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200 shadow-xs">
            <button 
              onClick={() => setIsAiSearch(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                !isAiSearch ? "bg-white text-slate-800 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              常规多路检索 (Index Search Only)
            </button>
            <button 
              onClick={() => setIsAiSearch(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                isAiSearch ? "bg-slate-950 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              全链路智识融合检索 (Multi-Source Pipeline)
            </button>
          </div>

          <button 
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-slate-650 hover:text-slate-900 transition flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            配制检索网格参数 (Settings)
          </button>
        </div>

        {/* Search execution entry field */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchExecute()}
              placeholder="请输入检索描述，如带有「糖尿病」、「财报」、「MCP」或运算等式的测试段落..."
              className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 font-medium placeholder-slate-400"
            />
          </div>

          <button 
            onClick={() => handleSearchExecute()}
            disabled={searching || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-xs shadow-sm flex items-center gap-1.5 transition select-none disabled:opacity-50 shrink-0"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Zap className="w-3.5 h-3.5 text-indigo-100 fill-white" />
            )}
            {searching ? "智识装配中..." : "启动融合搜索"}
          </button>
        </div>

        {/* Recommendation suggestions list */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <History className="w-3" />
            场景化验证预设:
          </span>
          {searchHistory.map((s, idx) => (
            <button 
              key={idx}
              onClick={() => handleSearchExecute(s)}
              className="bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-150 font-mono text-[11px] transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Dynamic configuration panel and switches */}
        {showConfig && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs font-mono animate-fade-in">
            {/* Row 1: Search settings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 border-b border-slate-200/60">
              <div className="space-y-1.5">
                <span className="block font-semibold text-slate-700">1. 常规索引召回 (Search Method)</span>
                <div className="grid grid-cols-3 gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-center text-[10px]">
                  <button 
                    type="button" 
                    onClick={() => setSearchMethod("hybrid")}
                    className={`py-1 rounded font-bold transition ${searchMethod === "hybrid" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    Hybrid
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSearchMethod("fulltext")}
                    className={`py-1 rounded font-bold transition ${searchMethod === "fulltext" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    BM25
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSearchMethod("vector")}
                    className={`py-1 rounded font-bold transition ${searchMethod === "vector" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    Vector
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block font-semibold text-slate-700">索引分区限制 (Constraint)</span>
                <select 
                  value={indexConstraint}
                  onChange={(e) => setIndexConstraint(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-[11px]"
                >
                  <option value="all">全平台索引全库混合检索</option>
                  {indexes.map(idx => (
                    <option key={idx.id} value={idx.id}>{idx.name} ({idx.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>相关度分界卡点</span>
                  <span className="text-indigo-600">≥ {minScore}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={0.9} 
                  step={0.05} 
                  value={minScore} 
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>最大检索汇聚深度</span>
                  <span className="text-indigo-600">Top-{topK}</span>
                </div>
                <input 
                  type="range" 
                  min={1} 
                  max={15} 
                  step={1} 
                  value={topK} 
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Row 2: Graph-RAG Ontology & Skills toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ontology configuration switch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    2. 主动本体关系关联树 (Antithesis Graph Mapping)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useOntology} 
                      onChange={(e) => setUseOntology(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  自动剖析用户查询的语义分词，对齐本地图谱中定义的实体及其SPARQL三元关系，通过在Prompt中插入强因果关系来消弭大模型幻觉。
                </p>
              </div>

              {/* Skills configuration switches */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  3. 绑定外置接口认知技能 (Agentic MCP Tools)
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => toggleSkill("web_search_tool")}
                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition flex items-center gap-1 ${
                      selectedSkills.includes("web_search_tool") 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    web_search_tool (联网实时对齐)
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSkill("calculator_tool")}
                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition flex items-center gap-1 ${
                      selectedSkills.includes("calculator_tool") 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    calculator_tool (微观计算规整)
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSkill("ontology_traversal_tool")}
                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition flex items-center gap-1 ${
                      selectedSkills.includes("ontology_traversal_tool") 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    ontology_traversal_tool (图遍历抓取)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Trace Pipeline View showing step-by-step logic */}
      {searchDone && (
        <div className="space-y-6">
          {/* Section A: Orchestration trace visualizer (RAG Topology Chart) */}
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 shadow-inner space-y-4 font-mono">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <Activity className="w-4 h-4" />
                全链路智识融合检索演练追踪器 (Pipeline State Orchestrator Trace)
              </span>
              <span className="text-slate-500 text-[10px]">运行延迟: {metrics.tookMs}ms | 时效评估: HIGH</span>
            </div>

            {/* Step flow timeline blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 text-[11px]">
              {/* Step 1 */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold">STAGE 1: 查询剖析</div>
                  <div className="font-semibold text-white truncate max-w-full my-1">"{query}"</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  分词完毕, 提取到触发词。
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                searchHits.length > 0 ? "bg-slate-950/80 border-slate-800" : "bg-slate-950/30 border-slate-900 opacity-60"
              }`}>
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold">STAGE 2: 多路索引 recall</div>
                  <div className="font-semibold text-emerald-400 my-1">{searchHits.length} 篇文档匹配</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  BM25 与向量评分重排
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                useOntology ? "bg-slate-950/80 border-slate-800" : "bg-slate-950/30 border-slate-900 opacity-40 text-slate-500"
              }`}>
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold">STAGE 3: 本地图谱对齐</div>
                  <div className="font-semibold text-indigo-300 my-1">
                    {useOntology ? `匹配概念: ${matchedNodes.length}个` : "图约束关闭"}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 truncate">
                  {matchedNodes.length > 0 ? matchedNodes.slice(0, 2).map(n => n.label).join(", ") : "未拉起对齐"}
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                triggeredSkills.length > 0 ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-slate-950/30 border-slate-900 opacity-40 text-slate-500"
              }`}>
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold">STAGE 4: MCP 认知外合</div>
                  <div className="font-semibold text-amber-400 my-1">
                    {triggeredSkills.length > 0 ? `拉起技能: ${triggeredSkills.length}个` : "没有匹配外部接口"}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 truncate">
                  {triggeredSkills.map(s => s.name).join(", ") || "无执行"}
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-indigo-950/30 border border-indigo-900/60 p-3 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-indigo-300 font-bold">STAGE 5: LLM 提炼生成</div>
                  <div className="text-white font-bold my-1">Gemini 3.5 Flash</div>
                </div>
                <div className="text-[10px] text-indigo-200 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  已输出高准确知识
                </div>
              </div>
            </div>

            {/* Trace detail subviews for matched ontology nodes and active skills logs */}
            {(matchedNodes.length > 0 || triggeredSkills.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                {/* Ontology Concept links trace display */}
                {matchedNodes.length > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-indigo-400" />
                      对齐本体图谱的局部拓扑 (Aligned Subgraph Nodes & Triples)
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pb-1">
                      {matchedNodes.map(node => (
                        <span key={node.id} className="text-[10px] bg-slate-900 border border-indigo-950/80 px-2 py-0.5 rounded-md text-indigo-200">
                          {node.label} <b className="text-[9px] text-slate-500 font-normal">({node.type})</b>
                        </span>
                      ))}
                    </div>
                    {matchedEdges.length > 0 ? (
                      <div className="space-y-1 text-[10px] max-h-[100px] overflow-y-auto border-t border-slate-850 pt-1.5 text-slate-400 text-left">
                        {matchedEdges.slice(0, 4).map(e => {
                          const sLabel = matchedNodes.find(n => n.id === e.source)?.label || e.source;
                          const tLabel = matchedNodes.find(n => n.id === e.target)?.label || e.target;
                          return (
                            <div key={e.id} className="truncate select-text">
                              🎯 <b className="text-slate-350">《{sLabel}》</b> ──[{e.label}]──&gt; <b className="text-slate-350">《{tLabel}》</b>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 pt-1">检测到单点概念，无网状邻接边配对。</div>
                    )}
                  </div>
                )}

                {/* Cognitive skills logs trace display */}
                {triggeredSkills.length > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      外挂 MCP 接口技能调试信息 (Skills Execution Pipeline Console)
                    </span>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto text-[10px] text-slate-400 leading-tight">
                      {triggeredSkills.map((ts, idx) => (
                        <div key={idx} className="border-b border-slate-900 pb-2 last:border-none last:pb-0">
                          <div className="text-amber-300 font-bold flex items-center justify-between">
                            <span>● [{ts.name}] CALLED</span>
                            <span className="text-[9px] font-normal text-slate-500">MCP Protocol 2026.04</span>
                          </div>
                          {ts.logs.map((log, lidx) => (
                            <div key={lidx} className="text-[9px] text-slate-400 pl-2">
                              └─ <span className="text-slate-500">[{lidx + 1}]</span> {log}
                            </div>
                          ))}
                          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 text-[9px] font-mono text-emerald-400 mt-1 select-all overflow-x-auto max-h-[60px] whitespace-pre">
                            {JSON.stringify(ts.output, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section B: Standard list of hit documents vs AI synthesis response */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left Column list of ranking docs */}
            <div className={`space-y-4 lg:col-span-3 ${isAiSearch && aiResponseSummary ? "lg:col-span-3" : "lg:col-span-5"}`}>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 pl-1">
                <Database className="w-4 h-4 text-slate-550" />
                多路召回重排命中结果列表 ({searchHits.length} 篇事实)
              </h3>
              
              {searchHits.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-1">
                  <p className="text-xs font-semibold">无满足相关度分数下限（&gt;={minScore}）的文档结果</p>
                  <p className="text-[11px] text-slate-400">您可以调低重排分数下限，或在高级设置中切换到 Hybrid 双向匹配来获取更多召回内容。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchHits.map((hit, idx) => (
                    <div key={hit.id} className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl shadow-sm transition space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded font-bold">
                            RANK #{idx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 mt-1">{hit.title}</h4>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-mono font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-100">
                            {hit.score ? `重排得分: ${hit.score}` : "得分: --"}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 mt-1">/{getIndexName(hit.indexId)}</span>
                        </div>
                      </div>

                      <p 
                        className="text-xs text-slate-650 leading-relaxed font-sans border-l-2 border-slate-100 pl-3.5"
                        dangerouslySetInnerHTML={{ __html: hit.contentHighlight || hit.content }}
                      />

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                        <div className="flex gap-1">
                          {hit.tags.map((t, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 bg-slate-50 text-slate-500 rounded border border-slate-150">{t}</span>
                          ))}
                        </div>
                        <span>ID: {hit.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Pane with Sparkles AI synthesis */}
            {isAiSearch && aiResponseSummary && (
              <div className="lg:col-span-2 bg-indigo-50/45 border border-indigo-100 p-5 rounded-2xl shadow-sm space-y-4 lg:sticky lg:top-4 overflow-hidden">
                <div className="flex justify-between items-center border-b border-indigo-150 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-indigo-950 font-sans">Moer AI Search 混合提炼报告</span>
                  </div>
                  <div className="text-[10px] text-indigo-600 font-mono font-bold">
                    GEMINI-3.5-FLASH
                  </div>
                </div>

                <div className="bg-white/90 border border-indigo-100 rounded-xl p-4 shadow-inner overflow-y-auto max-h-[520px] select-text">
                  <MiniMarkdown text={aiResponseSummary} />
                </div>

                {/* Live references citations list */}
                <div className="space-y-2 text-slate-500">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase block flex items-center gap-1">
                    <Bookmark className="w-3" />
                    底座事实文献库引用 (Sources Linked)
                  </span>
                  <div className="space-y-1 text-[10px] font-mono leading-relaxed">
                    {searchHits.slice(0, 3).map((hit, i) => (
                      <div key={i} className="flex gap-1.5">
                        <span className="bg-indigo-100/80 text-indigo-700 px-1 rounded text-[9px] h-fit">[{i + 1}]</span>
                        <span className="truncate flex-1 text-slate-650 font-sans">《{hit.title}》</span>
                      </div>
                    ))}
                    {matchedNodes.length > 0 && (
                      <div className="flex gap-1.5 border-t border-dashed border-indigo-200/60 pt-1.5 mt-1 text-indigo-700 select-text font-sans">
                        <span className="bg-indigo-100 text-indigo-700 px-1 rounded text-[9px] h-fit">图谱</span>
                        <span>已关联本地本体图谱中共 {matchedNodes.length} 个核心概念及属性约束</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
