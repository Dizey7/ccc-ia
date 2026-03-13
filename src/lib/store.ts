import { UploadedFile, ChatMessage, AnalysisHistory, Alert, Agent } from '@/types';

// In-memory store for the application (would be replaced by a database in production)
class AppStore {
  private files: Map<string, UploadedFile> = new Map();
  private chatHistory: Map<string, ChatMessage[]> = new Map();
  private analysisHistory: AnalysisHistory[] = [];
  private alerts: Alert[] = [];
  private globalAgents: Agent[] = [];

  // Files
  addFile(file: UploadedFile): void {
    this.files.set(file.id, file);
  }

  getFile(id: string): UploadedFile | undefined {
    return this.files.get(id);
  }

  getAllFiles(): UploadedFile[] {
    return Array.from(this.files.values()).sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  updateFile(id: string, updates: Partial<UploadedFile>): void {
    const file = this.files.get(id);
    if (file) {
      this.files.set(id, { ...file, ...updates });
    }
  }

  deleteFile(id: string): void {
    this.files.delete(id);
  }

  // Agents
  setAgents(agents: Agent[]): void {
    this.globalAgents = agents;
  }

  getAgents(): Agent[] {
    return this.globalAgents;
  }

  getAllAgentsFromFiles(): Agent[] {
    const allAgents: Agent[] = [];
    for (const file of this.files.values()) {
      if (file.agents) {
        allAgents.push(...file.agents);
      }
    }
    return allAgents;
  }

  // Chat
  addChatMessage(fileId: string, message: ChatMessage): void {
    const messages = this.chatHistory.get(fileId) || [];
    messages.push(message);
    this.chatHistory.set(fileId, messages);
  }

  getChatMessages(fileId: string): ChatMessage[] {
    return this.chatHistory.get(fileId) || [];
  }

  // Analysis History
  addAnalysis(analysis: AnalysisHistory): void {
    this.analysisHistory.unshift(analysis);
  }

  getAnalysisHistory(): AnalysisHistory[] {
    return this.analysisHistory;
  }

  // Alerts
  addAlert(alert: Alert): void {
    this.alerts.unshift(alert);
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }

  markAlertRead(id: string): void {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) alert.read = true;
  }

  getUnreadAlertCount(): number {
    return this.alerts.filter(a => !a.read).length;
  }

  // Stats
  getStats() {
    return {
      totalFiles: this.files.size,
      totalAgents: this.getAllAgentsFromFiles().length,
      totalAnalyses: this.analysisHistory.length,
      activeAlerts: this.getUnreadAlertCount(),
    };
  }
}

// Singleton
const globalStore = globalThis as unknown as { __appStore: AppStore };
if (!globalStore.__appStore) {
  globalStore.__appStore = new AppStore();
}
export const store = globalStore.__appStore;
