import React, { useState } from "react";
import { 
  Server, 
  Settings, 
  Terminal, 
  RefreshCw, 
  Share2, 
  Database, 
  ListFilter,
  CheckCircle2,
  AlertCircle,
  Activity,
  BarChart,
  Network
} from "lucide-react";
import { SystemLog, ClusterInfo } from "../types";

interface SystemViewProps {
  cluster: ClusterInfo | null;
  logs: SystemLog[];
  onTestConnection: (payload: { url: string; dbName: string; username: string; secretKey: string }) => Promise<{ success: boolean; message: string; details?: any }>;
}

export default function SystemView({ cluster, logs, onTestConnection }: SystemViewProps) {
  const [filterLevel, setFilterLevel] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");

  // Connection tester state
  const [testUrl, setTestUrl] = useState("https://central.moer-infra.gov.cn/api/v1/sync");
  const [dbName, setDbName] = useState("moer_datacenter_prod");
  const [username, setUsername] = useState("moer_validator_agent");
  const [secretKey, setSecretKey] = useState("••••••••••••••••••••••••");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleTestConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await onTestConnection({
        url: testUrl.trim(),
        dbName,
        username,
        secretKey
      });
      setTestResult(response);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "由于网络抖动，与外部上级数据同步失败。"
      });
    } finally {
      setTesting(false);
    }
  };

  const filteredLogs = logs.filter(log => filterLevel === "ALL" || log.level === filterLevel);

  return (
    <div className="space-y-6">
      {/* Header index */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">系统管理与上级同步配置 (System & Sync Control)</h2>
        <p className="text-xs text-slate-500 mt-1">
          审查分布式搜索引擎底座在JVM堆内存配置、物理存储、响应趋势上的微观参数，一键对齐上级平台。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs font-sans">
        
        {/* Left column: Cluster telemetry and health logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Detailed JVM and Node Metrics */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <span className="font-semibold text-slate-900 text-xs block border-b pb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-500" />
              分布式节点架构微观参数
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                <span className="font-semibold text-slate-400 block pb-1 border-b leading-tight">集群元数据 specs (JVM & Kernel)</span>
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">搜索引擎内核</span>
                    <span className="font-semibold text-slate-800">MoerKernel v2.5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">分配节点总数</span>
                    <span className="font-semibold text-emerald-600">5 个在线（弹性调度）</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">JVM 堆大小配额</span>
                    <span className="font-semibold text-slate-800">4,096 MB max/heap</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">存储合并压缩算法</span>
                    <span className="font-semibold text-indigo-600">LZ4 Dual-Rerank-Codec</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                <span className="font-semibold text-slate-400 block pb-1 border-b leading-tight">QPS & Latency Telemetry</span>
                <div className="space-y-1.5 font-mono text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">实时检索吞吐 (QPS)</span>
                    <span className="font-semibold text-slate-800">{cluster?.qps || 12.8} req/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">平均请求计算时间</span>
                    <span className="font-semibold text-slate-800">{cluster?.avgResponseMs || 14.5} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">本体推理分流用时</span>
                    <span className="font-semibold text-indigo-700">3.8 ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">错误率 (Error Rate)</span>
                    <span className="font-semibold text-emerald-600">0.02%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operation & Error Log viewer */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-slate-900 text-xs block flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                系统实时运行控制台日志 (Runtime Logs)
              </span>

              {/* Log Level select */}
              <div className="flex gap-1 border border-slate-200 bg-slate-50 p-0.5 rounded-lg text-[10px]">
                {(["ALL", "INFO", "WARN", "ERROR"] as const).map(lev => (
                  <button 
                    key={lev} 
                    onClick={() => setFilterLevel(lev)}
                    className={`px-1.5 py-0.5 rounded font-mono font-semibold ${filterLevel === lev ? "bg-slate-900 text-white" : "text-slate-500"}`}
                  >
                    {lev}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs render */}
            <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[10px] leading-relaxed overflow-y-auto max-h-[310px] space-y-2 shadow-inner border border-slate-900">
              {filteredLogs.map((log, idx) => {
                let colorClass = "text-slate-400";
                if (log.level === "WARN") colorClass = "text-amber-400";
                if (log.level === "ERROR") colorClass = "text-rose-500 font-bold";

                return (
                  <div key={idx} className="flex gap-2 items-start border-b border-indigo-950/20 pb-1.5 hover:bg-slate-900/50 transition">
                    <span className="text-slate-600 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold shrink-0 ${colorClass}`}>[{log.level}]</span>
                    <span className="text-indigo-400 shrink-0 font-semibold">[{log.module}]</span>
                    <span className="text-slate-350">{log.message}</span>
                  </div>
                );
              })}
              {filteredLogs.length === 0 && (
                <div className="text-center text-slate-600 py-6">无满足过滤等级的系统日志记录</div>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Data Sync & Connection validation */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <span className="font-semibold text-slate-900 text-xs block border-b pb-2 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-slate-500" />
              上级集中监控对接验证
            </span>
            <p className="text-[10px] text-slate-400 mt-1">验证 Moer 与上级集团主干数据库或集中遥测网关的通信连通状态。</p>
          </div>

          <form onSubmit={handleTestConnectionSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="block font-medium text-slate-650">上级对接端点 URL (Gateway Endpoint)</span>
              <input 
                type="text" 
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="例如: https://central-monitor.corp/api/v1"
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-850 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <span className="block font-medium text-slate-650">对接业务库名称 (Target Database)</span>
              <input 
                type="text" 
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-850 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <span className="block font-medium text-slate-650">对接签名用户名 (Auth Username)</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-850 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <span className="block font-medium text-slate-650">对外业务秘钥密钥 (Secret Key)</span>
              <input 
                type="password" 
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-850 font-mono"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={testing || !testUrl}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-center shadow-xs flex items-center justify-center gap-1 transition"
            >
              {testing ? (
                <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {testing ? "正在执行多阶段安全握手..." : "启动连通性测试 (Deploy Link)"}
            </button>
          </form>

          {/* Sync Result dialog block */}
          {testResult && (
            <div className={`p-4 rounded-xl border space-y-1.5 animate-fade-in ${
              testResult.success ? "bg-emerald-50 text-emerald-950 border-emerald-150" : "bg-rose-50 text-rose-950 border-rose-150"
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
                )}
                <span>{testResult.success ? "对接链路验证成功" : "握手发生异常"}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">{testResult.message}</p>
              
              {testResult.success && testResult.details && (
                <div className="pt-2 text-[10px] font-mono border-t border-emerald-200/50 space-y-0.5 text-emerald-800">
                  <div className="flex justify-between"><span>往返网络延迟:</span><span>{testResult.details.latencyMs}ms</span></div>
                  <div className="flex justify-between"><span>建立安全信道:</span><span>{testResult.details.establishedTunnel}</span></div>
                  <div className="flex justify-between"><span>同步协商协议:</span><span>{testResult.details.negotiatedProtocol}</span></div>
                  <div className="flex justify-between"><span>节点同步状态:</span><span>ONLINE</span></div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
