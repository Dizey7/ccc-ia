'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileText, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUploadComplete?: (result: any) => void;
}

interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    name: string;
    type: string;
    agentCount: number;
    columns: string[];
    summary: Record<string, unknown>;
  };
  error?: string;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.success) {
        setResult(data);
        onUploadComplete?.(data);
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: 'Erreur de connexion au serveur' });
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files[0]);
  }, [handleUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleUpload(files[0]);
  };

  const getFileIcon = (type?: string) => {
    if (type === 'excel') return <FileSpreadsheet className="w-6 h-6 text-green-400" />;
    if (type === 'pdf') return <FileText className="w-6 h-6 text-red-400" />;
    return <File className="w-6 h-6 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-500 bg-gray-800/30'
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt,.pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-white font-medium">Analyse en cours...</p>
            <p className="text-sm text-gray-400">L&apos;IA analyse votre fichier</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-gray-500" />
            <p className="text-white font-medium">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-gray-400">
              ou cliquez pour sélectionner un fichier
            </p>
            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Excel (.xlsx, .xls)</span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">CSV (.csv)</span>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">PDF (.pdf)</span>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className={`rounded-lg p-4 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          {result.success ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Fichier analysé avec succès</p>
                <div className="flex items-center gap-2 mt-1">
                  {getFileIcon(result.file?.type)}
                  <span className="text-sm text-gray-300">{result.file?.name}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {result.file?.agentCount} agents détectés • {result.file?.columns?.length} colonnes
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Erreur</p>
                <p className="text-sm text-gray-400">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
