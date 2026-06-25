import React, { useState, useEffect } from 'react';
import { ResearchGap } from '../types';
import { Sparkles, Loader2, Play, Sliders, ChevronDown, ChevronUp, Save, Edit, Quote, AlertTriangle, Lightbulb, Compass, Award } from 'lucide-react';

interface GapAnalysisPanelProps {
  projectId: string;
  token: string;
}

export default function GapAnalysisPanel({ projectId, token }: GapAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [forceRefreshing, setForceRefreshing] = useState(false);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [totalPapers, setTotalPapers] = useState(0);

  // Edit State
  const [editingGapId, setEditingGapId] = useState<string | null>(null);
  const [editedStrategy, setEditedStrategy] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [savingGapId, setSavingGapId] = useState<string | null>(null);

  // Collapsed quote cards state
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGaps();
  }, [projectId]);

  const fetchGaps = async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) setForceRefreshing(true);
    try {
      const response = await fetch('/api/v1/gap-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          force_refresh: forceRefresh
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run research gap analysis');
      }

      const data = await response.json();
      setSummary(data.synthesized_summary);
      setTotalPapers(data.total_analyzed_papers);
      
      // Combine all categories into a single array
      const allGaps: ResearchGap[] = [
        ...data.limitations,
        ...data.future_work,
        ...data.novelties,
        ...data.opportunities
      ];
      setGaps(allGaps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setForceRefreshing(false);
    }
  };

  const handleEditGap = (gap: ResearchGap) => {
    setEditingGapId(gap.id);
    setEditedStrategy(gap.strategy || '');
    setEditedTitle(gap.title);
    setEditedDesc(gap.description);
  };

  const handleSaveGap = async (gapId: string) => {
    setSavingGapId(gapId);
    try {
      const response = await fetch(`/api/v1/gap-analysis/${gapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDesc,
          strategy: editedStrategy
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save gap updates');
      }

      const updatedObj = await response.json();
      
      // Update state locally
      setGaps(prev => prev.map(g => g.id === gapId ? { ...g, title: updatedObj.title, description: updatedObj.description, strategy: updatedObj.strategy } : g));
      setEditingGapId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGapId(null);
    }
  };

  const toggleQuote = (id: string) => {
    setExpandedQuotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper styles by category
  const getTheme = (type: string) => {
    switch (type) {
      case 'limitation':
        return {
          bg: 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
          label: 'Limitation Detected'
        };
      case 'future_work':
        return {
          bg: 'bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/30',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          icon: <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />,
          label: 'Future Work Direction'
        };
      case 'novelty':
        return {
          bg: 'bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/30',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          icon: <Award className="w-4 h-4 text-emerald-400 shrink-0" />,
          label: 'Novelty Breakthrough'
        };
      default:
        return {
          bg: 'bg-sky-950/20 border-sky-900/40 hover:bg-sky-950/30',
          text: 'text-sky-400',
          badgeBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          icon: <Compass className="w-4 h-4 text-sky-400 shrink-0" />,
          label: 'Synthesized Opportunity'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full" id="gap_engine_panel">
      {/* Top executive summary banner */}
      <div className="lg:col-span-12 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="gap_top_summary">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Flagship AI Gap Engine</span>
          </div>
          <h2 className="font-display font-bold text-white text-base md:text-lg">Literature Gap Analysis Engine</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous extraction of limitations, future paths, and novel achievements with cross-paper research opportunity discovery.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-slate-400">
            Papers Indexed: <strong className="text-white">{totalPapers}</strong>
          </span>
          <button 
            onClick={() => fetchGaps(true)}
            disabled={loading || forceRefreshing}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-950 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            {forceRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />}
            Force AI Re-Analysis
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="lg:col-span-8 flex flex-col gap-5 h-full" id="gap_list_area">
        <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Workspace Curated Findings ({gaps.length})
        </h3>

        {loading && !forceRefreshing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-xs text-slate-400 font-mono">Conducting multi-vector gap analysis...</p>
          </div>
        ) : gaps.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20 flex flex-col items-center justify-center">
            <Compass className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-xs text-slate-400">No gap analyses created. Index research papers and hit Re-Analysis to trigger.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
            {gaps.map((g) => {
              const theme = getTheme(g.gap_type);
              const isEditing = editingGapId === g.id;

              return (
                <div key={g.id} className={`p-4 border rounded-xl transition-all flex flex-col gap-3 ${theme.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {theme.icon}
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${theme.badgeBg}`}>
                        {theme.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Metric scores */}
                      <span className="text-[10px] font-mono text-slate-500">
                        Severity: <strong className="text-slate-300">{(g.severity_score * 100).toFixed(0)}%</strong>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Feasibility: <strong className="text-slate-300">{(g.feasibility_score * 100).toFixed(0)}%</strong>
                      </span>
                      
                      {!isEditing && (
                        <button 
                          onClick={() => handleEditGap(g)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-slate-500">CURATED TITLE</label>
                        <input 
                          type="text" 
                          value={editedTitle} 
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-slate-500">DESCRIPTION RATIONALE</label>
                        <textarea 
                          value={editedDesc} 
                          onChange={(e) => setEditedDesc(e.target.value)}
                          rows={3}
                          className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white leading-relaxed" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-emerald-500">PROPOSED WORKAROUND METHODOLOGY / STRATEGY</label>
                        <textarea 
                          value={editedStrategy} 
                          onChange={(e) => setEditedStrategy(e.target.value)}
                          rows={3}
                          placeholder="Outline active research methodology..."
                          className="bg-slate-950 border border-emerald-950 rounded p-1.5 text-xs text-emerald-300 leading-relaxed placeholder-emerald-900" 
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <button 
                          onClick={() => setEditingGapId(null)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveGap(g.id)}
                          disabled={savingGapId === g.id}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded cursor-pointer flex items-center gap-1"
                        >
                          {savingGapId === g.id ? <Loader2 className="w-3 animate-spin" /> : <Save className="w-3" />}
                          Save Curations
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xs font-semibold text-white">{g.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{g.description}</p>
                      
                      {/* Strategy workaround if present */}
                      {g.strategy && (
                        <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-lg">
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold block mb-1">PROPOSED STRATEGY:</span>
                          <p className="text-xs text-emerald-200 leading-relaxed font-sans">{g.strategy}</p>
                        </div>
                      )}

                      {/* Cite quote collapsing option */}
                      {g.original_text_quote && (
                        <div className="border-t border-slate-900 pt-2.5 mt-1">
                          <button 
                            onClick={() => toggleQuote(g.id)}
                            className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Quote className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{expandedQuotes[g.id] ? 'Hide Original Text Quote' : 'View Original Supporting Passage'}</span>
                            {expandedQuotes[g.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {expandedQuotes[g.id] && (
                            <p className="text-[10px] text-slate-400 italic bg-slate-950/40 border border-slate-900/60 rounded p-2.5 mt-2 leading-relaxed">
                              "{g.original_text_quote}"
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: AI Executive Summary Rationale */}
      <div className="lg:col-span-4 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-5 h-full min-h-[300px]" id="gap_right_pane">
        <h3 className="font-display font-semibold text-white mb-2 flex items-center gap-2 text-sm">
          <Quote className="w-4 h-4 text-emerald-400" />
          Workspace AI Synthesis
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Curated literature synthesis generated across all ingested publication contexts.
        </p>

        <div className="flex-1 bg-slate-950/50 border border-slate-900 p-4 rounded-lg overflow-y-auto text-xs text-slate-300 leading-relaxed max-h-[350px] lg:max-h-[none]">
          {loading && !forceRefreshing ? (
            <div className="flex flex-col items-center justify-center p-6 text-slate-500 font-mono gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Compiling synthesis report...</span>
            </div>
          ) : summary ? (
            <div className="whitespace-pre-wrap font-sans">{summary}</div>
          ) : (
            <div className="text-center p-4 text-slate-600 italic">No workspace synthesis compiled.</div>
          )}
        </div>
      </div>
    </div>
  );
}
