import React, { useState, useEffect } from 'react';
import { ResearchGap, Agent, AgentTask } from '../types';
import { 
  Sparkles, Loader2, Play, Sliders, ChevronDown, ChevronUp, Save, Edit, 
  Quote, AlertTriangle, Lightbulb, Compass, Award, Bot, FileText, 
  Terminal, RefreshCw, Layers, CheckCircle2, CheckSquare, Zap, BookOpen
} from 'lucide-react';

interface TrendAnalysisViewProps {
  projectId: string;
  token: string;
}

export default function TrendAnalysisView({
  projectId,
  token
}: TrendAnalysisViewProps) {
  // Gap analysis states
  const [gapsLoading, setGapsLoading] = useState(false);
  const [forceRefreshing, setForceRefreshing] = useState(false);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [synthesisSummary, setSynthesisSummary] = useState<string>('');
  const [totalPapers, setTotalPapers] = useState(0);

  // Editing state for research gaps
  const [editingGapId, setEditingGapId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedStrategy, setEditedStrategy] = useState('');
  const [savingGapId, setSavingGapId] = useState<string | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  // Multi-agent workflow states
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Reader Agent', role: 'Ingestion & Parsing', status: 'idle', description: 'Extracts body layouts, figures, and structural metadata from PDF publications.' },
    { id: '2', name: 'Summarizer Agent', role: 'Semantic Compression', status: 'idle', description: 'Compresses large methodologies and chapters into semantic summaries.' },
    { id: '3', name: 'Citation Agent', role: 'DOI & CrossRef Mapping', status: 'idle', description: 'Resolves academic registries, tracking index references and citations.' },
    { id: '4', name: 'Knowledge Graph Agent', role: 'Topology Extraction', status: 'idle', description: 'Maps entities (methods, tools, data) and semantic connections.' },
    { id: '5', name: 'Research Gap Agent', role: 'Heuristics Bottleneck Analysis', status: 'idle', description: 'Discovers limitations and untracked future directions in papers.' },
    { id: '6', name: 'Trend Agent', role: 'Horizon Scanning', status: 'idle', description: 'Crawls volume changes, predicting high-impact emerging keywords.' },
    { id: '7', name: 'Proposal Agent', role: 'Academic Grant Synthesis', status: 'idle', description: 'Compiles rich multi-year research grant proposals in markdown.' },
    { id: '8', name: 'Fact Check Agent', role: 'Grounded Verification', status: 'idle', description: 'Cross-validates synthesized texts against original indexed papers.' }
  ]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<any | null>(null);

  // Workflow params
  const [proposalTopic, setProposalTopic] = useState("Self-Supervised Dynamic Spatial Indices on High-Contrast GIS Systems");
  const [factCheckClaim, setFactCheckClaim] = useState("Hybrid vector parsing lowers document ingestion latency by 45%.");

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] Horizon Scanning Orchestrator online.",
    "[SYSTEM] Deep-heuristics predictive trend filters activated.",
    "[SYSTEM] Connected to PGVector index space."
  ]);

  const addLog = (log: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  useEffect(() => {
    fetchGaps(false);
    fetchReports();
    fetchTasks();
  }, [projectId]);

  const fetchGaps = async (forceRefresh = false) => {
    setGapsLoading(true);
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
      setSynthesisSummary(data.synthesized_summary);
      setTotalPapers(data.total_analyzed_papers);
      
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
      setGapsLoading(false);
      setForceRefreshing(false);
    }
  };

  const fetchReports = async () => {
    try {
      const r = await fetch(`/api/v1/agents/project/${projectId}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setReports(d);
        if (d.length > 0 && !activeReport) {
          setActiveReport(d[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    try {
      const r = await fetch(`/api/v1/agents/project/${projectId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setTasks(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditGap = (gap: ResearchGap) => {
    setEditingGapId(gap.id);
    setEditedTitle(gap.title);
    setEditedDesc(gap.description);
    setEditedStrategy(gap.strategy || '');
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

      if (response.ok) {
        const updatedObj = await response.json();
        setGaps(prev => prev.map(g => g.id === gapId ? { 
          ...g, 
          title: updatedObj.title, 
          description: updatedObj.description, 
          strategy: updatedObj.strategy 
        } : g));
        setEditingGapId(null);
        addLog(`Curated finding updated successfully.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGapId(null);
    }
  };

  const runWorkflow = async (taskType: string, params: Record<string, any> = {}) => {
    setWorkflowLoading(true);
    addLog(`Initiating Coordinated Agent Loop: [${taskType.toUpperCase()}]`);

    let activeAgentIds: string[] = [];
    if (taskType === 'literature_review') {
      activeAgentIds = ['1', '2', '3'];
    } else if (taskType === 'knowledge_graph') {
      activeAgentIds = ['1', '4'];
    } else if (taskType === 'research_proposal') {
      activeAgentIds = ['2', '5', '7'];
    } else if (taskType === 'fact_check') {
      activeAgentIds = ['8'];
    }

    setAgents(prev => prev.map(a => activeAgentIds.includes(a.id) ? { ...a, status: 'running' } : a));

    try {
      const res = await fetch('/api/v1/agents/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          task_type: taskType,
          parameters: params
        })
      });

      if (!res.ok) throw new Error("Workflow dispatch failed");

      addLog(`Workflow completed. Synchronizing workspace outputs...`);
      setAgents(prev => prev.map(a => activeAgentIds.includes(a.id) ? { ...a, status: 'completed' } : a));
      
      fetchTasks();
      fetchReports();
      fetchGaps(false);
    } catch (e: any) {
      addLog(`[ERROR] Task execution error: ${e.message}`);
      setAgents(prev => prev.map(a => activeAgentIds.includes(a.id) ? { ...a, status: 'failed' } : a));
    } finally {
      setWorkflowLoading(false);
      setTimeout(() => {
        setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
      }, 3000);
    }
  };

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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full" id="trend_analysis_root">
      
      {/* EXECUTIVE TOP BANNER: Force AI reanalysis */}
      <div className="xl:col-span-12 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0" id="trends_banner">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Flagship AI Gap & Trend Engine</span>
          </div>
          <h2 className="font-display font-bold text-white text-base md:text-lg">Research Gap & Prediction Horizon</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detect literature limitations, compile emerging methodologies, and spawn coordinated LangGraph agent networks for proposal generation and grounding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Papers Analyzed: <strong className="text-white">{totalPapers}</strong>
          </span>
          <button 
            onClick={() => fetchGaps(true)}
            disabled={gapsLoading || forceRefreshing}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-950 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            {forceRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            Trigger AI Gap Scans
          </button>
        </div>
      </div>

      {/* LEFT COLUMN: Curated findings catalog & Executive summary (7 cols) */}
      <div className="xl:col-span-7 flex flex-col gap-6" id="trends_left_workspace">
        
        {/* Curated Gaps findings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col min-h-[400px]">
          <h3 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-850 pb-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Workspace Curated Gap Analyses ({gaps.length})
          </h3>

          <div className="overflow-y-auto flex-1 pr-1 gap-4 flex flex-col max-h-[500px]">
            {gapsLoading && !forceRefreshing ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <p className="text-xs text-slate-400 font-mono">Conducting multi-vector scan...</p>
              </div>
            ) : gaps.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-950/20 border border-dashed border-slate-900 rounded-lg">
                <Compass className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-400">No findings detected. Add PDF documents and trigger AI Gap Scans above.</p>
              </div>
            ) : (
              gaps.map((g) => {
                const theme = getTheme(g.gap_type);
                const isEditing = editingGapId === g.id;

                return (
                  <div key={g.id} className={`p-4 border rounded-xl transition-all flex flex-col gap-2.5 ${theme.bg}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        {theme.icon}
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${theme.badgeBg}`}>
                          {theme.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500">
                          Severity: <strong className="text-slate-300">{(g.severity_score * 100).toFixed(0)}%</strong>
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          Feasibility: <strong className="text-slate-300">{(g.feasibility_score * 100).toFixed(0)}%</strong>
                        </span>
                        {!isEditing && (
                          <button onClick={() => handleEditGap(g)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-slate-500">CURATED TITLE</label>
                          <input 
                            type="text" 
                            value={editedTitle} 
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-slate-500">DESCRIPTION RATIONALE</label>
                          <textarea 
                            value={editedDesc} 
                            onChange={(e) => setEditedDesc(e.target.value)}
                            rows={3.5}
                            className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white leading-relaxed" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-emerald-400">PROPOSED WORKAROUND METHODOLOGY / STRATEGY</label>
                          <textarea 
                            value={editedStrategy} 
                            onChange={(e) => setEditedStrategy(e.target.value)}
                            rows={3}
                            placeholder="Outline active research methodology..."
                            className="bg-slate-950 border border-emerald-950 rounded p-1.5 text-xs text-emerald-300 leading-relaxed placeholder-emerald-900" 
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => setEditingGapId(null)} className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 rounded cursor-pointer">Cancel</button>
                          <button onClick={() => handleSaveGap(g.id)} className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded cursor-pointer flex items-center gap-1">
                            {savingGapId === g.id && <Loader2 className="w-3 animate-spin" />} Save Findings
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xs font-semibold text-white">{g.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{g.description}</p>
                        
                        {g.strategy && (
                          <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-lg">
                            <span className="text-[9px] font-mono text-emerald-400 font-bold block mb-1">PROPOSED STRATEGY:</span>
                            <p className="text-xs text-emerald-200 leading-relaxed">{g.strategy}</p>
                          </div>
                        )}

                        {g.original_text_quote && (
                          <div className="border-t border-slate-900 pt-2">
                            <button 
                              onClick={() => setExpandedQuotes(p => ({ ...p, [g.id]: !p[g.id] }))}
                              className="text-[9px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Quote className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{expandedQuotes[g.id] ? 'Hide Supporting Quote' : 'View supporting quote passage'}</span>
                            </button>
                            {expandedQuotes[g.id] && (
                              <p className="text-[10px] text-slate-400 italic bg-slate-950/40 border border-slate-900 rounded p-2.5 mt-2 leading-relaxed">
                                "{g.original_text_quote}"
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Executive AI Synthesis summary box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5" id="trends_ai_summary">
          <h3 className="font-display font-semibold text-white mb-2 flex items-center gap-2 text-sm">
            <Quote className="w-4 h-4 text-emerald-400" />
            AI Literature Synthesis Report
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Grounded executive summary compiled across active vector files.
          </p>
          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-lg overflow-y-auto text-xs text-slate-300 leading-relaxed max-h-[220px]">
            {synthesisSummary ? (
              <div className="whitespace-pre-wrap font-sans">{synthesisSummary}</div>
            ) : (
              <div className="text-center p-4 text-slate-600 italic">No workspace synthesis compiled yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: LangGraph agents controls & Synthesized reports (5 cols) */}
      <div className="xl:col-span-5 flex flex-col gap-6" id="trends_right_orchestration">
        
        {/* LangGraph task dispatcher panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-3.5">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4 text-emerald-400" />
            Orchestrate LangGraph Workflows
          </h3>
          <p className="text-xs text-slate-400">
            Spawn sub-graph threads targeting dedicated multi-agent computational pipelines.
          </p>

          <div className="flex flex-col gap-3">
            {/* literature review dispatch */}
            <div className="p-3 bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-lg flex items-center justify-between transition-all">
              <div>
                <h4 className="text-xs font-semibold text-white">1. Literature Survey Review</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Spawns Reader, Summarizer, and Citation agents.</p>
              </div>
              <button 
                onClick={() => runWorkflow('literature_review')}
                disabled={workflowLoading}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[9px] font-semibold px-2.5 py-1.5 rounded transition-colors cursor-pointer shrink-0"
              >
                Spawn Grid
              </button>
            </div>

            {/* Grant Proposal dispatch */}
            <div className="p-3 bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-lg flex flex-col gap-2.5 transition-all">
              <div>
                <h4 className="text-xs font-semibold text-white">2. Synthesize Academic Grant Proposal</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Assembles multi-year research targets in Markdown.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={proposalTopic}
                  onChange={(e) => setProposalTopic(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-slate-700"
                />
                <button 
                  onClick={() => runWorkflow('research_proposal', { topic: proposalTopic })}
                  disabled={workflowLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-950 text-slate-950 font-bold px-3 rounded text-[10px] transition-colors cursor-pointer shrink-0"
                >
                  Draft Grant
                </button>
              </div>
            </div>

            {/* Fact check grounding */}
            <div className="p-3 bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-lg flex flex-col gap-2.5 transition-all">
              <div>
                <h4 className="text-xs font-semibold text-white">3. Grounded Verification audit</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Fact Check Agent validates claim statement against indexed papers.</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={factCheckClaim}
                  onChange={(e) => setFactCheckClaim(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-slate-700"
                />
                <button 
                  onClick={() => runWorkflow('fact_check', { statement: factCheckClaim })}
                  disabled={workflowLoading}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[9px] font-semibold px-3 rounded transition-colors cursor-pointer shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Synthesized Reports Catalog viewer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col min-h-[300px]">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm mb-3">
            <FileText className="w-4 h-4 text-emerald-400" />
            Synthesized Reports Catalog ({reports.length})
          </h3>

          <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
            {reports.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setActiveReport(rep)}
                className={`p-2 rounded text-[10px] font-mono border text-center truncate cursor-pointer transition-all ${
                  activeReport?.id === rep.id 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold' 
                    : 'bg-slate-950 border-slate-900 hover:border-slate-850 text-slate-400 hover:text-white'
                }`}
              >
                {rep.report_type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-slate-950/60 border border-slate-900 p-4 rounded-lg overflow-y-auto text-xs text-slate-300 leading-relaxed font-mono max-h-[300px] xl:max-h-[none]">
            {activeReport ? (
              <div className="whitespace-pre-wrap font-mono text-[10px]">
                <div className="border-b border-slate-900 pb-2 mb-3">
                  <span className="text-emerald-400 font-semibold uppercase block mb-1">REPORT SCHEMA INFO</span>
                  <span className="text-slate-500 block">Type: {activeReport.report_type}</span>
                  <span className="text-slate-500 block">Created: {new Date(activeReport.created_at).toLocaleString()}</span>
                </div>
                {activeReport.content}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-600 italic">No report selected. Run workflows to generate reports.</div>
            )}
          </div>
        </div>

        {/* System Terminal Console */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[9px] text-slate-400 shrink-0" id="trends_sys_terminal">
          <div className="flex items-center gap-1.5 text-slate-500 mb-2 border-b border-slate-900 pb-1.5 font-bold">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Horizon Scanning Workstation Log</span>
          </div>
          <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
            {terminalLogs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
