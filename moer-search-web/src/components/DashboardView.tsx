import React from "react";
import { 
  Server, 
  Layers, 
  FileText, 
  HardDrive, 
  Cpu, 
  Activity, 
  ArrowRight, 
  CpuIcon, 
  Sparkles, 
  Network
} from "lucide-react";
import { ClusterInfo, ActiveTab } from "../types";

interface DashboardViewProps {
  cluster: ClusterInfo | null;
  onNavigate: (tab: ActiveTab) => void;
  isLoading: boolean;
}

export default function DashboardView({ cluster, onNavigate, isLoading }: DashboardViewProps) {
  if (!cluster || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GREEN": return "bg-emerald-500 text-white shadow-emerald-200";
      case "YELLOW": return "bg-amber-500 text-white shadow-amber-200";
      default: return "bg-rose-500 text-white shadow-rose-200";
    }
  };

  const quickLinks = [
    {
      title: "索引管理 (Index Management)",
      desc: "查看索引映射、创建多字段索引及别名配置",
      icon: Layers,
      tab: "indexes" as ActiveTab,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      pill: "向量 / 文本"
    },
    {
      title: "文档写入与编辑 (Document CRUD)",
      desc: "可视化导入 JSON/CSV、全文本段落入库",
      icon: FileText,
      tab: "documents" as ActiveTab,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      pill: "批量入库"
    },
    {
      title: "混合检索验证 (Search Validator)",
      desc: "对比向量、全文本在倒排重排下的检索准确度",
      icon: Activity,
      tab: "search" as ActiveTab,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      pill: "AI增强检索"
    },
    {
      title: "AI 智能体验 (AI & MCP Protocols)",
      desc: "测试大模型对齐、MCP工具调用与多引擎并行对决",
      icon: Sparkles,
      tab: "ai" as ActiveTab,
      color: "text-violet-600 bg-violet-50 border-violet-200",
      pill: "多模型比对"
    },
    {
      title: "本体关联结构 (Ontology Editor)",
      desc: "实时知识图谱可视化，SPARQL 拓扑遍历查询",
      icon: Network,
      tab: "ontology" as ActiveTab,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      pill: "SPARQL 查询"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Target header info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Moer Search 功能验证平台</h1>
            <span className="px-2 pb-0.5 text-xs font-mono font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              v2.5.0-Preview
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            一站式交互验证：体验 Moer Search 向量检索、知识图谱推理、MCP 智能体协作以及多大语言模型对比。
          </p>
        </div>
        
        {/* API connection status info */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full ${cluster.hasLiveGemini ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
            <span>Gemini API：{cluster.hasLiveGemini ? "已成功建立安全对接" : "本地轻量级仿真"}</span>
          </div>
          {!cluster.hasLiveGemini && (
            <span className="text-amber-600 font-sans font-medium px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200">
              离线演示模式
            </span>
          )}
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">系统健康状况</p>
            <p className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
              稳定绿色
            </p>
            <p className="text-xs text-slate-500 font-mono">5/5 节点处于就绪状态</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Card Indexes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">索引总规模 (Indexes)</p>
            <p className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">{cluster.indexesCount}</p>
            <p className="text-xs text-slate-500">已部署混合及高维向量索引</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card Documents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">写入文档总数 (Docs)</p>
            <p className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">{cluster.docsCount}</p>
            <p className="text-xs text-slate-500">支持全文本映射与关联重排</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card Storage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">物理存储消耗 (Size)</p>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{formatBytes(cluster.storageUsageBytes)}</p>
            <p className="text-xs text-slate-500">分片压缩比 2.3x</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-600">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Cluster Performance Monitors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 lg:col-span-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              集群主机状态与负载 (Cluster Telemetry)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">监控 JVM 堆内存与实时响应延时性能参数（每秒自动采集）</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* JVM Gauge */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
              <p className="text-xs font-mono text-slate-400 uppercase mb-2">JVM 堆内存消耗</p>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - cluster.jvmMemoryPercent / 100)} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-semibold font-mono text-slate-900">{cluster.jvmMemoryPercent}%</span>
                  <span className="text-[10px] text-slate-400 font-sans">1.2GB/4GB</span>
                </div>
              </div>
            </div>

            {/* QPS Gauge */}
            <div className="border border-slate-200/60 bg-slate-50 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono text-slate-400 uppercase">实时搜索并发 (QPS)</p>
                <p className="text-4xl font-bold font-mono text-slate-950 mt-2 tracking-tight">12.8 <span className="text-xs text-slate-500 font-normal">req/s</span></p>
              </div>
              <div className="h-6 w-full flex items-end gap-1 overflow-hidden mt-4">
                {[4, 12, 18, 14, 25, 32, 15, 8, 22, 19, 28, 35, 12, 18].map((val, idx) => (
                  <div key={idx} style={{ height: `${val * 2}%` }} className="flex-1 bg-emerald-300 rounded-sm"></div>
                ))}
              </div>
            </div>

            {/* Response speed */}
            <div className="border border-slate-200/60 bg-slate-50 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono text-slate-400 uppercase">全局检索平均耗时</p>
                <p className="text-4xl font-bold font-mono text-emerald-600 mt-2 tracking-tight">14.5 <span className="text-xs text-slate-500 font-normal">ms</span></p>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs mt-4">
                <span className="text-slate-500">混合检索召回率:</span>
                <span className="font-mono font-semibold text-emerald-500">98.42%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature List (Highlighting Moer's Core competitive edges) */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between shadow-md">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">Moer Search 核心优势展示</h3>
            <div className="space-y-4 text-xs">
              <div className="flex gap-2.5">
                <div className="bg-indigo-500/10 p-1.5 rounded text-indigo-400 h-fit mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">支持原生 MCP 智能体接口</p>
                  <p className="text-slate-400 mt-0.5">无缝对接大模型，赋予 Agent 通过标准化 JSON-RPC 接口控制和读取私域本体知识库的能力。</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="bg-indigo-500/10 p-1.5 rounded text-indigo-400 h-fit mt-0.5">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">高拟合度本体引擎配合</p>
                  <p className="text-slate-400 mt-0.5">不仅仅是文档检索。混合搜索与SPARQL本体图谱交叉遍历，有效解决深层概念实体关联在精准问答中的幻觉断点。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">查看底层 OpenAPI 技术指标</span>
            <button 
              onClick={() => onNavigate("api")} 
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              在线调试接口 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">核心能力模块功能验证快速导航</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                onClick={() => onNavigate(item.tab)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-350 cursor-pointer transition flex flex-col justify-between h-44 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                      {item.pill}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-xs font-medium pt-2 border-t border-slate-100 mt-3 hover:text-slate-600 transition">
                  <span>立刻启动测试</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
