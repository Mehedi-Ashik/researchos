import React, { useState, useEffect } from 'react';
import { Paper } from '../types';
import InteractiveGraph, { getNodeColor } from './InteractiveGraph';
import { 
  Network, Database, Sparkles, Loader2, RefreshCw, X, Plus, 
  Trash2, CheckCircle2, Cpu, AlertCircle, HelpCircle, Info
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  projectId: string;
  papers: Paper[];
  token: string;
}

export default function KnowledgeGraphView({
  projectId,
  papers,
  token
}: KnowledgeGraphViewProps) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; relations: any[] }>({ nodes: [], relations: [] });
  const [loading, setLoading] = useState(false);
  const [workflowRunning, setWorkflowRunning] = useState(false);

  // Inspector & Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<any | null>(null);

  // Manual Creation Forms state
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("Concept");
  const [newNodeProps, setNewNodeProps] = useState('{\n  "description": ""\n}');
  const [newNodeError, setNewNodeError] = useState<string | null>(null);

  const [newRelSourceId, setNewRelSourceId] = useState("");
  const [newRelTargetId, setNewRelTargetId] = useState("");
  const [newRelType, setNewRelType] = useState("UTILIZES");

  // Editing state
  const [editNodeLabel, setEditNodeLabel] = useState("");
  const [editNodeType, setEditNodeType] = useState("");
  const [editNodeProps, setEditNodeProps] = useState("");
  const [editNodeError, setEditNodeError] = useState<string | null>(null);

  // Gemini Extraction input
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null);

  // Deletion confirmations inside iframe sandbox (safety first)
  const [showNodeDeleteConfirm, setShowNodeDeleteConfirm] = useState(false);
  const [showRelationDeleteConfirm, setShowRelationDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchGraph();
  }, [projectId]);

  const fetchGraph = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = (id: string) => {
    const node = graphData.nodes.find(n => n.id === id);
    if (node) {
      setSelectedNodeId(id);
      setSelectedNode(node);
      setSelectedRelationId(null);
      setSelectedRelation(null);
      setShowNodeDeleteConfirm(false);
      
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
      setNewNodeError("Properties must be a valid JSON object.");
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
        handleClearSelection();
        fetchGraph();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelSourceId || !newRelTargetId || newRelSourceId === newRelTargetId) return;

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
        setNewRelSourceId("");
        setNewRelTargetId("");
        fetchGraph();
      }
    } catch (err) {
      console.error(err);
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
        handleClearSelection();
        fetchGraph();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractText.trim()) return;

    setExtracting(true);
    setExtractSuccessMsg(null);

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
        setExtractSuccessMsg(`Successfully parsed ${payload.nodes?.length || 0} entities and ${payload.relations?.length || 0} relationships!`);
        fetchGraph();
        setTimeout(() => setExtractSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  const handleSeedGraph = async () => {
    setWorkflowRunning(true);
    try {
      const res = await fetch('/api/v1/agents/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          task_type: 'knowledge_graph',
          parameters: {}
        })
      });

      if (res.ok) {
        fetchGraph();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkflowRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-190px)] min-h-[600px]" id="knowledge_graph_root">
      
      {/* Top action header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-stone-200/80 rounded-xl p-5 shrink-0 shadow-sm" id="graph_header_panel">
        <div>
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-stone-600 animate-pulse" />
            Interactive Research Knowledge Graph Mapping
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            Visualize extracted taxonomies, concepts, datasets, and methodologies. Run AI-driven parsing or update metadata schemas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSeedGraph}
            disabled={workflowRunning || loading}
            className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {workflowRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Spawning Agents...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Extract Corpus Topology
              </>
            )}
          </button>

          <button 
            onClick={fetchGraph}
            className="bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 border border-stone-200 p-2 rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Reload from DB"
          >
            <RefreshCw className={`w-4 h-4 ${loading && !workflowRunning ? 'animate-spin text-stone-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        {/* Visual stage panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col relative h-full min-h-[400px]" id="graph_canvas_wrapper">
          {graphData.nodes?.length === 0 ? (
            <div className="absolute inset-0 border border-dashed border-stone-200 rounded-xl bg-white flex flex-col items-center justify-center p-8 z-10 text-center">
              <Database className="w-12 h-12 text-stone-300 mb-3" />
              <h4 className="text-sm font-semibold text-stone-800">Empty Topological Canvas</h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1.5 leading-relaxed">
                No research entities have been registered yet. Click "Auto-Extract Corpus Topology" above, or use the AI Extractor to seed the visual nodes instantly.
              </p>
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

        {/* Right sidebars/Forms (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto h-full pr-1" id="graph_sidebars_wrapper">
          
          {/* Selected Node Details Form */}
          {selectedNode && (
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 flex flex-col gap-3 shrink-0 shadow-sm animate-fadeIn" id="inspector_node_card">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode.type) }} />
                  <h4 className="text-[10px] font-sans uppercase text-stone-500 font-semibold tracking-wider">Node Properties Inspector</h4>
                </div>
                <button onClick={handleClearSelection} className="p-1 hover:bg-stone-50 rounded text-stone-400 hover:text-stone-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateNode} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Label / Title</label>
                  <input 
                    type="text" 
                    value={editNodeLabel} 
                    onChange={(e) => setEditNodeLabel(e.target.value)}
                    className="bg-stone-50 border border-stone-200 focus:border-stone-400 rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans font-medium shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Category Type</label>
                  <select 
                    value={editNodeType} 
                    onChange={(e) => setEditNodeType(e.target.value)}
                    className="bg-stone-50 border border-stone-200 focus:border-stone-400 rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans shadow-inner"
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
                  <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Custom Attributes (JSON)</label>
                  <textarea 
                    rows={3}
                    value={editNodeProps} 
                    onChange={(e) => setEditNodeProps(e.target.value)}
                    className="bg-stone-50 border border-stone-200 focus:border-stone-400 rounded p-2 text-[10px] font-mono text-stone-700 focus:outline-none shadow-inner"
                  />
                </div>

                {editNodeError && (
                  <span className="text-[9px] font-sans font-medium text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-100 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {editNodeError}
                  </span>
                )}

                <div className="flex gap-2 pt-2 border-t border-stone-100">
                  <button 
                    type="submit"
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-1.5 rounded text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>

                  {showNodeDeleteConfirm ? (
                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={handleDeleteNode}
                        className="bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded text-[10px] cursor-pointer shadow-sm"
                      >
                        Confirm
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowNodeDeleteConfirm(false)}
                        className="bg-stone-100 text-stone-600 border border-stone-200 px-2 rounded text-[10px] cursor-pointer hover:bg-stone-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowNodeDeleteConfirm(true)}
                      className="bg-white border border-stone-200 text-rose-600 hover:bg-rose-50 p-1.5 rounded transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Selected Edge Details Form */}
          {selectedRelation && (
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 flex flex-col gap-3 shrink-0 shadow-sm animate-fadeIn" id="inspector_relation_card">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2 text-stone-500">
                  <Network className="w-4 h-4 text-stone-600 animate-pulse" />
                  <h4 className="text-[10px] font-sans uppercase font-semibold tracking-wider">Relation Link Inspector</h4>
                </div>
                <button onClick={handleClearSelection} className="p-1 hover:bg-stone-50 rounded text-stone-400 hover:text-stone-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-200/80 text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-sans font-medium text-[10px]">Source Node</span>
                  <span className="font-semibold text-stone-800">
                    {graphData.nodes.find(n => n.id === selectedRelation.source_node_id)?.label || "Source"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-stone-200/40 pt-2">
                  <span className="text-stone-500 font-sans font-medium text-[10px]">Association</span>
                  <span className="font-sans font-semibold bg-stone-200 text-stone-700 border border-stone-300 px-2 py-0.5 rounded-full text-[9px]">
                    {selectedRelation.relation_type}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-stone-200/40 pt-2">
                  <span className="text-stone-500 font-sans font-medium text-[10px]">Target Node</span>
                  <span className="font-semibold text-stone-800">
                    {graphData.nodes.find(n => n.id === selectedRelation.target_node_id)?.label || "Target"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-100">
                {showRelationDeleteConfirm ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDeleteRelation}
                      className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded text-[10px] cursor-pointer shadow-sm"
                    >
                      Sever Link
                    </button>
                    <button 
                      onClick={() => setShowRelationDeleteConfirm(false)}
                      className="bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 px-3 py-1.5 rounded text-[10px] cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowRelationDeleteConfirm(true)}
                    className="bg-white border border-stone-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sever Relationship Link
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Forms visible when nothing is selected */}
          {!selectedNode && !selectedRelation && (
            <>
              {/* Gemini Auto Extractor Block */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-4 flex flex-col gap-3 shrink-0 shadow-sm" id="extractor_card">
                <h4 className="text-xs font-serif font-semibold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-stone-600 animate-pulse" />
                  NLP Entity & Relation Extractor
                </h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Paste paper abstract blocks to automatically parse taxonomies, datasets, and methodologies with Gemini.
                </p>

                <form onSubmit={handleAutoExtract} className="flex flex-col gap-3">
                  <textarea 
                    rows={4}
                    value={extractText}
                    onChange={(e) => setExtractText(e.target.value)}
                    placeholder="Paste publication text passage here..."
                    className="bg-stone-50/50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white leading-relaxed font-sans shadow-inner transition-all"
                  />

                  {extractSuccessMsg && (
                    <div className="text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-100 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      {extractSuccessMsg}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={extracting || !extractText.trim()}
                    className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white font-semibold py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {extracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing passage...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5" />
                        Run AI Ingestion
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Manual Node Creator */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-4 flex flex-col gap-3 shrink-0 shadow-sm" id="creator_node_card">
                <h4 className="text-xs font-serif font-semibold text-stone-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-stone-600" />
                  Insert Custom Entity
                </h4>

                <form onSubmit={handleAddNode} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Label / Name</label>
                    <input 
                      type="text" 
                      value={newNodeLabel}
                      onChange={(e) => setNewNodeLabel(e.target.value)}
                      placeholder="e.g. ImageNet-1K"
                      className="bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans font-medium shadow-inner transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Category Type</label>
                    <select 
                      value={newNodeType}
                      onChange={(e) => setNewNodeType(e.target.value)}
                      className="bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans shadow-inner transition-all"
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
                    <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Properties (JSON)</label>
                    <textarea 
                      rows={2}
                      value={newNodeProps}
                      onChange={(e) => setNewNodeProps(e.target.value)}
                      className="bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded p-2 text-[10px] font-mono text-stone-700 focus:outline-none shadow-inner transition-all"
                    />
                  </div>

                  {newNodeError && (
                    <span className="text-[9px] font-sans font-medium text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-100 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {newNodeError}
                    </span>
                  )}

                  <button 
                    type="submit"
                    disabled={!newNodeLabel.trim()}
                    className="bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:bg-stone-50/50 disabled:text-stone-300 text-stone-700 font-sans text-xs font-semibold py-2 rounded transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Insert Entity Node
                  </button>
                </form>
              </div>

              {/* Manual Edge Creator */}
              <div className="bg-white border border-stone-200/80 rounded-xl p-4 flex flex-col gap-3 shrink-0 shadow-sm" id="creator_relation_card">
                <h4 className="text-xs font-serif font-semibold text-stone-900 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-stone-600" />
                  Establish Association Link
                </h4>

                <form onSubmit={handleAddRelation} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Source Node</label>
                    <select 
                      value={newRelSourceId}
                      onChange={(e) => setNewRelSourceId(e.target.value)}
                      className="bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans shadow-inner transition-all"
                    >
                      <option value="">-- Choose Source Node --</option>
                      {graphData.nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.label} [{n.type}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Relationship Mode</label>
                    <select 
                      value={newRelType}
                      onChange={(e) => setNewRelType(e.target.value)}
                      className="bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans shadow-inner transition-all"
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
                    <label className="text-[9px] font-sans font-semibold uppercase text-stone-400 tracking-wider">Target Node</label>
                    <select 
                      value={newRelTargetId}
                      onChange={(e) => setNewRelTargetId(e.target.value)}
                      className="bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none font-sans shadow-inner transition-all"
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
                    className="bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:bg-stone-50/50 disabled:text-stone-300 text-stone-700 font-sans text-xs font-semibold py-2 rounded transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Establish Link
                  </button>
                </form>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
