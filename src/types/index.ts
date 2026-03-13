export interface Agent {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  permis?: string;
  niveau?: string;
  formations?: string[];
  certifications?: string[];
  disponibilite?: string;
  statut?: string;
  heuresTravaillees?: number;
  site?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'csv';
  size: number;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  agentCount?: number;
  columns?: string[];
  rawData?: Record<string, unknown>[];
  agents?: Agent[];
  summary?: FileSummary;
}

export interface FileSummary {
  totalAgents: number;
  columns: string[];
  formations: Record<string, number>;
  niveaux: Record<string, number>;
  permis: Record<string, number>;
  disponibilite: Record<string, number>;
  duplicates: number;
  errors: string[];
  anomalies: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: ChatResponseData;
}

export interface ChatResponseData {
  type: 'table' | 'count' | 'list' | 'chart';
  agents?: Agent[];
  count?: number;
  stats?: Record<string, number>;
  columns?: string[];
}

export interface AnalysisHistory {
  id: string;
  fileId: string;
  fileName: string;
  date: string;
  type: 'import' | 'analysis' | 'export' | 'cleaning';
  description: string;
  result?: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
  read: boolean;
  category: 'file' | 'planning' | 'agent' | 'system';
}

export interface DashboardStats {
  totalFiles: number;
  totalAgents: number;
  totalAnalyses: number;
  activeAlerts: number;
  recentFiles: UploadedFile[];
  recentAnalyses: AnalysisHistory[];
}

export interface PlanningEntry {
  agentId: string;
  agentName: string;
  date: string;
  shift: string;
  site: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface ExcelReport {
  id: string;
  name: string;
  date: string;
  type: 'pivot' | 'dashboard' | 'report' | 'cleaned';
  fileUrl?: string;
}
