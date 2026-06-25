import React, { useState, useEffect } from 'react';
import { Paper, RAGQueryResponse, CitationSource } from '../types';
import { BookOpen, Upload, Search, MessageSquare, Loader2, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface RAGPanelProps {
  projectId: string;
  papers: Paper[];
  onPapersRefresh: () => void;
  token: string;
}

export default function RAGPanel({ projectId, papers, onPapersRefresh, token }: RAGPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // RAG Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [ragResult, setRagResult] = useState<RAGQueryResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: CitationSource[] }>>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/papers/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to upload paper.');
      }

      setUploadSuccess(true);
      onPapersRefresh();
      // Clear success after 3s
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('query_text', searchQuery);
      formData.append('limit', '5');

      const response = await fetch('/api/v1/papers/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleRAGQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || chatLoading) return;

    const userMsg = chatQuery;
    setChatQuery('');
    setChatLoading(true);
    
    // Add User message to history
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const response = await fetch('/api/v1/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          query_text: userMsg,
          limit: 5,
          hybrid_alpha: 0.5,
          enable_compression: true
        })
      });

      if (!response.ok) {
        throw new Error('RAG pipeline failed');
      }

      const data: RAGQueryResponse = await response.json();
      setRagResult(data);
      
      // Add Assistant message with sources
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        text: data.answer, 
        sources: data.sources 
      }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        text: `Error conducting literature synthesis: ${error.message || 'Server timeout'}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full" id="rag_workspace_panel">
      {/* Left Column: Paper Library & Upload */}
      <div className="lg:col-span-4 flex flex-col gap-6" id="rag_paper_sidebar">
        {/* Upload Container */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5" id="pdf_upload_section">
          <h3 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            PDF Ingestion Engine
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload academic publications. PDF metadata, DOIs, and embeddings are synthesized automatically.
          </p>

          <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg p-6 cursor-pointer transition-all hover:bg-slate-950/80">
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-xs font-mono">Indexing document...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-slate-400">
                <FileText className="w-8 h-8 text-slate-500 hover:text-white transition-colors" />
                <span className="text-xs font-semibold text-white">Select PDF Publication</span>
                <span className="text-[10px] text-slate-500 font-mono">Max 10MB</span>
              </div>
            )}
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={uploading} 
            />
          </label>

          {uploadError && (
            <div className="mt-3 p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-lg flex items-start gap-2 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-3 p-2.5 bg-emerald-950/40 border border-emerald-900/50 rounded-lg flex items-center gap-2 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Paper fully indexed into project DB!</span>
            </div>
          )}
        </div>

        {/* Paper Library */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5 flex-1 flex flex-col min-h-[300px]" id="paper_library_list">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Ingested Documents ({papers.length})
            </h3>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 gap-2.5 flex flex-col max-h-[320px] lg:max-h-[none]">
            {papers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/20 border border-slate-900 rounded-lg">
                <FileText className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">No documents uploaded yet in this workspace.</p>
              </div>
            ) : (
              papers.map((p) => (
                <div key={p.id} className="p-3 bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-lg transition-all hover:bg-slate-950/80">
                  <h4 className="text-xs font-semibold text-white line-clamp-1 mb-1">{p.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="truncate max-w-[150px]">{p.authors.join(', ')}</span>
                    {p.doi && <span className="text-emerald-400">DOI Resolved</span>}
                  </div>
                  {p.abstract && (
                    <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 italic">
                      {p.abstract}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Literature Q&A Terminal */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5 h-full min-h-[450px]" id="rag_qa_workspace">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="font-display font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              Literature Synthesis Chat
            </h3>
            <p className="text-xs text-slate-400">
              Query multiple research publications with structured source attribution and inline references.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Gemini 2.5 Flash
          </span>
        </div>

        {/* Chat History View */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 mb-4 min-h-[250px] max-h-[350px] lg:max-h-[none]">
          {chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/20 rounded-xl border border-slate-900/50">
              <MessageSquare className="w-12 h-12 text-slate-800 mb-3" />
              <h4 className="text-sm font-semibold text-slate-400 mb-1">Synthesized AI Knowledge Base</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Ask analytical questions across your papers like "What were the limitations of the baseline training models?"
              </p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] rounded-xl p-3.5 ${
                  msg.role === 'user' 
                    ? 'bg-emerald-950/20 border border-emerald-800/30 text-white self-end' 
                    : 'bg-slate-950/50 border border-slate-800/60 text-slate-300 self-start'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-500 mb-1">
                  {msg.role === 'user' ? 'RESEARCHER' : 'RESEARCH OS'}
                </span>
                
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Chunks/Sources citations if assistant */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-900">
                    <span className="text-[10px] font-mono text-slate-500 block mb-2">VERIFIED CITED SOURCES:</span>
                    <div className="flex flex-col gap-2">
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="p-2 bg-slate-900/40 rounded border border-slate-800/60 text-[10px]">
                          <div className="flex items-center justify-between font-mono text-slate-400 mb-1">
                            <span className="text-emerald-400 font-semibold">{src.citation_key} {src.citation.title}</span>
                            <span>Score: {(src.score * 100).toFixed(1)}%</span>
                          </div>
                          <p className="text-slate-400 italic line-clamp-2">"{src.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {chatLoading && (
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 text-slate-400 self-start max-w-[80%] flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="text-xs font-mono">Synthesizing literature pipeline...</span>
            </div>
          )}
        </div>

        {/* Query Input */}
        <form onSubmit={handleRAGQuery} className="flex gap-2.5 mt-auto">
          <input 
            type="text" 
            placeholder="Query literature workspace..." 
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            disabled={chatLoading}
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans" 
          />
          <button 
            type="submit"
            disabled={chatLoading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900/30 text-slate-950 font-semibold px-4 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Query
          </button>
        </form>
      </div>
    </div>
  );
}
