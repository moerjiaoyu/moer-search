import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Cpu, 
  Settings, 
  Database,
  Terminal, 
  Columns, 
  ArrowRight, 
  Play, 
  FileText,
  BadgeAlert,
  Loader2,
  CheckCircle2,
  Network
} from "lucide-react";
import { McpTool, ModelCompareResponse } from "../types";

interface AiAbilitiesViewProps {
  onQaSubmit: (question: string) => Promise<{ answer: string; reasoningTrace: string }>;
  onMcpInvoke: (toolName: string, args: any) => Promise<{ toolCallId: string; logsTrace: string[]; output: any }>;
  onModelCompare: (prompt: string) => Promise<ModelCompareResponse>;
  onExtractEntity: (text: string) => Promise<{ entities: any[]; relations: any[] }>;
  onInjectEntitiesToGraph: (payload: { entities: any[]; relations: any[] }) => void;
  hasLiveGemini: boolean;
}

export default function AiAbilitiesView({
  onQaSubmit,
  onMcpInvoke,
  onModelCompare,
  onExtractEntity,
  onInjectEntitiesToGraph,
  hasLiveGemini
}: AiAbilitiesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"qa" | "mcp" | "coliseum" | "nlp">("qa");

  // --- TAB 1 Q&A STATES ---
  const [qaInput, setQaInput] = useState("控股集团第一季度的财务表现如何？它包含了哪些核心特色引擎？");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaOutput, setQaOutput] = useState<string | null>(null);
  const [qaTrace, setQaTrace] = useState<string | null>(null);

  // --- TAB 2 MCP STATES ---
  const [mcpTools, setMcpTools] = useState<McpTool[]>([]);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [mcpResults, setMcpResults] = useState<{ id: string; trace: string[]; output: any } | null>(null);

  // --- TAB 3 COLISEUM STATES ---
  const [coliseumInput, setColiseumInput] = useState("分析在海量医疗检索中加入‘本体概念网’的业务收益和性能损失。");
  const [coliseumLoading, setColiseumLoading] = useState(false);
  const [coliseumOutput, setColiseumOutput] = useState<ModelCompareResponse | null>(null);

  // --- TAB 4 NLP EXTRACTOR STATES ---
  const [nlpText, setNlpText] = useState("系统搜索是一个高维混合引擎，它由数据实验室于2026年开发。该系统能够深度兼容 Claude3.5 及 Qwen2.5 两个适配模型。");
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResults, setNlpResults] = useState<{ entities: any[]; relations: any[] } | null>(null);
  const [nlpInjected, setNlpInjected] = useState(false);

  // Load MCP tools on init
  useEffect(() => {
    fetch("/api/mcp/tools")
      .then(res => res.json())
      .then(data => {
        setMcpTools(data);
        if (data.length > 0) {
          setSelectedTool(data[0]);
          // Prep initial helper arguments
          prepareArgs(data[0]);
        }
      })
      .catch(err => console.error("Could not fetch MCP tools", err));
  }, []);

  const prepareArgs = (tool: McpTool) => {
    const args: Record<string, any> = {};
    Object.keys(tool.inputSchema.properties).forEach(key => {
      const prop = tool.inputSchema.properties[key];
      if (prop.type === "number") args[key] = 3;
      else if (prop.type === "string") {
        if (key === "query") args[key] = "量子计算机发展白皮书";
        else if (key === "startNodeId") args[key] = "node_1";
        else args[key] = "zh-CN";
      }
    });
    setToolArgs(args);
  };

  const handleToolSelect = (tool: McpTool) => {
    setSelectedTool(tool);
    prepareArgs(tool);
    setMcpResults(null);
  };

  const handleQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInput.trim()) return;
    setQaLoading(true);
    setQaOutput(null);
    setQaTrace(null);
    try {
      const res = await onQaSubmit(qaInput.trim());
      setQaOutput(res.answer);
      setQaTrace(res.reasoningTrace);
    } catch {
      alert("智能问答失败，请核实网络链路。");
    } finally {
      setQaLoading(false);
    }
  };

  const handleMcpInvoke = async () => {
    if (!selectedTool) return;
    setMcpLoading(true);
    setMcpResults(null);
    try {
      const response = await onMcpInvoke(selectedTool.name, toolArgs);
      setMcpResults({
        id: response.toolCallId,
        trace: response.logsTrace,
        output: response.output
      });
    } catch (err: any) {
      alert("MCP 调用演示失败: " + err.message);
    } finally {
      setMcpLoading(false);
    }
  };

  const handleColiseumSubmit = async () => {
    if (!coliseumInput.trim()) return;
    setColiseumLoading(true);
    setColiseumOutput(null);
    try {
      const response = await onModelCompare(coliseumInput.trim());
      setColiseumOutput(response);
    } catch {
      alert("大模型对决比对载入出错。");
    } finally {
      setColiseumLoading(false);
    }
  };

  const handleNlpExtract = async () => {
    if (!nlpText.trim()) return;
    setNlpLoading(true);
    setNlpResults(null);
    setNlpInjected(false);
    try {
      const output = await onExtractEntity(nlpText.trim());
      setNlpResults(output);
    } catch {
      alert("实体提取故障。");
    } finally {
      setNlpLoading(false);
    }
  };

  const handleInjectToGraph = () => {
    if (!nlpResults) return;
    onInjectEntitiesToGraph(nlpResults);
    setNlpInjected(true);
  };

  // Quick markdown inline parsing for QA block
  const renderSimpleHtml = (txt: string) => {
    return txt.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) return <h4 key={idx} className="text-sm font-semibold text-slate-900 mt-3 mb-1">{line.replace("### ", "")}</h4>;
      if (line.startsWith("## ")) return <h3 key={idx} className="text-base font-semibold text-slate-900 mt-4 mb-2 pb-1 border-b">{line.replace("## ", "")}</h3>;
      if (line.startsWith("#### ")) return <h5 key={idx} className="text-xs font-bold text-slate-800 mt-2 mb-1">{line.replace("#### ", "")}</h5>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={idx} className="ml-4 list-disc text-xs text-slate-650 my-1">{line.substring(2)}</li>;
      return <p key={idx} className="text-xs text-slate-650 leading-relaxed min-h-[1.2em]">{line}</p>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab select header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            AI 增益场景验证沙盒 (AI沙盒)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            全面沙盒化演示 Moer 与主流大模型融合、智能 MCP 主机协议调试与知识图谱实体自动注入提取。
          </p>
        </div>

        {/* Local api active tags */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-1 rounded-xl text-xs flex gap-1 font-mono">
          <button 
            type="button" 
            onClick={() => setActiveSubTab("qa")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${activeSubTab === "qa" ? "bg-white text-indigo-950 shadow-xs border border-indigo-150" : "text-slate-500 hover:text-slate-900"}`}
          >
            本库问答
          </button>
          <button 
            type="button" 
            onClick={() => setActiveSubTab("mcp")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${activeSubTab === "mcp" ? "bg-white text-indigo-950 shadow-xs border border-indigo-150" : "text-slate-500 hover:text-slate-900"}`}
          >
            MCP 联动
          </button>
          <button 
            type="button" 
            onClick={() => setActiveSubTab("coliseum")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${activeSubTab === "coliseum" ? "bg-white text-indigo-950 shadow-xs border border-indigo-150" : "text-slate-500 hover:text-slate-900"}`}
          >
            大模型比对
          </button>
          <button 
            type="button" 
            onClick={() => setActiveSubTab("nlp")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${activeSubTab === "nlp" ? "bg-white text-indigo-950 shadow-xs border border-indigo-150" : "text-slate-500 hover:text-slate-900"}`}
          >
            实体自动构建
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: RAG Q&A */}
      {activeSubTab === "qa" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in text-xs font-sans">
          
          {/* Left entry question: 1 col */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <span className="font-semibold text-slate-800 text-xs block border-b pb-2">请输入您的知识库检索指令</span>
            <form onSubmit={handleQaSubmit} className="space-y-3">
              <textarea 
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                rows={5}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-mono inline-block leading-relaxed"
                required
              />
              <button 
                type="submit"
                disabled={qaLoading}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1 shadow-xs font-mono disabled:opacity-50 select-none"
              >
                {qaLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {qaLoading ? "正在多路推理召回..." : "发起推理 Q&A"}
              </button>
            </form>
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[10px] text-indigo-950/80 leading-relaxed font-mono">
              💡 <b>检索原理</b>：Moer Search 会首先将提向转为语义嵌入向量，在 <code>idx_kb_finance</code> 以及其它在线索引中触发快速相似度遍历并携带命中文本段落输给大语言模型。
            </div>
          </div>

          {/* Right QA output list and execution trace mapping */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            {!qaOutput && !qaLoading ? (
              <div className="py-20 text-center text-slate-400 space-y-1">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>等待发起问答测试</p>
                <p className="text-[10px] text-slate-400">我们将在此处呈现大语言模型对多篇文献结合本体进行分析后的推理说明和多级引用标志。</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Loader block */}
                {qaLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-slate-500 text-xs tracking-wider animate-pulse font-mono">
                      【1/3级】提取高维向量 & 整合 SPARQL 实体指针关系网络并交付模型中...
                    </p>
                  </div>
                )}

                {/* Final Answers output */}
                {qaOutput && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Header info */}
                    <div className="flex items-center gap-1.5 pb-2.5 border-b border-indigo-50">
                      <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                      <span className="font-semibold text-slate-900 text-xs">Moer Search 最终推理共识报告 (Consensus)</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl overflow-y-auto max-h-[360px] space-y-3 shadow-inner">
                      {renderSimpleHtml(qaOutput)}
                    </div>

                    {/* Trace execution steps */}
                    {qaTrace && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-medium block">底层执行计算链条 (Trace Audit)</span>
                        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto space-y-1 shadow-sm border border-slate-900 leading-normal">
                          {qaTrace.split("\n").map((ln, idx) => (
                            <p key={idx}>{ln}</p>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: MCP CLIENT TEST */}
      {activeSubTab === "mcp" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Left panel: registered tools */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div>
              <span className="font-semibold text-slate-900 text-xs block">发现和内置的 MCP 外部工具流</span>
              <p className="text-[10px] text-slate-400 mt-1">列在 MCP 架构底座中，模型可根据参数描述选择主动自动回调调取。</p>
            </div>

            <div className="space-y-2">
              {mcpTools.map(item => (
                <div 
                  key={item.name} 
                  onClick={() => handleToolSelect(item)}
                  className={`border p-3.5 rounded-xl cursor-pointer transition flex flex-col justify-between hover:border-indigo-400 ${
                    selectedTool?.name === item.name ? "bg-indigo-50/50 border-indigo-500 shadow-xs" : "bg-slate-50/40 border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-850 text-xs select-none">
                      {item.name}
                    </span>
                    <span className="bg-emerald-50 text-[9px] text-emerald-700 font-mono px-1 border border-emerald-100 rounded">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal mt-2 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right tool details execution sandbox */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
            {selectedTool ? (
              <div className="space-y-5 animate-fade-in col-span-2">
                
                {/* Title info */}
                <div className="border-b pb-3 flex justify-between items-center text-xs">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-slate-500" />
                      运行智能体工具：{selectedTool.name}
                    </h3>
                  </div>
                </div>

                {/* Input scheme parameters editor */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 font-mono">
                  <span className="text-[10px] font-semibold text-slate-600 block">输入参数匹配 (Arguments Body)</span>
                  <div className="space-y-3 text-xs">
                    {Object.keys(selectedTool.inputSchema.properties).map(key => {
                      const prop = selectedTool.inputSchema.properties[key];
                      const isRequired = selectedTool.inputSchema.required?.includes(key);
                      return (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                          <span className="font-bold text-slate-700">
                            {key}{isRequired && <b className="text-rose-500 font-bold ml-0.5">*</b>}
                          </span>
                          <input 
                            type={prop.type === "number" ? "number" : "text"}
                            value={toolArgs[key] !== undefined ? toolArgs[key] : ""}
                            onChange={(e) => setToolArgs({
                              ...toolArgs,
                              [key]: prop.type === "number" ? Number(e.target.value) : e.target.value
                            })}
                            placeholder={prop.description || ""}
                            className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs md:col-span-3 focus:outline-none focus:border-slate-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invocation button */}
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={handleMcpInvoke}
                    disabled={mcpLoading}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-semibold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition inline-block disabled:opacity-50 select-none font-mono"
                  >
                    {mcpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {mcpLoading ? "正在调用协议执行..." : "模拟主机拉起工具：EXECUTE_TOOL"}
                  </button>
                </div>

                {/* Return trace results */}
                {mcpResults && (
                  <div className="space-y-4 border-t border-slate-100 pt-5 animate-fade-in">
                    
                    {/* Execution logs of tool */}
                    <div className="space-y-1.5 text-xs font-mono">
                      <span className="block font-semibold text-slate-600">MCP 通信流控制链路</span>
                      <div className="bg-slate-950 text-slate-350 p-4 rounded-xl text-[10px] space-y-1 leading-normal">
                        {mcpResults.trace.map((ln, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-slate-500">[{i + 1}]</span>
                            <span>{ln}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* JSON input schema sent */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                        <span className="font-semibold text-slate-700 block text-[10px] border-b pb-1">传入参数 Payload 发送单</span>
                        <pre className="text-[10px] text-slate-500 pt-1 leading-relaxed">{JSON.stringify({
                          jsonrpc: "2.0",
                          method: `tools/call/${selectedTool.name}`,
                          params: toolArgs,
                          id: mcpResults.id
                        }, null, 2)}</pre>
                      </div>

                      {/* JSON output response */}
                      <div className="bg-indigo-950/95 text-indigo-200 p-4 rounded-xl space-y-2 border border-indigo-950">
                        <span className="font-semibold text-indigo-400 block text-[10px] border-b border-indigo-900 pb-1">数据源工具最终回馈 Payload [Result]</span>
                        <pre className="text-[10px] text-indigo-300 pt-1 leading-relaxed overflow-x-auto">{JSON.stringify(mcpResults.output, null, 2)}</pre>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                请先在左侧选择对应需要的 MCP 外部关联服务套件
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: COLISEUM CHALLENGER BOX */}
      {activeSubTab === "coliseum" && (
        <div className="space-y-6 animate-fade-in text-xs font-sans">
          
          {/* Top prompt input block */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div>
              <span className="font-semibold text-slate-900 text-xs block">大模型中文语义测试（多模型并行对决）</span>
              <p className="text-[10px] text-slate-400 mt-1">在一组统一提示词下，向四个具有代表性的模型发出召回申请，对比它们在耗时、深度以及综合拟合打分上的差异。</p>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={coliseumInput}
                onChange={(e) => setColiseumInput(e.target.value)}
                placeholder="键入提示词，分析大语言模型输出的对齐程度..."
                className="w-full pl-3 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono font-medium"
              />
              <button 
                onClick={handleColiseumSubmit}
                disabled={coliseumLoading || !coliseumInput.trim()}
                className="bg-indigo-950 hover:bg-slate-900 text-white font-semibold px-5 py-2 rounded-xl text-center shadow-xs flex items-center gap-1.5 shrink-0 transition"
              >
                {coliseumLoading ? <Loader2 className="w-4 h-4 animate-spin animate-pulse" /> : <Columns className="w-4 h-4" />}
                {coliseumLoading ? "进行并发调度中..." : "启动多模型对比"}
              </button>
            </div>
          </div>

          {/* Response output parallel columns */}
          {coliseumLoading && (
            <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="font-mono text-slate-600">正在并发调度外部网关接口：[Claude, DeepSeek, Qwen]...</p>
              <p className="text-[11px] text-slate-400">由于多机协同，整体完成由于长文本生成可能需要约3-5秒，请耐心等待。</p>
            </div>
          )}

          {coliseumOutput && !coliseumLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              
              {/* DEEPSEEK */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="font-bold text-slate-900 font-mono">DeepSeek-V3 (仿)</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-bold">思考型</span>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  <div className="text-[11px] leading-relaxed text-slate-650 h-[280px] overflow-y-auto whitespace-pre-wrap border-b border-dashed pb-3">
                    {coliseumOutput.deepseek?.output}
                  </div>
                  <div className="space-y-1 text-[10px] font-mono leading-tight">
                    <span className="text-slate-400 uppercase tracking-wider block">Thought Path 思考痕迹:</span>
                    <p className="text-slate-500 line-clamp-3 bg-slate-50 p-2 rounded">{coliseumOutput.deepseek?.reasoning}</p>
                  </div>
                </div>
                <div className="bg-slate-50/80 p-3 px-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">响应: <b className="text-slate-700">{coliseumOutput.deepseek?.latencyMs}ms</b></span>
                  <span className="text-emerald-600 font-bold">分值: {coliseumOutput.deepseek?.score}</span>
                </div>
              </div>

              {/* QWEN */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="font-bold text-slate-900 font-mono">Qwen-2.5-72B (仿)</span>
                  <span className="text-[10px] font-mono bg-teal-100 text-teal-700 px-1.5 py-0.2 rounded border border-teal-200 font-bold">商业型</span>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  <div className="text-[11px] leading-relaxed text-slate-650 h-[280px] overflow-y-auto whitespace-pre-wrap border-b border-dashed pb-3">
                    {coliseumOutput.qwen?.output}
                  </div>
                  <div className="space-y-1 text-[10px] font-mono leading-tight">
                    <span className="text-slate-400 uppercase tracking-wider block">Thought Path 思考痕迹:</span>
                    <p className="text-slate-500 line-clamp-3 bg-slate-50 p-2 rounded">{coliseumOutput.qwen?.reasoning}</p>
                  </div>
                </div>
                <div className="bg-slate-50/80 p-3 px-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">响应: <b className="text-slate-700">{coliseumOutput.qwen?.latencyMs}ms</b></span>
                  <span className="text-emerald-600 font-bold">分值: {coliseumOutput.qwen?.score}</span>
                </div>
              </div>

              {/* CLAUDE */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="font-bold text-slate-900 font-mono">Claude 3.5 Sonnet (仿)</span>
                  <span className="text-[10px] font-mono bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 font-bold">高精推理</span>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  <div className="text-[11px] leading-relaxed text-slate-650 h-[280px] overflow-y-auto whitespace-pre-wrap border-b border-dashed pb-3">
                    {coliseumOutput.claude?.output}
                  </div>
                  <div className="space-y-1 text-[10px] font-mono leading-tight">
                    <span className="text-slate-400 uppercase tracking-wider block">Thought Path 思考痕迹:</span>
                    <p className="text-slate-500 line-clamp-3 bg-slate-50 p-2 rounded">{coliseumOutput.claude?.reasoning}</p>
                  </div>
                </div>
                <div className="bg-slate-50/80 p-3 px-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">响应: <b className="text-slate-700">{coliseumOutput.claude?.latencyMs}ms</b></span>
                  <span className="text-emerald-600 font-bold">分值: {coliseumOutput.claude?.score}</span>
                </div>
              </div>

              {/* GEMINI */}
              <div className="bg-indigo-50/30 border border-indigo-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-indigo-100 bg-indigo-50 flex justify-between items-center">
                  <span className="font-bold text-indigo-900 font-mono">Gemini 3.5 Flash (仿真)</span>
                  <span className="text-[10px] font-mono bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">多路合成</span>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  <div className="text-[11px] leading-relaxed text-slate-650 h-[280px] overflow-y-auto whitespace-pre-wrap border-b border-dashed pb-3 font-semibold">
                    {coliseumOutput.gemini?.output}
                  </div>
                  <div className="space-y-1 text-[10px] font-mono leading-tight">
                    <span className="text-indigo-400 uppercase tracking-wider block">Thought Path 思考痕迹:</span>
                    <p className="text-slate-500 line-clamp-3 bg-white p-2 rounded border border-indigo-100">{coliseumOutput.gemini?.reasoning}</p>
                  </div>
                </div>
                <div className="bg-indigo-50 p-3 px-4 border-t border-indigo-150 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-indigo-500">响应: <b className="text-indigo-700">{coliseumOutput.gemini?.latencyMs}ms</b></span>
                  <span className="text-indigo-700 font-bold">分值: {coliseumOutput.gemini?.score}</span>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* SUB-VIEW 4: TEXT EXTRACTOR & ENTITY FEEDER */}
      {activeSubTab === "nlp" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in text-xs font-sans">
          
          {/* Left panel text prompt */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div>
              <span className="font-semibold text-slate-900 text-xs block">中文文本知识提取、自动生成本体概念</span>
              <p className="text-[10px] text-slate-400 mt-1">输入含有实体关系的中文语篇段落，系统调用大模型自动将其分析、转换并拆分成 RDF 节点与关系网数据。</p>
            </div>

            <textarea 
              value={nlpText}
              onChange={(e) => setNlpText(e.target.value)}
              rows={6}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono inline-block leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button 
                onClick={handleNlpExtract}
                disabled={nlpLoading || !nlpText.trim()}
                className="bg-slate-950 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl text-center shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 select-none font-mono"
              >
                {nlpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {nlpLoading ? "语义深度学习分析中..." : "启动高精度提取"}
              </button>
            </div>
          </div>

          {/* Right panel structural JSON results */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <span className="font-semibold text-slate-900 text-xs block border-b pb-2">解析回馈的本体结构集 (Extracted Triples)</span>
            
            {!nlpResults && !nlpLoading ? (
              <div className="py-20 text-center text-slate-400 font-mono">
                请先在左侧录入自然语言语篇描述内容
              </div>
            ) : nlpLoading ? (
              <div className="py-20 text-center text-slate-400 font-mono space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
                <p>正在调度分词段关联分析、提取主谓宾三元组网络中...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                
                {/* Entities extracted view lists */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                    <span className="font-semibold text-slate-700 block text-[10px]">命名实体 (Entities)</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[10px]">
                      {nlpResults.entities?.map((e: any, i: number) => (
                        <div key={i} className="bg-white px-2.5 py-1 rounded border border-slate-150 flex items-center justify-between">
                          <span className="font-bold text-slate-800">{e.label}</span>
                          <span className="bg-indigo-50 text-[8px] text-indigo-600 px-1 rounded">{e.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                    <span className="font-semibold text-slate-700 block text-[10px]">提取的关系特征 (Relations)</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[10px]">
                      {nlpResults.relations?.map((r: any, i: number) => (
                        <div key={i} className="bg-white px-2.5 py-1 rounded border border-slate-150 text-[8px] leading-tight flex items-center justify-between">
                          <span className="text-slate-500">{r.source}</span>
                          <span className="text-indigo-600 font-bold border-b border-indigo-200 pb-0.5 mx-1">--[{r.label}]--&gt;</span>
                          <span className="text-slate-500 font-bold">{r.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inject into knowledge graph button */}
                <div className="border-t pt-4 flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                      <Network className="w-3.5 h-3.5" />
                      把上述抽取实体写入本体知识图谱中
                    </span>
                    <p className="text-[10px] text-indigo-700 leading-normal">
                      点击后这些解析节点会递归持久到系统内存中，您能立刻在“本体关联结构”菜单内可视化渲染。
                    </p>
                  </div>
                  <button 
                    disabled={nlpInjected}
                    onClick={handleInjectToGraph}
                    className="p-2.5 shrink-0 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1 transition disabled:bg-slate-300 disabled:cursor-not-allowed select-none"
                  >
                    {nlpInjected ? <CheckCircle2 className="w-4 h-4 text-emerald-100" /> : <ArrowRight className="w-4 h-4" />}
                    {nlpInjected ? "已一键注入图谱" : "一键注入本体 (Inject)"}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
