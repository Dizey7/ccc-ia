'use client';

import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  const [files, setFiles] = useState<Array<{ id: string; name: string; agentCount: number }>>([]);
  const [selectedFile, setSelectedFile] = useState<string | undefined>();

  useEffect(() => {
    fetch('/api/analyze').then(r => r.json()).then(d => {
      if (d.files) {
        const validFiles = d.files.filter((f: { agentCount: number }) => f.agentCount > 0);
        setFiles(validFiles);
      }
    });
  }, []);

  return (
    <div className="h-screen flex flex-col animate-fade-in">
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Chat IA - Assistant de Répartition
          </h1>
          <p className="text-sm text-gray-400">Posez vos questions en langage naturel sur vos données d&apos;agents</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedFile || ''}
            onChange={e => setSelectedFile(e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Tous les fichiers</option>
            {files.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.agentCount} agents)</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface fileId={selectedFile} />
      </div>
    </div>
  );
}
