import React, { useState, useEffect } from 'react';
import { Agent, AgentTask, Paper } from '../types';
import InteractiveGraph, { getNodeColor } from './InteractiveGraph';
import { 
  Bot, Play, Terminal, Database, FileText, CheckCircle2, 
  ShieldAlert, Sparkles, Loader2, Network, Plus, Trash2, 
  Edit, Cpu, HelpCircle, X, Sparkle, RefreshCw, AlertCircle
} from 'lucide-react';

interface AgentsPanelProps {
  projectId: string;
  papers: Paper[];
  token: string;
}

export default function AgentsPanel({ projectId, papers, token }: AgentsPanelProps) {
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

  const [activeTab, setActiveTab] = useState<'agents' | 'graph' | 'reports'>('graph');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; relations: any[] }>({ nodes: [], relations: [] });
  const [loading, setLoading] = useState(false);
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);

  // Inspector and selection states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<any | null>(null);

  // Form states for manual additions
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("Concept");
  const [newNodeProps, setNewNodeProps] = useState('{\n  "description": ""\n}');
  const [newNodeError, setNewNodeError] = useState<string | null>(null);

  const [newRelSourceId, setNewRelSourceId] = useState("");
  const [newRelTargetId, setNewRelTargetId] = useState("");
  const [newRelType, setNewRelType] = useState("UTILIZES");

  // Edit states for selected node
  const [editNodeLabel, setEditNodeLabel] = useState("");
  const [editNodeType, setEditNodeType] = useState("");
  const [editNodeProps, setEditNodeProps] = useState("");
  const [editNodeError, setEditNodeError] = useState<string | null>(null);

  // Auto extraction panel states
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null);

  // Inline confirmations to bypass window.confirm inside sandboxed iframe
  const [showNodeDeleteConfirm, setShowNodeDeleteConfirm] = useState(false);
  const [showRelationDeleteConfirm, setShowRelationDeleteConfirm] = useState(false);

  // Custom log terminal state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] Workstation multi-agent orchestration active.",
    "[SYSTEM] Interactive Knowledge Graph engine initialized.",
    "[SYSTEM] 8 agents registered on LangGraph context. Ready for query dispatching."
  ]);

  // Form states
  const [proposalTopic, setProposalTopic] = useState("Dynamic Self-Correcting Multi-Agent Verification Loops");
  const [factCheckClaim, setFactCheckClaim] = useState("Multi-agent pipelines yield over 40% performance gain.");

  useEffect(() => {
    fetchTasks();
    fetchReports();
    fetchGraph();
  }, [projectId]);

  const addLog = (log: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
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

  const fetchReports = async () => {
    try {
      const r = await fetch(`/api/v1/agents/project/${projectId}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setReports(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGraph = async () => {
    try {
      const r = await fetch(`/api/v1/agents/project/${projectId}/graph`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setGraphData(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Selection handlers
  const handleSelectNode = (id: string) => {
    const node = graphData.nodes.find(n => n.id === id);
    if (node) {
      setSelectedNodeId(id);
      setSelectedNode(node);
      setSelectedRelationId(null);
      setSelectedRelation(null);
      setShowNodeDeleteConfirm(false);
      
      // Seed edit fields
      setEditNodeLabel(node.label);
      setEditNodeType(node.type);
      setEditNodeProps(JSON.stringify(node.properties || {}, null, 2));
      setEditNodeError(null);
    }
  };

  const handleSelectRelation = (id: string) => {
    const rel = graphData.relations.find(r => r.id === id);
    if (rel) {
      setSelectedRelationId(id);
      setSelectedRelation(rel);
      setSelectedNodeId(null);
      setSelectedNode(null);
      setShowRelationDeleteConfirm(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedNodeId(null);
    setSelectedNode(null);
    setSelectedRelationId(null);
    setSelectedRelation(null);
    setShowNodeDeleteConfirm(false);
    setShowRelationDeleteConfirm(false);
  };

  // Node operations
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewNodeError(null);
    if (!newNodeLabel.trim()) return;

    let parsedProps = {};
    try {
      if (newNodeProps.trim()) {
        parsedProps = JSON.parse(newNodeProps);
      }
    } catch (err) {
      setNewNodeError("Invalid JSON properties format.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/agents/project/${projectId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          label: newNodeLabel,
          type: newNodeType,
          properties: parsedProps
        })
      });

      if (res.ok) {
        addLog(`Created semantic node: "${newNodeLabel}" [${newNodeType}]`);
        setNewNodeLabel("");
        setNewNodeProps('{\n  "description": ""\n}');
        fetchGraph();
      } else {
        const errObj = await res.json();
        setNewNodeError(errObj.detail || "Failed to create node.");
      }
    } catch (err: any) {
      setNewNodeError(err.message || "Failed to save node.");
    }
  };

  const handleUpdateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditNodeError(null);
    if (!selectedNode || !editNodeLabel.trim()) return;

    let parsedProps = {};
    try {
      if (editNodeProps.trim()) {
        parsedProps = JSON.parse(editNodeProps);
      }
    } catch (err) {
      setEditNodeError("Properties must be a valid JSON object.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/agents/project/${projectId}/nodes/${selectedNode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          label: editNodeLabel,
          type: editNodeType,
          properties: parsedProps
        })
      });

      if (res.ok) {
        const updated = await res.json();
        addLog(`Updated node "${selectedNode.label}" -> "${editNodeLabel}"`);
        setSelectedNode(updated);
        fetchGraph();
      } else {
        const errObj = await res.json();
        setEditNodeError(errObj.detail || "Failed to update node.");
      }
    } catch (err: any) {
      setEditNodeError(err.message || "Failed to update node.");
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    try {
      const res = await fetch(`/api/v1/agents/project/${projectId}/nodes/${selectedNode.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        addLog(`Permanently deleted node "${selectedNode.label}" and its associated linkages.`);
        handleClearSelection();
        fetchGraph();
      } else {
        addLog("Failed to delete selected node from database.");
      }
    } catch (err: any) {
      addLog(`Failed to delete node: ${err.message}`);
    }
  };

  // Relation operations
  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelSourceId || !newRelTargetId) {
      addLog("[WARNING] Must specify source and target nodes to build a link.");
      return;
    }
    if (newRelSourceId === newRelTargetId) {
      addLog("[WARNING] Self-referential relations are not supported.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/agents/project/${projectId}/relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          source_node_id: newRelSourceId,
          target_node_id: newRelTargetId,
          relation_type: newRelType,
          properties: {}
        })
      });

      if (res.ok) {
        const sourceNode = graphData.nodes.find(n => n.id === newRelSourceId);
        const targetNode = graphData.nodes.find(n => n.id === newRelTargetId);
        addLog(`Linked "${sourceNode?.label}" --[${newRelType}]--> "${targetNode?.label}"`);
        setNewRelSourceId("");
        setNewRelTargetId("");
        fetchGraph();
      } else {
        addLog("Failed to establish semantic connection.");
      }
    } catch (err: any) {
      addLog(`Relation error: ${err.message}`);
    }
  };

  const handleDeleteRelation = async () => {
    if (!selectedRelation) return;
    try {
      const res = await fetch(`/api/v1/agents/project/${projectId}/relations/${selectedRelation.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        addLog(`Severed relation connection.`);
        handleClearSelection();
        fetchGraph();
      } else {
        addLog("Failed to delete connection.");
      }
    } catch (err: any) {
      addLog(`Failed to delete relation: ${err.message}`);
    }
  };

  // Automated extraction
  const handleAutoExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractText.trim()) return;

    setExtracting(true);
    setExtractSuccessMsg(null);
    addLog("Analyzing block of text for key entities and associations...");

    try {
      const res = await fetch(`/api/v1/agents/project/${projectId}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: extractText })
      });

      if (res.ok) {
        const payload = await res.json();
        setExtractText("");
        setExtractSuccessMsg(`Successfully extracted ${payload.nodes?.length || 0} entities and ${payload.relations?.length || 0} relationships!`);
        addLog(`Dynamic NLP Extraction registered ${payload.nodes?.length || 0} nodes.`);
        fetchGraph();
        
        // Hide success message after 4s
        setTimeout(() => setExtractSuccessMsg(null), 4000);
      } else {
        addLog("Gemini auto-extraction pipeline reported a runtime exception.");
      }
    } catch (err: any) {
      addLog(`Extraction failed: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const runWorkflow = async (taskType: string, params: Record<string, any> = {}) => {
    setLoading(true);
    setTriggeringTask(taskType);
    addLog(`Initiating Coordinated LangGraph Workflow: [${taskType.toUpperCase()}]`);

    let activeAgentIds: string[] = [];
    if (taskType === 'literature_review') {
      activeAgentIds = ['1', '2', '3'];
      addLog("Reader, Summarizer, and Citation agents spawned on sub-graph.");
    } else if (taskType === 'knowledge_graph') {
      activeAgentIds = ['1', '4'];
      addLog("Reader and Knowledge Graph agents spawned to map topology.");
    } else if (taskType === 'research_proposal') {
      activeAgentIds = ['2', '5', '7'];
      addLog("Summarizer, Gap, and Proposal agents spawned to compile grant.");
    } else if (taskType === 'fact_check') {
      activeAgentIds = ['8'];
      addLog("Fact Check agent initialized for claim verification.");
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

      if (!res.ok) throw new Error("Workflow dispatch error");

      const data = await res.json();
      addLog(`Workflow completed successfully. Output updated in workstation database.`);
      
      setAgents(prev => prev.map(a => activeAgentIds.includes(a.id) ? { ...a, status: 'completed' } : a));
      
      fetchTasks();
      fetchReports();
      fetchGraph();
    } catch (e: any) {
      addLog(`[CRITICAL WORKFLOW FAILED] Workflow failed: ${e.message}`);
      setAgents(prev => prev.map(a => activeAgentIds.includes(a.id) ? { ...a, status: 'failed' } : a));
    } finally {
      setLoading(false);
      setTriggeringTask(null);
      setTimeout(() => {
        setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
      }, 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full" id="multi_agent_workspace_root">
      {/* Tab Navigation header */}
      <div className="xl:col-span-12 border-b border-slate-800 pb-2 flex justify-between items-center" id="agent_tabs">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('graph')} 
            className={`px-4 py-2 text-xs font-display font-semibold transition-all cursor-pointer ${
              activeTab === 'graph' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Interactive Visual Graph Workspace ({graphData.nodes?.length || 0} nodes)
          </button>
          <button 
            onClick={() => setActiveTab('agents')} 
            className={`px-4 py-2 text-xs font-display font-semibold transition-all cursor-pointer ${
              activeTab === 'agents' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            LangGraph Agent Grid & Control
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`px-4 py-2 text-xs font-display font-semibold transition-all cursor-pointer ${
              activeTab === 'reports' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Synthesized Reports ({reports.length})
          </button>
        </div>

        {activeTab === 'graph' && (
          <button 
            onClick={fetchGraph}
            title="Refresh graph from DB"
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync DB
          </button>
        )}
      </div>

      {activeTab === 'agents' && (
        <>
          {/* Left Column: 8 Agent Grid */}
          <div className="xl:col-span-7 flex flex-col gap-6" id="agent_left_pane">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="agents_grid">
              {agents.map((a) => (
                <div key={a.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between transition-all hover:bg-slate-900/80">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{a.role}</span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                        a.status === 'running' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        a.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        a.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-950/80 text-slate-400 border border-slate-800'
                      }`}>
                        {a.status === 'running' ? 'Running' : a.status === 'completed' ? 'Complete' : a.status === 'failed' ? 'Failed' : 'Idle'}
                      </span>
                    </div>
                    <h4 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                      <Bot className={`w-4 h-4 ${a.status === 'running' ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                      {a.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Execution Terminal & Trigger Panel */}
          <div className="xl:col-span-5 flex flex-col gap-6" id="agent_right_pane">
            {/* Run Tasks Container */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5" id="agent_trigger_console">
              <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Orchestrate Coordinated Workflows
              </h3>

              <div className="flex flex-col gap-3.5">
                {/* Lit review trigger */}
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex items-center justify-between hover:bg-slate-950/80 transition-all">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Assemble Literature Review Survey</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Spawns Reader, Summarizer, and Citation agents.</p>
                  </div>
                  <button 
                    onClick={() => runWorkflow('literature_review')}
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[10px] font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Deploy Sub-Graph
                  </button>
                </div>

                {/* Graph trigger */}
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex items-center justify-between hover:bg-slate-950/80 transition-all">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Extract Semantic Knowledge Graph</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Extracts core entity linkages (utilizes, evaluates on).</p>
                  </div>
                  <button 
                    onClick={() => runWorkflow('knowledge_graph')}
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[10px] font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Build Graph
                  </button>
                </div>

                {/* Proposal trigger */}
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex flex-col gap-2.5 hover:bg-slate-950/80 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">Synthesize Academic Grant Proposal</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Runs multi-agent synthesis targeting a new topic.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={proposalTopic}
                      onChange={(e) => setProposalTopic(e.target.value)}
                      placeholder="Enter target topic..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-slate-700"
                    />
                    <button 
                      onClick={() => runWorkflow('research_proposal', { topic: proposalTopic })}
                      disabled={loading}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-950 text-slate-950 font-semibold px-3 py-1.5 rounded text-[10px] transition-colors cursor-pointer shrink-0"
                    >
                      Draft Proposal
                    </button>
                  </div>
                </div>

                {/* Fact check trigger */}
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex flex-col gap-2.5 hover:bg-slate-950/80 transition-all">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Verify Claim grounding</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Fact Check Agent cross-validates statements against indexed papers.</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={factCheckClaim}
                      onChange={(e) => setFactCheckClaim(e.target.value)}
                      placeholder="Enter research claim to audit..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-slate-700"
                    />
                    <button 
                      onClick={() => runWorkflow('fact_check', { statement: factCheckClaim })}
                      disabled={loading}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[10px] font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0"
                    >
                      Verify Claim
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Terminal System logs */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 min-h-[220px] flex flex-col font-mono" id="agents_terminal">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-2 text-slate-400 text-xs">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>LangGraph Workstation Hub Output</span>
              </div>
              <div className="flex-1 overflow-y-auto text-[10px] text-slate-300 leading-relaxed max-h-[180px] lg:max-h-[none]">
                {terminalLogs.map((l, i) => (
                  <div key={i} className="mb-1">{l}</div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'graph' && (
        <div className="xl:col-span-12 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col h-[calc(100vh-190px)] min-h-[600px]" id="graph_topology_pane">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
            <div>
              <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
                <Network className="w-4 h-4 text-emerald-400 animate-pulse" />
                Interactive Research Knowledge Graph system
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag nodes to organize, scroll to zoom, click elements to inspect/update, or extract from raw texts using Gemini AI.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
            {/* Visual Workspace Canvas (Left 8 cols) */}
            <div className="lg:col-span-8 flex flex-col relative h-full min-h-[400px]">
              {graphData.nodes?.length === 0 ? (
                <div className="absolute inset-0 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 flex flex-col items-center justify-center p-8 z-10 text-center">
                  <Database className="w-12 h-12 text-slate-700 mb-3" />
                  <h4 className="text-sm font-semibold text-white">Empty Semantic Space</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1.5">
                    No nodes have been created yet. You can run automated workflows, extract entities from abstract text, or manually add your first node.
                  </p>
                  <div className="flex gap-3 mt-5">
                    <button 
                      onClick={() => runWorkflow('knowledge_graph')}
                      className="bg-emerald-500 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-emerald-600 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-Seed graph
                    </button>
                  </div>
                </div>
              ) : (
                <InteractiveGraph
                  nodes={graphData.nodes}
                  relations={graphData.relations}
                  selectedNodeId={selectedNodeId}
                  selectedRelationId={selectedRelationId}
                  onSelectNode={handleSelectNode}
                  onSelectRelation={handleSelectRelation}
                  onClearSelection={handleClearSelection}
                />
              )}
            </div>

            {/* Context Control Inspector & Extraction Panels (Right 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto h-full pr-1">
              
              {/* Contextual selection inspector */}
              {selectedNode && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode.type) }} />
                      <h4 className="text-xs font-mono uppercase text-slate-400">Node Inspector</h4>
                    </div>
                    <button onClick={handleClearSelection} className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateNode} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-500">Label / Name</label>
                      <input 
                        type="text" 
                        value={editNodeLabel} 
                        onChange={(e) => setEditNodeLabel(e.target.value)}
                        className="bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-500">Category Type</label>
                      <select 
                        value={editNodeType} 
                        onChange={(e) => setEditNodeType(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                      >
                        <option value="Concept">Concept</option>
                        <option value="Methodology">Methodology</option>
                        <option value="Dataset">Dataset</option>
                        <option value="Technology">Technology</option>
                        <option value="Institution">Institution</option>
                        <option value="Metric">Metric</option>
                        <option value="Document">Document</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-500 flex justify-between">
                        <span>Properties (JSON)</span>
                        <span className="text-[8px] text-slate-600 font-normal">e.g. {"{\"complexity\": \"O(N)\"}"}</span>
                      </label>
                      <textarea 
                        rows={3}
                        value={editNodeProps} 
                        onChange={(e) => setEditNodeProps(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-slate-700"
                      />
                    </div>

                    {editNodeError && (
                      <span className="text-[9px] font-mono text-rose-400 bg-rose-500/5 p-2 rounded border border-rose-500/10 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {editNodeError}
                      </span>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-slate-900">
                      <button 
                        type="submit"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Save Node Changes
                      </button>

                      {showNodeDeleteConfirm ? (
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={handleDeleteNode}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1.5 rounded text-[10px] transition-colors cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowNodeDeleteConfirm(false)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-2 rounded text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowNodeDeleteConfirm(true)}
                          className="bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 rounded p-1.5 text-rose-400 transition-all cursor-pointer"
                          title="Delete entity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {selectedRelation && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Network className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-mono uppercase">Relationship Inspector</h4>
                    </div>
                    <button onClick={handleClearSelection} className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Nodes detail summary */}
                  <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded border border-slate-900 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Source Entity</span>
                      <span className="font-semibold text-white">
                        {graphData.nodes.find(n => n.id === selectedRelation.source_node_id)?.label || "Source Node"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-950/60 pt-2 mt-1">
                      <span className="text-slate-500">Association</span>
                      <span className="font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                        {selectedRelation.relation_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-950/60 pt-2 mt-1">
                      <span className="text-slate-500">Target Entity</span>
                      <span className="font-semibold text-white">
                        {graphData.nodes.find(n => n.id === selectedRelation.target_node_id)?.label || "Target Node"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-900">
                    {showRelationDeleteConfirm ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleDeleteRelation}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded text-[10px] transition-colors cursor-pointer"
                        >
                          Confirm sever link
                        </button>
                        <button 
                          onClick={() => setShowRelationDeleteConfirm(false)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-3 py-1.5 rounded text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowRelationDeleteConfirm(true)}
                        className="bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-rose-400 font-semibold px-3 py-1.5 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sever Link
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Default forms (visible when nothing is selected) */}
              {!selectedNode && !selectedRelation && (
                <>
                  {/* Automated Entity Extraction Pane */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                    <h4 className="text-xs font-display font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Gemini Entity & Relation Extractor
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Paste a paragraph, paper abstract, or literature text block to automatically extract entities and relationship configurations using Gemini 2.5.
                    </p>

                    <form onSubmit={handleAutoExtract} className="flex flex-col gap-3">
                      <textarea 
                        rows={3.5}
                        value={extractText}
                        onChange={(e) => setExtractText(e.target.value)}
                        placeholder="Paste research text block here..."
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700 font-sans leading-relaxed"
                      />

                      {extractSuccessMsg && (
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                          {extractSuccessMsg}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={extracting || !extractText.trim()}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-950 disabled:text-slate-600 text-slate-950 font-bold py-1.5 rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {extracting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Running NLP Ingestion...
                          </>
                        ) : (
                          <>
                            <Cpu className="w-3.5 h-3.5" />
                            Run AI Extraction
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Manual Node Builder Form */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                    <h4 className="text-xs font-display font-semibold text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Create Custom Entity
                    </h4>

                    <form onSubmit={handleAddNode} className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[9px] font-mono uppercase text-slate-500">Label / Name</label>
                          <input 
                            type="text" 
                            value={newNodeLabel}
                            onChange={(e) => setNewNodeLabel(e.target.value)}
                            placeholder="e.g. Contrastive Learning"
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700 font-medium"
                          />
                        </div>

                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[9px] font-mono uppercase text-slate-500">Category Type</label>
                          <select 
                            value={newNodeType}
                            onChange={(e) => setNewNodeType(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                          >
                            <option value="Concept">Concept</option>
                            <option value="Methodology">Methodology</option>
                            <option value="Dataset">Dataset</option>
                            <option value="Technology">Technology</option>
                            <option value="Institution">Institution</option>
                            <option value="Metric">Metric</option>
                            <option value="Document">Document</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono uppercase text-slate-500">Custom Attributes (JSON)</label>
                        <textarea 
                          rows={2.5}
                          value={newNodeProps}
                          onChange={(e) => setNewNodeProps(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-slate-700"
                        />
                      </div>

                      {newNodeError && (
                        <span className="text-[9px] font-mono text-rose-400 bg-rose-500/5 p-2 rounded border border-rose-500/10 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {newNodeError}
                        </span>
                      )}

                      <button 
                        type="submit"
                        disabled={!newNodeLabel.trim()}
                        className="bg-slate-950 border border-slate-800 hover:bg-slate-900 disabled:text-slate-600 disabled:hover:bg-slate-950 text-emerald-400 font-mono text-[10px] font-bold py-1.5 rounded transition-all cursor-pointer text-center shrink-0"
                      >
                        + Insert Node
                      </button>
                    </form>
                  </div>

                  {/* Manual Relationship Connection Builder */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shrink-0">
                    <h4 className="text-xs font-display font-semibold text-white flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-emerald-400" />
                      Add Relationship Link
                    </h4>

                    <form onSubmit={handleAddRelation} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono uppercase text-slate-500">Source Node</label>
                        <select 
                          value={newRelSourceId}
                          onChange={(e) => setNewRelSourceId(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                        >
                          <option value="">-- Choose Source Node --</option>
                          {graphData.nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label} [{n.type}]</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono uppercase text-slate-500">Link Type (Directed Edge)</label>
                        <select 
                          value={newRelType}
                          onChange={(e) => setNewRelType(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                        >
                          <option value="UTILIZES">UTILIZES</option>
                          <option value="EVALUATED_ON">EVALUATED_ON</option>
                          <option value="INFLUENCES">INFLUENCES</option>
                          <option value="PRODUCES">PRODUCES</option>
                          <option value="PART_OF">PART_OF</option>
                          <option value="ASSOCIATED_WITH">ASSOCIATED_WITH</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono uppercase text-slate-500">Target Node</label>
                        <select 
                          value={newRelTargetId}
                          onChange={(e) => setNewRelTargetId(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                        >
                          <option value="">-- Choose Target Node --</option>
                          {graphData.nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label} [{n.type}]</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        type="submit"
                        disabled={!newRelSourceId || !newRelTargetId || newRelSourceId === newRelTargetId}
                        className="bg-slate-950 border border-slate-800 hover:bg-slate-900 disabled:text-slate-600 disabled:hover:bg-slate-950 text-emerald-400 font-mono text-[10px] font-bold py-1.5 rounded transition-all cursor-pointer text-center shrink-0"
                      >
                        Link Entities
                      </button>
                    </form>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="xl:col-span-12 flex flex-col gap-6" id="agent_reports_pane">
          {reports.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/20 flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-xs text-slate-400">No academic reports generated in this workspace yet.</p>
              <p className="text-[10px] text-slate-500 mt-1">Deploy the Literature Survey sub-graph on the active console to compile findings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {reports.map((rep) => (
                <div key={rep.id} className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">{rep.report_type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(rep.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-display font-semibold text-white mb-3 text-sm">{rep.title}</h4>
                    
                    <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-lg max-h-[160px] overflow-y-auto text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {rep.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
