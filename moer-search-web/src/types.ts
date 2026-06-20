export interface ClusterInfo {
  status: "GREEN" | "YELLOW" | "RED";
  nodesCount: number;
  indexesCount: number;
  docsCount: number;
  storageUsageBytes: number;
  jvmMemoryPercent: number;
  qps: number;
  avgResponseMs: number;
  hasLiveGemini: boolean;
}

export interface IndexField {
  name: string;
  type: string;
  searchable: boolean;
  description: string;
}

export interface IndexItem {
  id: string;
  name: string;
  docsCount: number;
  storageBytes: number;
  type: "vector" | "fulltext" | "hybrid";
  status: "open" | "closed";
  shards: number;
  replicas: number;
  creationTime: string;
  fields: IndexField[];
  aliases: string[];
}

export interface DocumentItem {
  id: string;
  indexId: string;
  title: string;
  content: string;
  contentHighlight?: string;
  vectorSize?: number;
  score?: number;
  tags: string[];
  lastUpdated: string;
}

export interface OntologyNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, string>;
}

export interface OntologyEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SystemLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  module: string;
  message: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  status: "active" | "inactive";
}

export interface ModelCompareResult {
  output: string;
  latencyMs: number;
  score: number;
  reasoning: string;
}

export interface ModelCompareResponse {
  deepseek: ModelCompareResult;
  qwen: ModelCompareResult;
  claude: ModelCompareResult;
  gemini: ModelCompareResult;
}

export interface ModelConfig {
  activeSearchModel: string;
  activeQaModel: string;
  activeNlpModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemInstruction: string;
  safetySetting: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  thinkingEnabled: boolean;
  thinkingBudget: number;
}

export interface RegisteredModel {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  temperature: number;
  status: "active" | "inactive" | "maintenance";
  description: string;
  createdAt: string;
}

export type ActiveTab =
  | "dashboard"
  | "indexes"
  | "documents"
  | "search"
  | "ai"
  | "ontology"
  | "system"
  | "api";
