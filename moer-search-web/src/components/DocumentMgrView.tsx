import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Trash2, 
  Edit2, 
  UploadCloud, 
  Plus, 
  FileJson, 
  Layers, 
  ArrowRight,
  Database,
  RefreshCw,
  Search,
  List,
  Grid,
  SlidersHorizontal,
  Terminal,
  Code,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  HelpCircle,
  ListFilter
} from "lucide-react";
import { DocumentItem, IndexItem, IndexField } from "../types";

interface DocumentMgrViewProps {
  indexes: IndexItem[];
  documents: DocumentItem[];
  onSaveDocument: (doc: Partial<DocumentItem>) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onBatchImport: (indexId: string, docs: { title: string; content: string; tags: string[] }[]) => Promise<void>;
  refreshDocuments: () => void;
}

export default function DocumentMgrView({
  indexes,
  documents,
  onSaveDocument,
  onDeleteDocument,
  onBatchImport,
  refreshDocuments
}: DocumentMgrViewProps) {
  // Navigation states
  const [subTab, setSubTab] = useState<"docs" | "sql" | "dsl">("docs");

  // Document Library search & filtering states
  const [selectedIndexId, setSelectedIndexId] = useState<string>("all");
  const [editingDoc, setEditingDoc] = useState<Partial<DocumentItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Views layouts & Configurable fields configuration
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [displayFields, setDisplayFields] = useState<string[]>(["id", "title", "content", "tags"]);
  const [fieldSearch, setFieldSearch] = useState("");
  const [fieldFilterTab, setFieldFilterTab] = useState<"all" | "selected" | "unselected">("all");

  // Individual Form States
  const [formIndexId, setFormIndexId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTagsStr, setFormTagsStr] = useState("");
  const [formError, setFormError] = useState("");

  // Batch import states
  const [batchTargetIndexId, setBatchTargetIndexId] = useState("");
  const [batchRawJson, setBatchRawJson] = useState(`[
  {
    "title": "量子高精准微传感器专利白皮书",
    "content": "本设计发布了一种运行在常温超算中心之下的非均匀磁通多维传感器，旨在解决特高压电网下的瞬时杂散电流高灵敏度捕捉。",
    "tags": ["量子传感器", "特高压", "专利", "白皮书"]
  },
  {
    "title": "本体知识库关系映射核心草案",
    "content": "本体推理机能够根据RDF三元组（Subject-Predicate-Object）结构进行图数据库语义扩散运算，其多线程召回模型显著优于普通图数据库。",
    "tags": ["本体推理", "图数据库", "RDF三元组"]
  }
]`);
  const [batchError, setBatchError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SQL & DSL Query Sandbox states (Moved from IndexMgrView)
  const [queryTargetIndex, setQueryTargetIndex] = useState<string>("all");
  const [sqlQueryText, setSqlQueryText] = useState("SELECT * FROM all LIMIT 5;");
  const [dslQueryText, setDslQueryText] = useState(JSON.stringify({
    query: {
      match: {
        content: "智能体"
      }
    },
    size: 5
  }, null, 2));

  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResponse, setQueryResponse] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Filter documents based on selection and search tags
  const filteredDocs = documents.filter(doc => {
    const matchesIndex = selectedIndexId === "all" || doc.indexId === selectedIndexId;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanSearch || 
      doc.title.toLowerCase().includes(cleanSearch) || 
      doc.content.toLowerCase().includes(cleanSearch) ||
      doc.tags.some(t => t.toLowerCase().includes(cleanSearch));
    return matchesIndex && matchesSearch;
  });

  const getIndexName = (indexId: string) => {
    const found = indexes.find(i => i.id === indexId);
    return found ? found.name : indexId;
  };

  // Determine available fields based on selected index
  const getAvailableFields = (): IndexField[] => {
    if (selectedIndexId === "all") {
      return [
        { name: "id", type: "keyword", searchable: true, description: "主键 ID" },
        { name: "title", type: "text", searchable: true, description: "主要标题 / 概念名" },
        { name: "content", type: "text", searchable: true, description: "核心段落或正文描述" },
        { name: "tags", type: "keyword", searchable: true, description: "辅助检索标签" },
        { name: "vectorSize", type: "integer", searchable: false, description: "向量维度 size" },
        { name: "lastUpdated", type: "date", searchable: false, description: "最近更新时间" }
      ];
    }
    const selectedIndex = indexes.find(i => i.id === selectedIndexId);
    return selectedIndex?.fields || [];
  };

  const availableFields = getAvailableFields();

  const filteredAvailableFields = availableFields.filter(f => {
    const term = fieldSearch.toLowerCase().trim();
    const matchesSearch = !term || f.name.toLowerCase().includes(term) || (f.description && f.description.toLowerCase().includes(term));
    const isChecked = displayFields.includes(f.name);
    const matchesTab = fieldFilterTab === "all" || (fieldFilterTab === "selected" && isChecked) || (fieldFilterTab === "unselected" && !isChecked);
    return matchesSearch && matchesTab;
  });

  // Sync displayFields when selectedIndexId changes
  useEffect(() => {
    const currentFieldNames = availableFields.map(f => f.name);
    // Prefer to auto-select standard/meaningful fields, or slice first 4 if custom index
    const defaultSelected = currentFieldNames.filter(name => 
      ["id", "title", "content", "tags", "label", "description", "publish_date", "author"].includes(name) || currentFieldNames.length <= 4
    );
    setDisplayFields(defaultSelected.length > 0 ? defaultSelected : currentFieldNames.slice(0, 4));
  }, [selectedIndexId, indexes]);

  // Read value of document for a dynamic schema column
  const getDocFieldValue = (doc: DocumentItem, fieldName: string) => {
    if (doc[fieldName as keyof DocumentItem] !== undefined) {
      const val = doc[fieldName as keyof DocumentItem];
      if (Array.isArray(val)) return val.join(", ");
      return String(val);
    }
    // Dynamic fallback matching for index-specific schemas
    if (fieldName === "label") return doc.title;
    if (fieldName === "description") return doc.content;
    if (fieldName === "publish_date") return (doc as any).publish_date || (doc.lastUpdated ? doc.lastUpdated.split("T")[0] : "2026-06-15");
    if (fieldName === "author") return (doc as any).author || "MOER_RESEARCH";
    if (fieldName === "relationships") return JSON.stringify((doc as any).relationships || ["clinical_knowledge", "primary_care"]);
    if (fieldName === "embedding" || fieldName === "vector_field") return `[DenseVector Float32, ${doc.vectorSize || 1536} dims]`;
    
    return (doc as any)[fieldName] !== undefined ? String((doc as any)[fieldName]) : "-";
  };

  const handleEditClick = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setFormIndexId(doc.indexId);
    setFormTitle(doc.title);
    setFormContent(doc.content);
    setFormTagsStr(doc.tags.join(", "));
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setEditingDoc(null);
    setFormIndexId(indexes[0]?.id || "");
    setFormTitle("");
    setFormContent("");
    setFormTagsStr("");
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIndexId) {
      setFormError("请选择一个索引分配文档归属");
      return;
    }
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError("标题或主要内容不能为空");
      return;
    }

    try {
      const parsedTags = formTagsStr
        .split(/[,,，、]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await onSaveDocument({
        id: editingDoc?.id,
        indexId: formIndexId,
        title: formTitle.trim(),
        content: formContent.trim(),
        tags: parsedTags
      });

      setIsFormOpen(false);
      setEditingDoc(null);
    } catch (err: any) {
      setFormError(err.message || "保存文档时出错");
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseFileContent = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setBatchRawJson(JSON.stringify(parsed, null, 2));
        setBatchError("");
      } else {
        setBatchRawJson(JSON.stringify([parsed], null, 2));
        setBatchError("");
      }
    } catch {
      const lines = text.split("\n").filter(l => l.trim().length > 10);
      const docs = lines.map((line, idx) => ({
        title: `从上传文件中导入的文档段落 #${idx + 1}`,
        content: line.trim(),
        tags: ["手动导入", "文本分段"]
      }));
      setBatchRawJson(JSON.stringify(docs, null, 2));
      setBatchError("文件不是标准 JSON 格式。系统已为您自动按换行解析并转成了文本段落数组形式。");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTargetIndexId) {
      setBatchError("请选择需要批量注入的目标索引");
      return;
    }

    try {
      const parsed = JSON.parse(batchRawJson);
      if (!Array.isArray(parsed)) {
        setBatchError("最外层必须是数组格式: [{ title: '...', content: '...' }]");
        return;
      }

      await onBatchImport(batchTargetIndexId, parsed);
      setIsBatchOpen(false);
      setBatchError("");
    } catch (err: any) {
      setBatchError("解析 JSON 失败: " + err.message);
    }
  };

  // Run SQL/DSL Queries inside Sandbox
  const runQueryEngineSubmit = async (type: "sql" | "dsl") => {
    setQueryRunning(true);
    setQueryResponse(null);

    const textPayload = type === "sql" ? sqlQueryText : dslQueryText;

    try {
      if (type === "dsl") {
        JSON.parse(textPayload);
      }

      const res = await fetch("/api/indexes/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indexId: queryTargetIndex,
          queryType: type,
          queryText: textPayload
        })
      });

      const data = await res.json();
      setQueryResponse(data);
    } catch (err: any) {
      setQueryResponse({
        success: false,
        error: err.message || "执行查询时抛出格式异常(如非标准JSON语法等)"
      });
    } finally {
      setQueryRunning(false);
    }
  };

  const applySqlPreset = (presetNo: number) => {
    let q = "";
    const activeIdx = indexes.find(i => i.id === queryTargetIndex);
    const tableName = activeIdx ? activeIdx.name : "all";

    switch (presetNo) {
      case 1:
        q = `SELECT id, title, content, tags FROM ${tableName} LIMIT 5;`;
        break;
      case 2:
        q = `SELECT id, title, content, score, tags FROM ${tableName} WHERE title LIKE '%智能体%' LIMIT 3;`;
        break;
      case 3:
        q = `SELECT id, title, content, score, lastUpdated FROM ${tableName} WHERE tags = 'fin' ORDER BY score DESC LIMIT 3;`;
        break;
      case 4:
        q = `SELECT id, title, content, score, lastUpdated FROM ${tableName} WHERE content LIKE '%糖尿病%' AND tags = 'medical' LIMIT 5;`;
        break;
      default:
        q = `SELECT * FROM ${tableName} LIMIT 5;`;
    }
    setSqlQueryText(q);
  };

  const applyDslPreset = (presetNo: number) => {
    let dslObj: any = {};
    switch (presetNo) {
      case 1:
        dslObj = {
          query: {
            match: {
              content: "智能体"
            }
          },
          size: 5
        };
        break;
      case 2:
        dslObj = {
          query: {
            term: {
              tags: "fin"
            }
          },
          size: 3
        };
        break;
      case 3:
        dslObj = {
          query: {
            bool: {
              must: [
                { match: { title: "财报" } }
              ],
              filter: [
                { term: { tags: "fin" } }
              ]
            }
          },
          size: 5
        };
        break;
      case 4:
        dslObj = {
          query: {
            multi_match: {
              query: "生态 协议",
              fields: ["title", "content"]
            }
          },
          size: 3
        };
        break;
      default:
        dslObj = {
          query: {
            match_all: {}
          },
          size: 5
        };
    }
    setDslQueryText(JSON.stringify(dslObj, null, 2));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic SubTab Navigation Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-slate-800" />
            数据文档库与分布式检视终端 Document Library & Queries
          </h2>
          <p className="text-xs text-slate-500">
            支持物理分段、数据流按需随动字段对齐，深度融合 <b>SQL 关系方言</b> 与 <b>Elasticsearch DSL</b> 双维高级检索终端。
          </p>
        </div>

        {/* Navigation Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubTab("docs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              subTab === "docs"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-700" />
            文档数据流管理
          </button>
          <button
            onClick={() => {
              setSubTab("sql");
              setQueryResponse(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              subTab === "sql"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-650 font-bold" />
            SQL 语义查询终端
          </button>
          <button
            onClick={() => {
              setSubTab("dsl");
              setQueryResponse(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              subTab === "dsl"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-purple-650" />
            DSL 复核检索终端
          </button>
        </div>
      </div>

      {subTab === "docs" ? (
        /* ======================== SUBTAB 1: DOCUMENT LIBRARY & FLOW ======================== */
        <div className="space-y-6">
          {/* Header controls inside SubTab */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-805">文档数据随动检视配置 Panel</h3>
              <p className="text-xs text-slate-550 mt-0.5">配置列字段随当前索引的属性动态响应，支持无缝切换列表或块状卡片。</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                onClick={refreshDocuments}
                className="p-2 border border-slate-200 hover:bg-slate-50 bg-white text-slate-500 rounded-xl flex items-center justify-center transition"
                title="重载数据流"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              {/* Layout togglers */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setLayoutMode("grid")}
                  className={`p-1.5 rounded-lg transition ${
                    layoutMode === "grid" 
                    ? "bg-white text-slate-900 shadow-3xs font-semibold" 
                    : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="块状卡片展示"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLayoutMode("list")}
                  className={`p-1.5 rounded-lg transition ${
                    layoutMode === "list" 
                    ? "bg-white text-slate-900 shadow-3xs font-semibold" 
                    : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="数据列表展示"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                onClick={() => {
                  setBatchTargetIndexId(indexes[0]?.id || "");
                  setIsBatchOpen(true);
                }}
                className="text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                批量导入文档
              </button>
              <button 
                onClick={handleCreateClick}
                className="text-xs font-semibold bg-slate-950 text-white hover:bg-slate-905 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                新增单个文档
              </button>
            </div>
          </div>

          {/* Filtering and Query Block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col md:flex-row justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="text" 
                  placeholder="在本地文档中搜索特定关键词、标题或标签特征..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            {/* Index Filter dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">筛选当前索引归属:</span>
              <select 
                value={selectedIndexId}
                onChange={(e) => setSelectedIndexId(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-slate-400 min-w-[200px] font-mono font-bold text-slate-800"
              >
                <option value="all">【全部索引文档汇聚】</option>
                {indexes.map(idx => (
                  <option key={idx.id} value={idx.id}>/{idx.name} ({idx.docsCount}篇)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Follow-along configurable fields selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-705" />
                  随动指标字段在场渲染核查 (Interactive Fields Display Setting)
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  多模式自适应列映射，勾选后对应列即时挂载/解挂。
                  当前选定: <strong className="text-slate-800 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold">{displayFields.length} / {availableFields.length} 个字段可视统计</strong>
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1 rounded-xl font-mono shrink-0 self-start sm:self-auto shadow-4xs">
                {selectedIndexId === "all" ? "全部跨表通用映射" : `索引: ${getIndexName(selectedIndexId)}的元Schema字段在编`}
              </span>
            </div>

            {/* Scale-friendly search, tab filters, and batch controls */}
            <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-4xs">
              
              {/* Field Search control */}
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="text"
                  placeholder="在库 100+ 随动字段中检索定位特定键名..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 font-mono"
                />
              </div>

              {/* Filtering Category Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start text-[11px]">
                <button
                  type="button"
                  onClick={() => setFieldFilterTab("all")}
                  className={`px-2 py-1 rounded transition whitespace-nowrap ${
                    fieldFilterTab === "all"
                      ? "bg-white text-slate-800 font-bold shadow-4xs"
                      : "text-slate-550 hover:text-slate-800"
                  }`}
                >
                  全部 ({availableFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldFilterTab("selected")}
                  className={`px-2 py-1 rounded transition whitespace-nowrap ${
                    fieldFilterTab === "selected"
                      ? "bg-white text-slate-800 font-bold shadow-4xs"
                      : "text-slate-550 hover:text-slate-800"
                  }`}
                >
                  已选 ({displayFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldFilterTab("unselected")}
                  className={`px-2 py-1 rounded transition whitespace-nowrap ${
                    fieldFilterTab === "unselected"
                      ? "bg-white text-slate-800 font-bold shadow-4xs"
                      : "text-slate-550 hover:text-slate-800"
                  }`}
                >
                  未选 ({availableFields.length - displayFields.length})
                </button>
              </div>

              {/* Field quick actions */}
              <div className="flex items-center gap-1.5 text-[11px] self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setDisplayFields(availableFields.map(f => f.name))}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-650 transition font-medium"
                >
                  全部勾选
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const essential = availableFields.filter(f => ["id", "title"].includes(f.name)).map(f => f.name);
                    setDisplayFields(essential.length > 0 ? essential : [availableFields[0]?.name || "id"]);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-650 transition font-medium"
                >
                  仅留首列
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentFieldNames = availableFields.map(f => f.name);
                    const defaultSelected = currentFieldNames.filter(name => 
                      ["id", "title", "content", "tags", "label", "description"].includes(name) || currentFieldNames.length <= 4
                    );
                    setDisplayFields(defaultSelected.length > 0 ? defaultSelected : currentFieldNames.slice(0, 4));
                    setFieldSearch("");
                    setFieldFilterTab("all");
                  }}
                  className="px-2 py-1 bg-indigo-50 border border-indigo-150 rounded-lg hover:bg-indigo-100/60 text-indigo-705 transition font-medium"
                >
                  还原系统预设
                </button>
              </div>

            </div>

            {/* Scrollable grid representing fields checklist cleanly */}
            <div className="border border-slate-200/60 rounded-xl bg-white p-3.5 shadow-4xs">
              {filteredAvailableFields.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-xs">
                  未检索到匹配的指标字段特征 (无数据映射)
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredAvailableFields.map(f => {
                    const isChecked = displayFields.includes(f.name);
                    return (
                      <label 
                        key={f.name} 
                        className={`group flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] cursor-pointer select-none transition ${
                          isChecked 
                            ? "border-indigo-200 bg-indigo-50/40 text-indigo-950 font-semibold shadow-3xs" 
                            : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100/50 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDisplayFields([...displayFields, f.name]);
                              } else {
                                if (displayFields.length > 1) {
                                  setDisplayFields(displayFields.filter(name => name !== f.name));
                                } else {
                                  alert("请至少保留一个可视呈现字段进行数据挂载！");
                                }
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="font-mono truncate" title={f.name}>{f.name}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-normal shrink-0 group-hover:text-slate-550">
                          ({f.type})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main List/Grid Presentation */}
          {filteredDocs.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-3xs">
              <div className="mx-auto w-12 h-12 bg-slate-100 flex items-center justify-center rounded-full text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">没有找到任何匹配的物理文档</p>
              <p className="text-xs text-slate-400">您可以重新规划筛选的归属索引，或是手动点击上方“新增单个文档”来填充案例。</p>
            </div>
          ) : layoutMode === "grid" ? (
            /* Layout Grid Mode (Cards with dynamic fields) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs hover:border-slate-350 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    
                    {/* Card Head segment */}
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {doc.title || getDocFieldValue(doc, "label") || "无题文档 (Unnamed)"}
                      </h4>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md self-start shrink-0">
                        /{getIndexName(doc.indexId)}
                      </span>
                    </div>

                    {/* Follow-along configurable fields area */}
                    <div className="grid grid-cols-1 gap-2.5 border-l-2 border-slate-100 pl-3 pt-1">
                      {displayFields.map(fieldName => {
                        const val = getDocFieldValue(doc, fieldName);
                        // Make content or large descriptions stand out visually as blocks
                        const isMainText = fieldName === "content" || fieldName === "description";
                        return (
                          <div key={fieldName} className="text-xs leading-relaxed font-sans">
                            <span className="font-mono text-[10px] font-semibold text-slate-400 mr-2 uppercase tracking-wide block md:inline-block md:min-w-[65px]">
                              {fieldName}:
                            </span>
                            {isMainText ? (
                              <p className="text-slate-600 leading-relaxed font-sans text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 mt-1 max-h-32 overflow-y-auto break-words whitespace-pre-line leading-relaxed font-mono">
                                {val}
                              </p>
                            ) : (
                              <span className="text-slate-800 font-medium break-all font-mono text-[11px] bg-slate-50/40 px-1 py-0.2 rounded">
                                {val}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document metadata / operations row */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tg, i) => (
                        <span key={i} className="text-[9.5px] font-mono bg-slate-105 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          #{tg}
                        </span>
                      ))}
                      {doc.vectorSize && (
                        <span className="text-[9.5px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                          维度: {doc.vectorSize}d
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>ID: {doc.id}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditClick(doc)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 bg-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`确定要彻底删除文档 "${doc.title}" 吗？此操作不可逆。`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 border border-slate-200 hover:bg-rose-50 rounded-lg text-rose-500 bg-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            /* Layout Table Mode (Follow-along Dynamic spreadsheet columns) */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-450 font-bold whitespace-nowrap">
                      <th className="py-3 px-4">父索引 (Index)</th>
                      {displayFields.map(fieldName => (
                        <th key={fieldName} className="py-3 px-4">
                          {fieldName}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-right">管理操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/40 transition">
                        {/* Parent index indicator */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            /{getIndexName(doc.indexId)}
                          </span>
                        </td>
                        
                        {/* Selected fields loop columns */}
                        {displayFields.map(fieldName => {
                          const val = getDocFieldValue(doc, fieldName);
                          const isLong = fieldName === "content" || fieldName === "description" || fieldName === "embedding" || fieldName === "vector_field";
                          
                          return (
                            <td key={fieldName} className="py-3.5 px-4 max-w-[280px]">
                              <div 
                                className={`text-slate-700 leading-normal ${
                                  isLong 
                                    ? "truncate max-h-12 overflow-hidden font-mono text-[10.5px] text-slate-500 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100" 
                                    : "font-medium"
                                }`} 
                                title={val}
                              >
                                {val}
                              </div>
                            </td>
                          );
                        })}

                        {/* Actions column */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleEditClick(doc)}
                              className="p-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-650 bg-white shadow-3xs transition"
                              title="编辑文档"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`确定要彻底删除文档 "${doc.title}" 吗？此操作不可逆。`)) {
                                  onDeleteDocument(doc.id);
                                }
                              }}
                              className="p-1 border border-slate-200 hover:bg-rose-50 rounded-lg text-rose-500 bg-white shadow-3xs transition"
                              title="删除文档"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form editing dialog */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-xl shadow-xl space-y-4 animate-scale-up animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    {editingDoc ? "修改并重排文档索引属性 (Edit Property)" : "新建文档入库映射 (New Document)"}
                  </h3>
                  <button onClick={() => { setIsFormOpen(false); setEditingDoc(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-semibold">1. 归属父索引名称 (Target Index)</label>
                    <select 
                      value={formIndexId}
                      onChange={(e) => setFormIndexId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950 bg-white"
                      disabled={!!editingDoc}
                    >
                      {indexes.map(idx => (
                        <option key={idx.id} value={idx.id}>/{idx.name} ({idx.type})</option>
                      ))}
                    </select>
                    {editingDoc && <span className="text-[10px] text-slate-400">为了保障物理指针对齐，文档的主索引归属不可在编辑时任意修改。</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 font-semibold">2. 文档大标题 (Title)</label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="请输入标题..."
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-955"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 font-semibold">3. 文档段落正文 (Content Body)</label>
                    <textarea 
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="支持输入富文本文档核心词汇及长段落..."
                      rows={6}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-955 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 font-semibold">4. 辅助搜索标签 (Tags) <span className="text-slate-400 font-normal">(用逗号或旁白隔开)</span></label>
                    <input 
                      type="text" 
                      value={formTagsStr}
                      onChange={(e) => setFormTagsStr(e.target.value)}
                      placeholder="如: 财报, 科技, 2026"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-955 font-mono"
                    />
                  </div>

                  {formError && (
                    <div className="text-rose-500 text-xs font-mono">{formError}</div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4 text-xs font-medium">
                    <button 
                      type="button" 
                      onClick={() => { setIsFormOpen(false); setEditingDoc(null); }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                    >
                      取消
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-900 font-semibold rounded-xl text-center shadow-3xs transition"
                    >
                      保存并重排索引 (Save)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Batch Import form dialog */}
          {isBatchOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-4 animate-scale-up animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">批量文档上传与测试映射 (Bulk Import Tool)</h3>
                  <button onClick={() => setIsBatchOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
                </div>

                <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-semibold">1. 目标装载索引 (Target Index)</label>
                    <select 
                      value={batchTargetIndexId}
                      onChange={(e) => setBatchTargetIndexId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-955 bg-white"
                      required
                    >
                      {indexes.map(idx => (
                        <option key={idx.id} value={idx.id}>/{idx.name} ({idx.type})</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag and drop upload block */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                      dragActive ? "border-indigo-600 bg-indigo-50" : "border-slate-300 hover:border-slate-450 bg-slate-50"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json,.csv,.txt"
                      className="hidden"
                    />
                    <div className="p-3 bg-white border border-slate-200 rounded-full text-slate-500 shadow-sm">
                      <UploadCloud className="w-5 h-5 text-slate-650" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">拖拽文件到此处，或点击浏览本地文件</p>
                      <p className="text-[10px] text-slate-500">支持拖入标准的 .json、.csv 文本结构（不大于10MB）</p>
                    </div>
                  </div>

                  {/* JSON preview raw pasting */}
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-semibold">2. 粘贴或预览待导入的数据包 (JSON 格式列表)</label>
                    <textarea 
                      value={batchRawJson}
                      onChange={(e) => setBatchRawJson(e.target.value)}
                      placeholder="[\n  {\n    'title': '示例标题',\n    'content': '示例内容',\n    'tags': ['标签']\n  }\n]"
                      rows={8}
                      className="w-full text-[10px] font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950 bg-slate-950 text-slate-305 leading-relaxed"
                      required
                    />
                  </div>

                  {batchError && (
                    <div className="text-rose-500 text-[10px] font-mono leading-relaxed bg-rose-55 border border-rose-100 p-2.5 rounded-lg">{batchError}</div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4 text-xs font-medium">
                    <button 
                      type="button" 
                      onClick={() => setIsBatchOpen(false)}
                      className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-xl transition"
                    >
                      放弃返回
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-slate-950 text-white hover:bg-slate-900 font-semibold rounded-xl text-center shadow-3xs transition"
                    >
                      开始解析并批量写入 (Bulk write)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      ) : subTab === "sql" ? (
        /* ======================== SUBTAB 2: SQL LIVETERMINAL PLAYGROUND (Moved from IndexMgrView) ======================== */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-700 font-bold animate-pulse" />
                  SQL 语义关系查询沙箱 (SQL Query Live Console)
                </span>
                <span className="text-slate-400 text-xs block font-normal">
                  免去复杂 API 堆叠，使用标准 SELECT 格式与 AND/LIKE 操作符对倒排/向量索引直接遍历。
                </span>
              </div>

              {/* Target Index Choice */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">目标数据表 FROM:</span>
                <select
                  value={queryTargetIndex}
                  onChange={(e) => {
                    setQueryTargetIndex(e.target.value);
                    setQueryResponse(null);
                  }}
                  className="bg-white border text-xs border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                >
                  <option value="all">【ALL INDEXES】 全局联邦检索</option>
                  {indexes.map(idx => (
                    <option key={idx.id} value={idx.id}>【{idx.name}】 ({idx.type})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Layout code-editor and presets */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Presets Column list */}
              <div className="lg:col-span-1 space-y-3.5 text-xs">
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  SQL 查询代码库 (Presets)
                </span>

                <div className="space-y-2 text-xs font-sans">
                  <button
                    onClick={() => applySqlPreset(1)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-350 hover:bg-indigo-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-indigo-700">基础全表扫描 projection</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">SELECT id, title, content FROM all LIMIT 5;</span>
                  </button>

                  <button
                    onClick={() => applySqlPreset(2)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-350 hover:bg-indigo-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-indigo-705">LIKE 混合相关模糊检索</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate text-ellipsis">SELECT * WHERE title LIKE '%智能体%'</span>
                  </button>

                  <button
                    onClick={() => applySqlPreset(3)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-350 hover:bg-indigo-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-indigo-700">按得分排名 ORDER BY</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">SELECT ... tags = 'fin' ORDER BY score</span>
                  </button>

                  <button
                    onClick={() => applySqlPreset(4)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-350 hover:bg-indigo-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-indigo-750">AND 多条件强组合</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">content LIKE '%糖尿病%' AND tags = 'med'</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10px] text-slate-500 font-sans leading-relaxed">
                  <div className="font-bold text-slate-700 flex items-center gap-1 text-[10.5px]">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    SQL 编译器提示：
                  </div>
                  <p>1. 支持 standard projections 字段定义限制投影。</p>
                  <p>2. 支持 <b>LIKE '%关键词%'</b> 与 <b>= '标签项'</b> 过滤谓词。</p>
                  <p>3. 支持 <b>ORDER BY</b> score 或 lastUpdated 以及 <b>LIMIT</b> 阈值。</p>
                </div>
              </div>

              {/* Input Area and submit button */}
              <div className="lg:col-span-3 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">SELECT 查询编辑面板 (SQL Query Editor)</span>
                    <span className="text-[10px] text-indigo-600 font-mono">SQL-dialect v1.2</span>
                  </div>
                  <textarea
                    value={sqlQueryText}
                    onChange={(e) => setSqlQueryText(e.target.value)}
                    rows={6}
                    placeholder="请输入 SQL 点击执行..."
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-250 focus:outline-none focus:border-slate-800 bg-slate-950 text-indigo-300 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSqlQueryText("SELECT * FROM all LIMIT 5;")}
                      className="text-xs border text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                    >
                      清屏重置
                    </button>
                  </div>
                  <button
                    onClick={() => runQueryEngineSubmit("sql")}
                    disabled={queryRunning || !sqlQueryText.trim()}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {queryRunning ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white text-indigo-400" />
                    )}
                    {queryRunning ? "关系演算匹配中..." : "开启 SQL 实时检索通道"}
                  </button>
                </div>
              </div>

            </div>

            {/* Render Query outputs */}
            {queryResponse && (
              <div className="border-t border-slate-200/60 pt-5 space-y-5 animate-fade-in font-mono text-xs">
                <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                  <div className="flex items-center gap-4">
                    <span className={queryResponse.success ? "text-emerald-600 font-bold flex items-center gap-1" : "text-rose-600 font-bold flex items-center gap-1"}>
                      {queryResponse.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      )}
                      STATUS: {queryResponse.success ? "SUCCEEDED" : "FAILED"}
                    </span>
                    <span className="text-slate-500">原始索引库响应: <b className="text-slate-800 font-mono">{queryResponse.tookMs}ms</b></span>
                    <span className="text-slate-505">联邦行数: <b className="text-slate-800 font-mono">{queryResponse.results?.length || 0} hits</b></span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(queryResponse, null, 2))}
                      className="text-slate-400 hover:text-slate-700 flex items-center gap-1 p-1 bg-white rounded border border-slate-205 transition"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          已复制 JSON
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          复制完整结果包
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 leading-relaxed">
                  
                  {/* Results Hits Column */}
                  <div className="lg:col-span-2 space-y-3 font-sans">
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1 font-mono">
                      <Database className="w-4 h-4 text-slate-450" />
                      检索分析后对齐元文档详情 (Mapped Hits Output)
                    </span>

                    {queryResponse.results && queryResponse.results.length === 0 ? (
                      <div className="bg-slate-50 border rounded-xl p-8 text-center text-slate-400 space-y-1">
                        <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>没有找到任何符合 SQL 条件匹配的文档段落。</p>
                        <p className="text-[10px] text-slate-400">请核对 LIKE 的百分比占位符或目标分词 tags 的全等状态。</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                        {queryResponse.results?.map((doc: any, i: number) => (
                          <div key={doc.id || i} className="bg-white border hover:border-slate-300 p-4 rounded-xl shadow-3xs space-y-2.5 transition">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">Row #{i + 1} • ID: {doc.id}</span>
                                <h4 className="text-xs font-bold text-slate-900 leading-normal">{doc.title || "Untitled Document"}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-block bg-indigo-50 text-indigo-750 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono leading-none border border-indigo-100">
                                  Score: {doc.score || 1.0}
                                </span>
                              </div>
                            </div>

                            {doc.content && (
                              <p className="text-[11px] text-slate-650 leading-relaxed max-h-24 overflow-y-auto break-all bg-slate-50/65 p-2 rounded">
                                {doc.content}
                              </p>
                            )}

                            <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                              <div className="flex items-center gap-1.5">
                                {doc.tags && doc.tags.map((tag: string) => (
                                  <span key={tag} className="bg-slate-100 text-slate-600 px-1 rounded hover:bg-slate-200">#{tag}</span>
                                ))}
                              </div>
                              <span>更新时间: {doc.lastUpdated ? new Date(doc.lastUpdated).toLocaleString() : "未知"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AST and Planner Trace logs */}
                  <div className="lg:col-span-1 space-y-3.5 text-xs">
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1 font-mono">
                      <Code className="w-4 h-4 text-indigo-500" />
                      SELECT 语义语法分析器 (Planner Trace Logs)
                    </span>

                    <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-910 h-[380px] overflow-y-auto font-mono text-[10.5px] leading-relaxed shadow-lg">
                      {queryResponse.plan && queryResponse.plan.map((log: string, idx: number) => (
                        <p key={idx} className="break-all border-b border-white/5 pb-0.5 mb-1 last:border-b-0">{log}</p>
                      ))}
                      {!queryResponse.success && (
                        <p className="text-rose-450 font-bold mt-2">● [FATAL ERROR] {queryResponse.error}</p>
                      )}
                      
                      {/* AST display */}
                      {queryResponse.ast && (
                        <div className="mt-4 border-t border-slate-800 pt-3 text-indigo-300">
                           <span className="font-bold text-slate-450 block text-[9.5px] uppercase mb-1">AST Parser Payload:</span>
                           <pre className="text-[9.5px] text-slate-500 bg-slate-900/50 p-2 rounded max-h-40 overflow-y-auto">{JSON.stringify(queryResponse.ast, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* ======================== SUBTAB 3: DSL COMPLEX SELECTION SANDBOX (Moved from IndexMgrView) ======================== */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-purple-650 font-bold animate-pulse" />
                  Elasticsearch Query DSL 精确匹配控制台 (Query DSL Live bed)
                </span>
                <span className="text-slate-450 text-xs block font-normal">
                  构建 ES query 树，测算 bool-must/should 双轨合并，实现高精度检索流程复原。
                </span>
              </div>

              {/* Target Index Choice */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">指定索引:</span>
                <select
                  value={queryTargetIndex}
                  onChange={(e) => {
                    setQueryTargetIndex(e.target.value);
                    setQueryResponse(null);
                  }}
                  className="bg-white border text-xs border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:border-slate-850"
                >
                  <option value="all">【ALL INDEXES】 全局索引</option>
                  {indexes.map(idx => (
                    <option key={idx.id} value={idx.id}>【{idx.name}】 ({idx.type})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Editor grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* DSL Presets selection */}
              <div className="lg:col-span-1 space-y-3.5 text-xs">
                <span className="text-xs font-bold text-slate-700 block flex items-center gap-1 font-mono">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  ES-DSL 语法模板 (Presets)
                </span>

                <div className="space-y-2 text-xs font-sans">
                  <button
                    onClick={() => applyDslPreset(1)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-350 hover:bg-purple-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-purple-700">1. Match 语义片段匹配</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">"match": {"{ content: '智能体' }"}</span>
                  </button>

                  <button
                    onClick={() => applyDslPreset(2)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-350 hover:bg-purple-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-purple-700">2. Term 属性常量强等过滤</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">"term": {"{ tags: 'fin' }"}</span>
                  </button>

                  <button
                    onClick={() => applyDslPreset(3)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-350 hover:bg-purple-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-purple-705">3. Compound Bool 逻辑树</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">"bool": {"{ must: [...], filter: [...] }"}</span>
                  </button>

                  <button
                    onClick={() => applyDslPreset(4)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-350 hover:bg-purple-50/20 transition block space-y-1 bg-white"
                  >
                    <span className="font-bold block text-purple-700">4. Multi_Match 万维映射</span>
                    <span className="text-[9.5px] text-slate-400 font-mono font-normal block truncate">"multi_match": {"{ query: '生态' }"}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px] text-slate-500 font-sans leading-relaxed">
                  <div className="font-bold text-slate-700 flex items-center gap-1 text-[10.5px]">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                    Query DSL 分析指示：
                  </div>
                  <p>1. 支持 standard ES-JSON 解析标准以及嵌套实体结构。</p>
                  <p>2. 支持 <b>bool</b> 容器之下的多重复合断言： `must`, `filter`, `must_not` 等。</p>
                  <p>3. 格式校验严苛，填写非法 JSON 文本时在下方会自动闪烁红色提示警告。</p>
                </div>
              </div>

              {/* DSL Query Input Box */}
              <div className="lg:col-span-3 space-y-4">
                <div className="space-y-1.5 font-sans">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-750">DSL 规则定义体 (JSON Raw Payload)</span>
                    <span className="text-[10px] text-purple-600 font-mono font-bold">Content-Type: application/json</span>
                  </div>
                  
                  <textarea
                    value={dslQueryText}
                    onChange={(e) => setDslQueryText(e.target.value)}
                    rows={12}
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-250 focus:outline-none focus:border-slate-800 bg-slate-950 text-purple-350 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDslQueryText(JSON.stringify({ query: { match_all: {} }, size: 5 }, null, 2))}
                      className="text-xs border text-slate-400 hover:text-slate-805 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      清空格式
                    </button>
                  </div>

                  <button
                    onClick={() => runQueryEngineSubmit("dsl")}
                    disabled={queryRunning || !dslQueryText.trim()}
                    className="bg-slate-955 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {queryRunning ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white text-purple-400" />
                    )}
                    {queryRunning ? "DSL 语法解析中..." : "发出 DSL 查询"}
                  </button>
                </div>
              </div>

            </div>

            {/* Results output section */}
            {queryResponse && (
              <div className="border-t border-slate-205 pt-5 space-y-5 animate-fade-in font-mono text-xs">
                
                <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                  <div className="flex items-center gap-4">
                    <span className={queryResponse.success ? "text-emerald-600 font-bold flex items-center gap-1" : "text-rose-600 font-bold flex items-center gap-1"}>
                      {queryResponse.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      )}
                      DSL RESPONSE STATUS: {queryResponse.success ? "200 OK" : "500 SERVER EXCEPTION"}
                    </span>
                    <span className="text-slate-500">分词计算耗时: <b className="text-slate-850 font-mono">{queryResponse.tookMs}ms</b></span>
                    <span className="text-slate-500">命中结果: <b className="text-slate-850 font-mono">{queryResponse.results?.length || 0} hits</b></span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(JSON.stringify(queryResponse, null, 2))}
                    className="text-slate-450 hover:text-slate-800 flex items-center gap-1 p-1 bg-white rounded border border-slate-200 transition"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        已复制 JSON
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        复制 ES 结果包
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 leading-relaxed">
                  
                  {/* Left Column: Parsed Human output cards */}
                  <div className="space-y-4 font-sans">
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1 font-mono">
                      <Code className="w-4 h-4 text-slate-400" />
                      检索命中事实归纳 (Hits Mapped Summarizer)
                    </span>

                    {queryResponse.results && queryResponse.results.length === 0 ? (
                      <div className="bg-slate-50 border rounded-xl p-8 text-center text-slate-400 space-y-1">
                        <AlertTriangle className="w-8 h-8 text-slate-350 mx-auto" />
                        <p>没有命中任何符合 DSL 条件的关联文档。</p>
                        <p className="text-[10px] text-slate-400">请核实 query 嵌套中的 match 字段键名拼写是否匹配当前索引 Schema。</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {queryResponse.results?.map((doc: any, i: number) => (
                          <div key={doc.id || i} className="bg-white border hover:border-slate-300 p-4 rounded-xl shadow-3xs space-y-2.5 transition">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="font-mono text-[9px] text-slate-400 font-bold block">HIT _SCORE: {doc.score || 1.0} • ID: {doc.id}</span>
                                <h4 className="text-xs font-bold text-slate-900 leading-normal">{doc.title || doc.label || "未命名"}</h4>
                              </div>
                              <span className="bg-purple-50 text-purple-750 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wide border border-purple-100 shrink-0">
                                _hit
                              </span>
                            </div>

                            {doc.content && (
                              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg break-all font-mono">
                                {doc.content}
                              </p>
                            )}

                            <div className="flex flex-wrap justify-between items-center text-[9.5px] text-slate-400 border-t border-slate-105 pt-2 font-mono">
                              <div className="flex items-center gap-1">
                                {doc.tags && doc.tags.map((t: string) => (
                                  <span key={t} className="bg-slate-105 text-slate-650 px-1 py-0.2 rounded">#{t}</span>
                                ))}
                              </div>
                              <span>Updated: {doc.lastUpdated ? new Date(doc.lastUpdated).toLocaleString() : ""}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Standard Elastic query RESPONSE JSON */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1 font-mono font-bold">
                      <Database className="w-4 h-4 text-slate-400" />
                      ES Standard REST Response JSON (Stdout)
                    </span>

                    <pre className="p-4 bg-slate-950 text-purple-400 border border-slate-905 rounded-xl h-[420px] overflow-y-auto text-[10.5px] leading-relaxed select-text shadow-xl font-mono">
                      {JSON.stringify(queryResponse.success ? {
                        took: queryResponse.tookMs,
                        timed_out: false,
                        _shards: {
                          total: 3,
                          successful: 3,
                          skipped: 0,
                          failed: 0
                        },
                        hits: {
                          total: {
                            value: queryResponse.results?.length || 0,
                            relation: "eq"
                          },
                          max_score: queryResponse.results?.[0]?.score || null,
                          hits: queryResponse.results?.map((item: any) => ({
                            _index: queryTargetIndex === "all" ? "federated_indexes" : indexes.find(i => i.id === queryTargetIndex)?.name || "target_index",
                            _type: "_doc",
                            _id: item.id,
                            _score: item.score || 1.0,
                            _source: {
                              id: item.id,
                              title: item.title,
                              content: item.content,
                              tags: item.tags,
                              last_updated: item.lastUpdated
                            }
                          }))
                        }
                      } : {
                        error: {
                          root_cause: [{
                            type: "query_parsing_exception",
                            reason: queryResponse.error,
                            line: 1,
                            col: 1
                          }],
                          type: "query_parsing_exception",
                          reason: "Failed to parse query, check grammar constraints",
                          caused_by: {
                            type: "illegal_argument_exception",
                            reason: queryResponse.error
                          }
                        },
                        status: 500
                      }, null, 2)}
                    </pre>
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
