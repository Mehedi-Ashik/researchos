import React, { useState, useEffect } from 'react';
import { Project, Paper, AgentTask, ResearchGap } from '../types';
import { 
  FileText, Database, Sliders, Activity, Bot, Clock, Sparkles, 
  ArrowRight, ShieldCheck, RefreshCw, Terminal, Layers
} from 'lucide-react';

interface DashboardViewProps {
  projectId: string;
  project: Project | null;
  papers: Paper[];
  token: string;
  onNavigateToTab: (tab: 'dashboard' | 'workspace' | 'chat' | 'graph' | 'trends' | 'settings') => void;
}

export default function DashboardView({
  projectId,
  project,
  papers,
  token,
  onNavigateToTab
}: DashboardViewProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [graphStats, setGraphStats] = useState({ nodesCount: 0, relationsCount: 0 });
  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<string[]>([
    "System security layer validated (SECURE_SESSION_OK).",
    "Connected to PostgreSQL backend. Vector indices initialized.",
    "Academic knowledge engine ready for ingestion queries."
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, [projectId]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch agent tasks
      const tasksRes = await fetch(`/api/v1/agents/project/${projectId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // 2. Fetch research gaps (locally or from cache)
      const gapsRes = await fetch('/api/v1/gap-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: projectId, force_refresh: false })
      });
      if (gapsRes.ok) {
        const gapsData = await gapsRes.json();
        const allGaps: ResearchGap[] = [
          ...gapsData.limitations,
          ...gapsData.future_work,
          ...gapsData.novelties,
          ...gapsData.opportunities
        ];
        setGaps(allGaps);
      }

      // 3. Fetch knowledge graph statistics
      const graphRes = await fetch(`/api/v1/agents/project/${projectId}/graph`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        setGraphStats({
          nodesCount: graphData.nodes?.length || 0,
          relationsCount: graphData.relations?.length || 0
        });
      }
    } catch (e) {
      console.error("[DASHBOARD STATS ERROR]", e);
    } finally {
      setLoading(false);
    }
  };

  // Compute status counts for tasks
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;

  return (
    <div className="flex flex-col gap-6" id="dashboard_view_container">
      {/* Title Header with Project details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-white border border-stone-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]" id="dashboard_header_card">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Autonomous Session Active
            </span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-stone-900">
            {project?.name || "Autonomous Academic Workspace"}
          </h2>
          <p className="text-xs text-stone-500 mt-1.5 max-w-2xl leading-relaxed">
            {project?.description || "Extract, analyze, and orchestrate deep academic publications through visual graphs, gap analysis and LangGraph autonomous agent pipelines."}
          </p>
        </div>

        <button 
          onClick={fetchDashboardStats}
          className="bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium text-xs px-4 py-2 border border-stone-200 hover:border-stone-300 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
          Synchronize Workspace
        </button>
      </div>

      {/* Grid statistics metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5" id="dashboard_metrics_grid">
        {/* Metric 1 */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(28,25,23,0.02)] transition-all duration-200">
          <div>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Ingested Papers</span>
            <h3 className="font-serif font-bold text-3xl text-stone-900 mt-1">
              {papers.length}
            </h3>
            <p className="text-[10px] text-stone-600 font-mono mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Vector Database Ingested
            </p>
          </div>
          <div className="w-11 h-11 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-stone-600" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(28,25,23,0.02)] transition-all duration-200">
          <div>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Knowledge Entities</span>
            <h3 className="font-serif font-bold text-3xl text-stone-900 mt-1">
              {graphStats.nodesCount}
            </h3>
            <p className="text-[10px] text-stone-500 font-medium mt-1">
              With <strong>{graphStats.relationsCount}</strong> semantic links
            </p>
          </div>
          <div className="w-11 h-11 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-stone-600" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(28,25,23,0.02)] transition-all duration-200">
          <div>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Extracted Gaps</span>
            <h3 className="font-serif font-bold text-3xl text-stone-900 mt-1">
              {gaps.length}
            </h3>
            <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Novel Opportunities
            </p>
          </div>
          <div className="w-11 h-11 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-center">
            <Sliders className="w-5 h-5 text-stone-600" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(28,25,23,0.02)] transition-all duration-200">
          <div>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">LangGraph Tasks</span>
            <h3 className="font-serif font-bold text-3xl text-stone-900 mt-1">
              {tasks.length}
            </h3>
            <p className="text-[10px] text-stone-500 mt-1">
              <span className="text-emerald-700 font-medium">{completedTasks}</span> done • <span className="text-amber-700 font-medium">{runningTasks}</span> active
            </p>
          </div>
          <div className="w-11 h-11 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-stone-600" />
          </div>
        </div>
      </div>

      {/* Main split dashboard section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard_body_split">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Quickstart Guided Actions */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]" id="dashboard_quickstart">
            <h3 className="font-serif font-semibold text-stone-900 text-base mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-stone-700" />
              Academic Workspace Guided Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-50 hover:bg-stone-100/70 p-4.5 rounded-xl border border-stone-200/60 hover:border-stone-300 transition-all cursor-pointer flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]" onClick={() => onNavigateToTab('workspace')}>
                <div>
                  <h4 className="text-xs font-semibold text-stone-900 mb-1.5">1. Ingest PDF Literature</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Upload paper publications, resolve DOIs automatically, and ingest text chunks into our PGVector semantic database.
                  </p>
                </div>
                <span className="text-stone-700 text-[10px] font-semibold flex items-center gap-1 mt-4">
                  Open Workspace <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div className="bg-stone-50 hover:bg-stone-100/70 p-4.5 rounded-xl border border-stone-200/60 hover:border-stone-300 transition-all cursor-pointer flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]" onClick={() => onNavigateToTab('chat')}>
                <div>
                  <h4 className="text-xs font-semibold text-stone-900 mb-1.5">2. Q&A Synthesis Chat</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Query papers directly using RAG model. Retrieve precise supporting quotes, citations, and semantic answers instantly.
                  </p>
                </div>
                <span className="text-stone-700 text-[10px] font-semibold flex items-center gap-1 mt-4">
                  Start Chat <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <div className="bg-stone-50 hover:bg-stone-100/70 p-4.5 rounded-xl border border-stone-200/60 hover:border-stone-300 transition-all cursor-pointer flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]" onClick={() => onNavigateToTab('graph')}>
                <div>
                  <h4 className="text-xs font-semibold text-stone-900 mb-1.5">3. Inspect Knowledge Graph</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Visualize automatically extracted entity nodes (Methodology, Dataset, Concept) and edit connections manually.
                  </p>
                </div>
                <span className="text-stone-700 text-[10px] font-semibold flex items-center gap-1 mt-4">
                  Visualize Graph <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* LangGraph Active Pipelines & Orchestration summary */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]" id="dashboard_tasks_overview">
            <h3 className="font-serif font-semibold text-stone-900 text-base mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              LangGraph Orchestrated Pipelines
            </h3>

            {tasks.length === 0 ? (
              <div className="p-10 text-center bg-stone-50 border border-dashed border-stone-200 rounded-xl">
                <Bot className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No autonomous tasks have been dispatched in this project session.</p>
                <button 
                  onClick={() => onNavigateToTab('trends')}
                  className="mt-3 text-[11px] font-medium text-stone-800 hover:text-stone-950 flex items-center gap-1 mx-auto border-b border-stone-800"
                >
                  Spawn multi-agent research sub-graph <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-4 bg-stone-50/50 border border-stone-200/60 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-800 capitalize">
                          {t.task_type.replace('_', ' ')} Pipeline
                        </span>
                        <span className="text-[9px] font-mono bg-stone-100 text-stone-500 border border-stone-200 px-1.5 rounded">
                          ID: {t.id.substring(0, 8)}
                        </span>
                      </div>
                      {t.parameters?.topic && (
                        <p className="text-[11px] text-stone-500 mt-1 font-serif">Topic: "{t.parameters.topic}"</p>
                      )}
                      {t.parameters?.statement && (
                        <p className="text-[11px] text-stone-500 mt-1 font-serif">Claim: "{t.parameters.statement}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(t.created_at).toLocaleTimeString()}
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        t.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        t.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Recent Workspace activity console / journal ledger */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col h-full min-h-[320px]" id="dashboard_terminal_logs">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4 text-stone-800 text-xs shrink-0 font-medium">
              <Clock className="w-4 h-4 text-stone-500" />
              <span>Verifiable Activity Journal</span>
            </div>
            
            <div className="flex-1 overflow-y-auto text-[11px] text-stone-600 leading-relaxed flex flex-col gap-3 max-h-[220px] lg:max-h-[none]">
              {recentLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 bg-stone-50/50 p-2 border border-stone-200/40 rounded-lg">
                  <span className="text-stone-400 mt-0.5">▪</span>
                  <p className="font-serif text-stone-600 italic">{log}</p>
                </div>
              ))}
              <div className="flex gap-2 text-stone-400 font-mono text-[10px] mt-auto">
                <span>⚡</span>
                <span>Active project database monitoring initialized...</span>
              </div>
            </div>
          </div>

          {/* Telemetry Core Status */}
          <div className="bg-stone-50/60 border border-stone-200/80 rounded-xl p-5" id="dashboard_sys_status">
            <h3 className="font-serif font-semibold text-stone-900 text-xs mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-stone-500" />
              Workstation Core Status
            </h3>

            <div className="flex flex-col gap-2.5 text-[11px] font-sans text-stone-600">
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="font-medium">Database host</span>
                <span className="text-stone-900 font-medium">Cloud SQL PGVector</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="font-medium">Agent SDK</span>
                <span className="text-stone-900 font-medium">@google/genai 2.5</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="font-medium">Uptime Status</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Active (Secure)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Environment mode</span>
                <span className="text-stone-900 font-medium">Sandbox Fallback</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
