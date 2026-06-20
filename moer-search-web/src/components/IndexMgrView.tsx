import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Layers, 
  RefreshCw,
  Settings,
  ListFilter,
  Tag,
  Edit2,
  Database,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { IndexItem, IndexField } from "../types";

interface IndexMgrViewProps {
  indexes: IndexItem[];
  onCreateIndex: (newIndex: { name: string; type: "vector" | "fulltext" | "hybrid"; shards: number; replicas: number; fields: IndexField[] }) => Promise<void>;
  onAddAlias: (id: string, alias: string) => Promise<void>;
  onRemoveAlias: (id: string, alias: string) => Promise<void>;
  onIndexAction: (id: string, action: "close" | "open" | "clear" | "delete") => Promise<void>;
  refreshIndexes: () => void;
}

export default function IndexMgrView({ 
  indexes, 
  onCreateIndex, 
  onAddAlias, 
  onRemoveAlias, 
  onIndexAction,
  refreshIndexes
}: IndexMgrViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<IndexItem | null>(null);
  
  // Create index state variables
  const [idxName, setIdxName] = useState("");
  const [idxType, setIdxType] = useState<"vector" | "fulltext" | "hybrid">("hybrid");
  const [shards, setShards] = useState(3);
  const [replicas, setReplicas] = useState(1);
  const [fields, setFields] = useState<IndexField[]>([
    { name: "id", type: "keyword", searchable: true, description: "主键 ID" },
    { name: "title", type: "text", searchable: true, description: "主要标题" },
    { name: "content", type: "text", searchable: true, description: "核心段落或正文" }
  ]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldSearchable, setNewFieldSearchable] = useState(true);
  const [newFieldDesc, setNewFieldDesc] = useState("");

  // Edit Index schema states (改 - Update Mappings/Settings)
  const [editingIndex, setEditingIndex] = useState<IndexItem | null>(null);
  const [editIdxName, setEditIdxName] = useState("");
  const [editIdxType, setEditIdxType] = useState<"vector" | "fulltext" | "hybrid">("hybrid");
  const [editIdxShards, setEditIdxShards] = useState(3);
  const [editIdxReplicas, setEditIdxReplicas] = useState(1);
  const [editIdxFields, setEditIdxFields] = useState<IndexField[]>([]);
  const [editNewFieldName, setEditNewFieldName] = useState("");
  const [editNewFieldType, setEditNewFieldType] = useState("text");
  const [editNewFieldDesc, setEditNewFieldDesc] = useState("");

  // Alias management states
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});
  const [errorText, setErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Formatting utility
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Create mappings operations
  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const cleanName = newFieldName.trim().replace(/[^a-z0-9_-]/gi, "");
    if (fields.some(f => f.name === cleanName)) {
      alert("该字段名已存在于映射结构中。");
      return;
    }
    setFields([
      ...fields,
      {
        name: cleanName,
        type: newFieldType,
        searchable: newFieldSearchable,
        description: newFieldDesc.trim() || `${cleanName} 描述`
      }
    ]);
    setNewFieldName("");
    setNewFieldDesc("");
  };

  const handleRemoveField = (index: number) => {
    if (fields[index].name === "id") return; // Keep ID as required
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idxName.trim()) {
      setErrorText("索引名不能为空");
      return;
    }
    setErrorText("");
    setSubmitting(true);
    try {
      await onCreateIndex({
        name: idxName,
        type: idxType,
        shards,
        replicas,
        fields
      });
      setIsCreateOpen(false);
      // Reset defaults
      setIdxName("");
      setIdxType("hybrid");
      setShards(3);
      setReplicas(1);
      setFields([
        { name: "id", type: "keyword", searchable: true, description: "主键 ID" },
        { name: "title", type: "text", searchable: true, description: "主要标题" },
        { name: "content", type: "text", searchable: true, description: "核心段落或正文" }
      ]);
    } catch (err: any) {
      setErrorText(err.message || "创建索引出错");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit/Modify Index configuration (改)
  const openEditModal = (idx: IndexItem) => {
    setEditingIndex(idx);
    setEditIdxName(idx.name);
    setEditIdxType(idx.type);
    setEditIdxShards(idx.shards);
    setEditIdxReplicas(idx.replicas);
    setEditIdxFields([...idx.fields]);
    setEditNewFieldName("");
    setEditNewFieldDesc("");
  };

  const handleEditAddField = () => {
    if (!editNewFieldName.trim()) return;
    const cleanName = editNewFieldName.trim().replace(/[^a-z0-9_-]/gi, "");
    if (editIdxFields.some(f => f.name === cleanName)) {
      alert("配置字段名已冲突存在！");
      return;
    }
    setEditIdxFields([
      ...editIdxFields,
      {
        name: cleanName,
        type: editNewFieldType,
        searchable: true,
        description: editNewFieldDesc.trim() || `${cleanName} 属性描述`
      }
    ]);
    setEditNewFieldName("");
    setEditNewFieldDesc("");
  };

  const handleEditRemoveField = (index: number) => {
    if (editIdxFields[index].name === "id") return;
    setEditIdxFields(editIdxFields.filter((_, i) => i !== index));
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIndex) return;

    setSubmitting(true);
    setErrorText("");
    try {
      const res = await fetch(`/api/indexes/${editingIndex.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editIdxName,
          type: editIdxType,
          shards: editIdxShards,
          replicas: editIdxReplicas,
          fields: editIdxFields
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "配置修改发布失败");
      }

      setEditingIndex(null);
      refreshIndexes();
    } catch (err: any) {
      setErrorText(err.message || "修改配置失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAliasAdd = async (indexId: string) => {
    const aliasVal = aliasInputs[indexId];
    if (!aliasVal || !aliasVal.trim()) return;
    try {
      await onAddAlias(indexId, aliasVal.trim());
      setAliasInputs({ ...aliasInputs, [indexId]: "" });
    } catch (err: any) {
      alert(err.message || "添加别名出错");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-slate-805" />
            分布式索引结构管理中心 Index Core Schema Manager
          </h2>
          <p className="text-xs text-slate-500">
            动态治理分布式多级字段映射架构，维护 mappings 映射约束、分片存储比重与多维别名索引对齐。
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <span className="text-xs text-slate-500 font-medium font-sans">
            索引注册数据库节点: <b>{indexes.length} 个环境节点受控</b>，支持秒级建立对齐与逻辑重组。
          </span>
          <div className="flex gap-2">
            <button 
              onClick={refreshIndexes}
              className="p-2 border border-slate-200 hover:bg-slate-100/60 text-slate-500 rounded-xl bg-white transition"
              title="同步本地索引"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-bold bg-slate-950 text-white px-4 py-2 hover:bg-slate-900 rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              新增物理索引 (Create Index)
            </button>
          </div>
        </div>

        {/* Indices table list display */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono">
                  <th className="py-3 px-4 font-semibold">索引识别码 Name</th>
                  <th className="py-3 px-4 font-semibold">存储引擎方型 Type</th>
                  <th className="py-3 px-4 font-semibold">倒排文档 Docs</th>
                  <th className="py-3 px-4 font-semibold">物理内存 Storage</th>
                  <th className="py-3 px-4 font-semibold">分片/副本 Shards</th>
                  <th className="py-3 px-4 font-semibold">别名映射 Aliases</th>
                  <th className="py-3 px-4 font-semibold">服务态 Status</th>
                  <th className="py-3 px-4 text-center font-semibold">复合管理 Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-700 leading-normal">
                {indexes.map((idx) => {
                  const isClosed = idx.status === "closed";
                  return (
                    <tr key={idx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold font-mono">
                        <span className="text-[12px]">{idx.name}</span>
                        <span className="text-[9.5px] text-slate-400 block font-normal mt-0.5">{idx.id}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          idx.type === "hybrid" 
                            ? "bg-indigo-50 border-indigo-150 text-indigo-700" 
                            : idx.type === "vector"
                            ? "bg-purple-50 border-purple-150 text-purple-700"
                            : "bg-amber-55 border-amber-150 text-amber-800"
                        }`}>
                          {idx.type === "hybrid" && "混合型 (Hybrid & Graph)"}
                          {idx.type === "vector" && "密集向量型 (Vector)"}
                          {idx.type === "fulltext" && "标准倒排 BM25 TEXT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{idx.docsCount} lines</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{formatBytes(idx.storageBytes)}</td>
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap text-slate-550">
                        {idx.shards}p / {idx.replicas}r
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                          {idx.aliases && idx.aliases.map(al => (
                            <span key={al} className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-mono text-[10px] flex items-center gap-1 border border-slate-150 group">
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              {al}
                              <button 
                                onClick={() => onRemoveAlias(idx.id, al)}
                                className="text-slate-400 hover:text-rose-500 font-bold ml-0.5 text-[9px]"
                                title="解绑别名"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {(!idx.aliases || idx.aliases.length === 0) && (
                            <span className="text-[10px] text-slate-400 italic">暂无别名映射</span>
                          )}

                          {/* Quick Add Alias form element */}
                          <div className="flex items-center gap-1 mt-1.5 w-full">
                            <input 
                              type="text" 
                              placeholder="新别名..."
                              value={aliasInputs[idx.id] || ""}
                              onChange={(e) => setAliasInputs({ ...aliasInputs, [idx.id]: e.target.value })}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 focus:outline-none w-20 font-mono"
                            />
                            <button 
                              onClick={() => handleAliasAdd(idx.id)}
                              className="bg-slate-900 text-white rounded px-1.5 py-0.5 text-[9px] hover:bg-slate-800 font-bold font-sans"
                            >
                              绑定
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isClosed ? "text-slate-400" : "text-emerald-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? "bg-slate-300" : "bg-emerald-500"}`} />
                          {isClosed ? "CLOSED 已离线" : "GREEN 健康"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          
                          <button
                            onClick={() => setSelectedIdx(selectedIdx?.id === idx.id ? null : idx)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 shadow-3xs hover:text-slate-800 transition bg-white"
                            title="探视 Mapping 元字段模型 (Detail)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit mappings mapping button (改) */}
                          <button
                            onClick={() => openEditModal(idx)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-550 shadow-3xs hover:text-slate-850 transition bg-white"
                            title="修改 Mapping 元字段模型 (Update Mappings)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onIndexAction(idx.id, isClosed ? "open" : "close")}
                            className={`p-1.5 border rounded-lg transition shadow-3xs bg-white ${
                              isClosed 
                                ? "text-emerald-500 border-emerald-100 hover:bg-emerald-50" 
                                : "text-amber-500 border-amber-100 hover:bg-amber-50"
                            }`}
                            title={isClosed ? "重新上线服务" : "将索引只读挂起 (Close index)"}
                          >
                            {isClosed ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`确定要清空索引 "${idx.name}" 的全部底层物理记录吗？此操作不可撤销！`)) {
                                onIndexAction(idx.id, "clear");
                              }
                            }}
                            className="text-[10px] text-amber-700 hover:text-white border border-amber-200 hover:bg-amber-600 px-2 py-1 rounded-lg transition"
                            title="清空物理存储 (Clear documents)"
                          >
                            清零行
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`确定要彻底注销删除整个物理索引 "${idx.name}" 吗？全部数据及别名将一并离线毁件！`)) {
                                onIndexAction(idx.id, "delete");
                              }
                            }}
                            className="p-1.5 border border-rose-100 hover:bg-rose-50 text-rose-500 rounded-lg transition shadow-3xs bg-white"
                            title="彻底销毁此索引 (Delete)"
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
        </div>

        {/* Dynamic Mapping fields inspector details drawer block */}
        {selectedIdx && (
          <div className="bg-slate-50 border border-indigo-150 rounded-2xl p-5 shadow-sm animate-fade-in text-xs font-sans space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Layers className="w-4.5 h-4.5 text-indigo-650" />
                  索引 Mappings 元映射及 Settings 物理设置窥探 ({selectedIdx.name})
                </h4>
                <p className="text-slate-450 text-[11px] font-normal">探测出当前具有实体约束的 {selectedIdx.fields.length} 个字段定义关系体:</p>
              </div>
              <button 
                onClick={() => setSelectedIdx(null)}
                className="text-slate-400 hover:text-slate-600 font-bold font-mono text-base"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 leading-normal">
              
              {/* Fields registry summary cards */}
              <div className="space-y-2">
                <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-2.5">
                  <span className="font-bold text-slate-750 block text-[11.5px] font-mono border-b border-slate-100 pb-1">Mappings Field Specifications</span>
                  
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {selectedIdx.fields.map(field => (
                      <div key={field.name} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg text-[11px] font-mono border border-slate-100 hover:border-slate-200">
                        <div className="flex gap-2">
                          <span className="font-bold text-slate-800">{field.name}</span>
                          <span className="text-slate-400">({field.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9.5px] px-1 rounded ${field.searchable ? "bg-emerald-50 text-emerald-650" : "bg-slate-100 text-slate-405"}`}>
                            {field.searchable ? "INDEXED" : "STORED_ONLY"}
                          </span>
                          <span className="text-slate-400 text-[10px] italic max-w-[130px] truncate" title={field.description}>{field.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Standard Mock JSON response from real-time ES engine */}
              <div className="space-y-2">
                <div className="bg-slate-950 text-slate-350 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono">
                  <span className="text-purple-400 block border-b border-slate-800 pb-1.5 mb-2 font-bold font-mono">Elasticsearch Setting Mock Response</span>
                  <pre>{JSON.stringify({
                    settings: {
                      index: {
                        number_of_shards: selectedIdx.shards,
                        number_of_replicas: selectedIdx.replicas,
                        created_at: selectedIdx.creationTime,
                        type: selectedIdx.type,
                        codec: "best_compression",
                        analysis: {
                          analyzer: {
                            moer_nlp: {
                              tokenizer: "pinyin_semantic_hybrid",
                              filters: ["lowercase", "stemmer", "graph_ontology"]
                            }
                          }
                        }
                      }
                    }
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
                               INDEX CREATION MODAL DIALOG
         ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-6 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">1. 创建新分布式索引结构 (Deploy New index)</h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-mono font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">1. 索引唯一名称标识 (Index Key ID)</label>
                  <input 
                    type="text" 
                    placeholder="如: sys_finance_logs" 
                    value={idxName}
                    onChange={(e) => setIdxName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-955 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">唯支持纯小写字母、数字及下划线组合。</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">2. 检索底座物理类型 (Engine Type)</label>
                  <select 
                    value={idxType}
                    onChange={(e: any) => setIdxType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="hybrid">混合检索及图强化型 (Hybrid & Graph)</option>
                    <option value="vector">向量高级检索稠密存储型 (Dense Vector only)</option>
                    <option value="fulltext">经典倒排分词词频型 (Text BM25 Standard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">主分片物理数目 (Primary Shards)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10}
                    value={shards}
                    onChange={(e) => setShards(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">副本保障备份数 (Replicas)</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={5}
                    value={replicas}
                    onChange={(e) => setReplicas(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-205 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Mappings Field Builder */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3.5">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11.5px]">
                  <ListFilter className="w-4 h-4 text-slate-505" />
                  配置字段与 Mappings 映射关系 (Fields Definitions)
                </span>
                
                {/* Visual Field blocks loop */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {fields.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-150 text-[11px] font-mono shadow-3xs">
                      <div className="flex gap-2">
                        <span className="text-slate-900 font-bold">{f.name}</span>
                        <span className="bg-slate-100 text-slate-600 px-1 rounded text-[9px]">{f.type}</span>
                        <span className="text-slate-405 truncate max-w-xs">{f.description}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveField(i)}
                        disabled={f.name === "id"}
                        className="text-slate-400 hover:text-rose-500 font-bold text-sm disabled:opacity-40"
                        title="删除此字段"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new field form block */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200/80 items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold font-sans">1. 字段标识 KEY</span>
                    <input 
                      type="text" 
                      placeholder="如: publish_date"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="w-full text-[11px] font-mono px-2 py-1.5 rounded border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <span className="text-[10px] text-slate-500 font-semibold font-sans">2. 数据格式 TYPE</span>
                    <select 
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="w-full text-[11px] px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none font-mono"
                    >
                      <option value="text">text (富文本多重分词)</option>
                      <option value="keyword">keyword (精确非分词词)</option>
                      <option value="dense_vector[1536]">dense_vector[1536]</option>
                      <option value="dense_vector[768]">dense_vector[768]</option>
                      <option value="long">long (物理整型数)</option>
                      <option value="double">double (物理浮点数)</option>
                      <option value="date">date (标准时间戳)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold font-sans">3. 附带业务注释</span>
                    <input 
                      type="text" 
                      placeholder="字段的解释说明..."
                      value={newFieldDesc}
                      onChange={(e) => setNewFieldDesc(e.target.value)}
                      className="w-full text-[11px] px-2 py-1.5 rounded border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddField}
                    className="py-1.5 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg transition text-[11px] font-sans"
                  >
                    增加此字段映射
                  </button>
                </div>
              </div>

              {errorText && (
                <div className="text-rose-500 text-xs font-mono leading-normal">{errorText}</div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 flex-wrap text-xs font-bold font-sans">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                >
                  放弃返回
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-900 rounded-xl text-center shadow-sm disabled:opacity-45 transition"
                >
                  {submitting ? "核准备份物理结构中..." : "核准发布并建立索引"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
                               INDEX MAPPING EDIT DIALOG (改)
         ========================================================================= */}
      {editingIndex && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-6 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-650" />
                修改并推演 Mapping 逻辑结构 (Edit mapping: {editingIndex.name})
              </h3>
              <button 
                onClick={() => setEditingIndex(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-mono font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">1. 索引名称 (不可更改以物理对齐)</label>
                  <input 
                    type="text" 
                    value={editIdxName}
                    disabled
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-102 bg-slate-100 text-slate-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">2. 检索底座物理类型</label>
                  <select 
                    value={editIdxType}
                    onChange={(e: any) => setEditIdxType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="hybrid">混合检索及图强化型 (Hybrid & Graph)</option>
                    <option value="vector">向量高级检索稠密存储型 (Dense Vector only)</option>
                    <option value="fulltext">经典倒排分词词频型 (Text BM25 Standard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">主分片数 (Primary Shards)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10}
                    value={editIdxShards}
                    onChange={(e) => setEditIdxShards(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">副本保障数 (Replicas)</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={5}
                    value={editIdxReplicas}
                    onChange={(e) => setEditIdxReplicas(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-205 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Edit Mappings Field Builder */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3.5">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11.5px]">
                  <ListFilter className="w-4 h-4 text-slate-505" />
                  配置字段与 Mappings 映射关系 (Fields Definitions)
                </span>
                
                {/* Visual Field blocks loop */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {editIdxFields.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-150 text-[11px] font-mono shadow-3xs">
                      <div className="flex gap-2">
                        <span className="text-slate-900 font-bold">{f.name}</span>
                        <span className="bg-slate-100 text-slate-600 px-1 rounded text-[9px]">{f.type}</span>
                        <span className="text-slate-405 truncate max-w-xs">{f.description}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleEditRemoveField(i)}
                        disabled={f.name === "id"}
                        className="text-slate-400 hover:text-rose-500 font-bold text-sm disabled:opacity-40"
                        title="删除此字段"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new field form block */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200/80 items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold font-sans">字段标识 KEY</span>
                    <input 
                      type="text" 
                      placeholder="如: user_id"
                      value={editNewFieldName}
                      onChange={(e) => setEditNewFieldName(e.target.value)}
                      className="w-full text-[11px] font-mono px-2 py-1 rounded border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold font-sans">数据类型 TYPE</span>
                    <select 
                      value={editNewFieldType}
                      onChange={(e) => setEditNewFieldType(e.target.value)}
                      className="w-full text-[11px] px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none"
                    >
                      <option value="text">text (分词全文)</option>
                      <option value="keyword">keyword (精确值)</option>
                      <option value="dense_vector[1536]">dense_vector[1536]</option>
                      <option value="dense_vector[768]">dense_vector[768]</option>
                      <option value="long">long (整型)</option>
                      <option value="double">double (浮点)</option>
                      <option value="date">date (时间戳)</option>
                    </select>
                  </div>
                  <div className="space-y-1 font-sans">
                    <span className="text-[10px] text-slate-500 font-semibold">业务注解</span>
                    <input 
                      type="text" 
                      placeholder="字段描述..."
                      value={editNewFieldDesc}
                      onChange={(e) => setEditNewFieldDesc(e.target.value)}
                      className="w-full text-[11px] px-2 py-1 rounded border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleEditAddField}
                    className="p-1 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-bold transition text-[11px]"
                  >
                    增加此字段
                  </button>
                </div>
              </div>

              {errorText && (
                <div className="text-rose-500 text-xs font-mono">{errorText}</div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5">
                <button 
                  type="button" 
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 border border-slate-202 hover:bg-slate-50 rounded-xl transition font-bold"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-900 font-bold rounded-xl text-center shadow-xs disabled:opacity-55 transition"
                >
                  {submitting ? "核准修改配置中..." : "保存修改并发布配置 (Save changes)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
