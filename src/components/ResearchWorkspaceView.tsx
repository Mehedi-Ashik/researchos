import React, { useState } from 'react';
import { Paper } from '../types';
import { 
  BookOpen, Upload, Search, FileText, Loader2, CheckCircle2, 
  AlertCircle, Sparkles, Filter, ChevronRight, CornerDownRight, Database, HelpCircle
} from 'lucide-react';

interface ResearchWorkspaceViewProps {
  projectId: string;
  papers: Paper[];
  onPapersRefresh: () => void;
  token: string;
}

export default function ResearchWorkspaceView({
  projectId,
  papers,
  onPapersRefresh,
  token
}: ResearchWorkspaceViewProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Semantic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activePaper, setActivePaper] = useState<Paper | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
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
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('query_text', searchQuery);
      formData.append('limit', '6');

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

  const clearSearchResults = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full" id="research_workspace_root">
      
      {/* LEFT COLUMN: PDF uploader & library directory (5 cols) */}
      <div className="xl:col-span-5 flex flex-col gap-6" id="workspace_left_column">
        
        {/* Modern high-fidelity Uploader card */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm" id="workspace_pdf_uploader">
          <h3 className="font-serif font-semibold text-stone-900 mb-1.5 flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4 text-stone-600" />
            Ingest Paper Publication
          </h3>
          <p className="text-xs text-stone-500 mb-4 leading-relaxed">
            Our multi-agent workstation extracts structure, metadata, DOI mappings, and saves text-embeddings into our vectors database.
          </p>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
              isDragOver 
                ? 'border-stone-800 bg-stone-100' 
                : 'border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3 text-stone-500">
                <Loader2 className="w-10 h-10 animate-spin text-stone-600" />
                <div className="text-center">
                  <span className="text-xs font-semibold block">Synthesizing & Vector Indexing...</span>
                  <span className="text-[10px] text-stone-400 mt-1 block">Parsing layout blocks & entities</span>
                </div>
              </div>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                <div className="flex flex-col items-center gap-2.5 text-center text-stone-500">
                  <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center border border-stone-200/80 shadow-sm">
                    <FileText className="w-5 h-5 text-stone-500" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">Drop Academic PDF here</span>
                    <span className="text-[10px] text-stone-400 block mt-1">or browse files to upload</span>
                  </div>
                  <span className="text-[9px] text-stone-500 font-medium bg-white px-2 py-0.5 rounded border border-stone-200 shadow-sm">
                    PDF format • Max 10MB
                  </span>
                </div>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={onFileChange} 
                  disabled={uploading} 
                />
              </label>
            )}
          </div>

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Academic paper fully indexed into Postgres PGVector database!</span>
            </div>
          )}
        </div>

        {/* Ingested publications directory */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 flex-1 flex flex-col min-h-[350px] shadow-sm" id="workspace_papers_catalog">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
            <h3 className="font-serif font-semibold text-stone-900 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-stone-600" />
              Library Publications Catalog ({papers.length})
            </h3>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 gap-3 flex flex-col max-h-[420px] xl:max-h-[none]">
            {papers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-stone-50/50 border border-dashed border-stone-200 rounded-xl">
                <FileText className="w-12 h-12 text-stone-300 mb-2.5" />
                <h4 className="text-xs font-semibold text-white">Empty Catalog</h4>
                <p className="text-[11px] text-stone-500 max-w-xs mt-1">
                  Upload PDF publications to begin. They will be listed here with automatic meta-attribute rendering.
                </p>
              </div>
            ) : (
              papers.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => setActivePaper(p === activePaper ? null : p)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    activePaper?.id === p.id 
                      ? 'bg-amber-50/20 border-amber-200/80 hover:bg-amber-50/30 shadow-sm' 
                      : 'bg-stone-50/40 border-stone-200/60 hover:border-stone-300 hover:bg-stone-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-stone-900 line-clamp-1 leading-snug font-serif">{p.title}</h4>
                    <span className="shrink-0 text-[8px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.2 rounded uppercase">
                      PDF
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-stone-500 font-sans mt-2">
                    <span className="truncate max-w-[180px] font-medium">{p.authors.join(', ')}</span>
                    <span>•</span>
                    {p.doi ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">DOI RESOLVED</span>
                    ) : (
                      <span className="text-stone-400">NO DOI</span>
                    )}
                  </div>

                  {activePaper?.id === p.id && p.abstract && (
                    <div className="mt-3 pt-3 border-t border-stone-200/50 animate-fadeIn">
                      <span className="text-[9px] font-semibold text-stone-500 block mb-1">PUBLICATION ABSTRACT:</span>
                      <p className="text-[11px] text-stone-700 leading-relaxed font-serif italic">
                        "{p.abstract}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Semantic search & query explorer (7 cols) */}
      <div className="xl:col-span-7 flex flex-col bg-white border border-stone-200/80 rounded-xl p-5 min-h-[500px] shadow-sm" id="workspace_right_column">
        
        {/* Title area */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 shrink-0">
          <div>
            <h3 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-stone-600" />
              PGVector Semantic Explorer
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Query paper vector space embeddings directly. Instantly fetch semantically related text blocks across the entire corpus.
            </p>
          </div>
        </div>

        {/* Search bar input form */}
        <form onSubmit={handleSemanticSearch} className="flex gap-2.5 mb-5 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Enter research query (e.g., self-attention, loss functions)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50/50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none font-sans shadow-inner transition-all" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white font-medium px-4 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Explore
          </button>

          {searchResults.length > 0 && (
            <button 
              type="button"
              onClick={clearSearchResults}
              className="px-3 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* Results layout view */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {searching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-stone-500 mb-3" />
              <p className="text-xs text-stone-500 font-mono">Conducting multi-vector semantic query scanning...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-stone-50/50 border border-stone-200 rounded-xl">
              <Database className="w-12 h-12 text-stone-300 mb-3" />
              <h4 className="text-sm font-semibold text-stone-800">Run Semantic Queries</h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1 leading-relaxed">
                Enter deep technical prompts. The vector search matches embeddings to retrieve exactly relevant context passages from papers.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs text-stone-400 font-mono pb-2 border-b border-stone-100 shrink-0">
                <span className="font-sans font-semibold text-stone-500 uppercase tracking-wider text-[10px]">SEMANTIC PASSAGES FOUND</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full font-sans text-[10px] font-medium">Matched {searchResults.length} chunks</span>
              </div>

              {searchResults.map((res, index) => (
                <div key={index} className="p-4 bg-stone-50/60 border border-stone-200/60 rounded-xl flex flex-col gap-2 transition-all hover:border-stone-400">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 font-sans">
                      <CornerDownRight className="w-3 h-3 text-emerald-600" />
                      Chunk Score: {(res.score * 100).toFixed(1)}%
                    </span>
                    <span className="text-stone-400">
                      Offset: {res.chunk_index}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed font-serif pl-3.5 border-l-2 border-stone-400/40 italic">
                    "{res.text}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] font-sans text-stone-400 mt-2 pt-2 border-t border-stone-200/40">
                    <span className="text-stone-600 font-medium truncate max-w-[250px]">
                      📖 {res.paper?.title || "Indexed Publication Context"}
                    </span>
                    <span>DOI: {res.paper?.doi || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
