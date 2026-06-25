import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

interface Relation {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  properties: Record<string, any>;
}

interface InteractiveGraphProps {
  nodes: Node[];
  relations: Relation[];
  selectedNodeId: string | null;
  selectedRelationId: string | null;
  onSelectNode: (id: string) => void;
  onSelectRelation: (id: string) => void;
  onClearSelection: () => void;
}

const NODE_COLORS: Record<string, string> = {
  methodology: '#10b981', // emerald-500
  dataset: '#3b82f6',     // blue-500
  technology: '#f59e0b',  // amber-500
  institution: '#ec4899', // pink-500
  metric: '#8b5cf6',      // violet-500
  document: '#6366f1',    // indigo-500
  concept: '#14b8a6',     // teal-500
  core: '#f43f5e',        // rose-500
};

export const getNodeColor = (type: string) => {
  const norm = type?.toLowerCase() || 'concept';
  return NODE_COLORS[norm] || '#64748b'; // slate-500
};

export default function InteractiveGraph({
  nodes,
  relations,
  selectedNodeId,
  selectedRelationId,
  onSelectNode,
  onSelectRelation,
  onClearSelection,
}: InteractiveGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // 1. Dynamic ResizeObserver to handle container size changes responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current;

    let timeoutId: any = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;

      // Debounce layout updates to optimize performance on fast resize actions
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: width || parent.clientWidth || 800,
          height: height || parent.clientHeight || 500
        });
      }, 100);
    });

    resizeObserver.observe(parent);
    return () => {
      resizeObserver.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Re-run D3 simulation on state or dimensions change
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svgElement = svgRef.current;
    const width = dimensions.width;
    const height = dimensions.height;

    // Clear previous elements
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    // Define defs with filters & marker arrows
    const defs = svg.append('defs');

    // Marker definition for directed relation arrows
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28) // Offset from node center (radius is ~16-20)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#78716c'); // stone-500

    // Selected link marker
    defs.append('marker')
      .attr('id', 'arrow-selected')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#059669'); // emerald-600

    // Node glow shadow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');

    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Create the zoom/pan group wrapper
    const mainGroup = svg.append('g').attr('class', 'main-zoom-group');

    // Background grid
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
      .attr('d', 'M 40 0 L 0 0 0 40')
      .attr('fill', 'none')
      .attr('stroke', '#e7e5e4') // stone-200
      .attr('stroke-width', 1);

    // Render background grid rectangle
    mainGroup.append('rect')
      .attr('width', width * 5)
      .attr('height', height * 5)
      .attr('x', -width * 2)
      .attr('y', -height * 2)
      .attr('fill', 'url(#grid)')
      .style('opacity', 0.8);

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // If click happens directly on background, clear selection
    svg.on('click', (event) => {
      if (event.target === svgElement) {
        onClearSelection();
      }
    });

    // Clone data to avoid mutating original arrays
    const d3Nodes = nodes.map(n => ({ ...n }));
    const d3Links = relations.map(r => ({
      id: r.id,
      source: r.source_node_id,
      target: r.target_node_id,
      type: r.relation_type,
      properties: r.properties,
    })).filter(l => 
      d3Nodes.some(n => n.id === l.source) && d3Nodes.some(n => n.id === l.target)
    );

    // Create D3 Force Simulation
    const simulation = d3.forceSimulation<any, any>(d3Nodes)
      .force('link', d3.forceLink<any, any>(d3Links).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    // Render relationship links (edges)
    const linkGroup = mainGroup.append('g').attr('class', 'links-group');
    const link = linkGroup.selectAll('g')
      .data(d3Links)
      .enter().append('g')
      .attr('class', 'link-container cursor-pointer');

    // Hover background thicker line for easy clicking
    link.append('line')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 12);

    // True visual link line
    const linkLine = link.append('line')
      .attr('stroke', (d: any) => selectedRelationId === d.id ? '#059669' : '#d6d3d1') // emerald-600 or stone-300
      .attr('stroke-width', (d: any) => selectedRelationId === d.id ? 3 : 1.5)
      .attr('marker-end', (d: any) => selectedRelationId === d.id ? 'url(#arrow-selected)' : 'url(#arrow)')
      .attr('class', 'transition-all duration-150');

    // Click link to select/delete
    link.on('click', (event, d: any) => {
      event.stopPropagation();
      onSelectRelation(d.id);
    });

    // Relation type labels on links
    const linkLabel = mainGroup.append('g').attr('class', 'link-labels-group')
      .selectAll('g')
      .data(d3Links)
      .enter().append('g')
      .attr('class', 'pointer-events-none');

    linkLabel.append('rect')
      .attr('fill', '#ffffff') // white background for text card
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('stroke', '#e7e5e4') // stone-200 border
      .attr('stroke-width', 0.5)
      .style('opacity', 0.95);

    linkLabel.append('text')
      .attr('font-size', '8px')
      .attr('fill', '#78716c') // stone-500
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('class', 'font-sans uppercase tracking-wider')
      .text((d: any) => d.type);

    // Render node groups
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes-group');
    const node = nodeGroup.selectAll('g')
      .data(d3Nodes)
      .enter().append('g')
      .attr('class', 'node-item cursor-grab')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d: any) => {
        event.stopPropagation();
        onSelectNode(d.id);
      });

    // Dynamic color coding node circle
    node.append('circle')
      .attr('r', 18)
      .attr('fill', (d: any) => getNodeColor(d.type))
      .attr('stroke', (d: any) => selectedNodeId === d.id ? '#059669' : '#ffffff') // emerald-600 or white border
      .attr('stroke-width', (d: any) => selectedNodeId === d.id ? 3 : 2)
      .attr('filter', (d: any) => selectedNodeId === d.id ? 'url(#glow)' : null)
      .attr('class', 'transition-all duration-150 shadow-sm');

    // Node visual initial/badge text
    node.append('text')
      .attr('dy', '.3em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('class', 'pointer-events-none select-none font-sans')
      .text((d: any) => d.label.substring(0, 2).toUpperCase());

    // Label text elements
    const labelGroup = node.append('g')
      .attr('class', 'pointer-events-none');

    // Label background pill to make it extremely readable
    labelGroup.append('rect')
      .attr('fill', '#ffffff')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('y', 24)
      .style('opacity', 0.95)
      .attr('stroke', '#e7e5e4')
      .attr('stroke-width', 0.5);

    const labelText = labelGroup.append('text')
      .attr('y', 31)
      .attr('text-anchor', 'middle')
      .attr('fill', '#292524') // stone-800
      .attr('font-size', '9px')
      .attr('font-weight', 'semibold')
      .attr('class', 'select-none font-sans')
      .text((d: any) => d.label.length > 16 ? d.label.substring(0, 14) + '...' : d.label);

    // Adjust label background rect bounds
    labelText.each(function (this: any) {
      const bbox = this.getBBox();
      const padX = 6;
      const padY = 4;
      d3.select(this.parentNode).select('rect')
        .attr('x', bbox.x - padX)
        .attr('width', bbox.width + (padX * 2))
        .attr('y', bbox.y - padY / 2)
        .attr('height', bbox.height + padY);
    });

    // Update coordinates on tick
    simulation.on('tick', () => {
      // Line paths
      linkLine
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      link.selectAll('line').filter(function(this: any, d: any, i) { return i === 0; })
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      // Label rect placement
      linkLabel
        .attr('transform', (d: any) => {
          const x = (d.source.x + d.target.x) / 2;
          const y = (d.source.y + d.target.y) / 2;
          return `translate(${x}, ${y})`;
        });

      // Fit label background rect on links
      linkLabel.each(function (this: any) {
        const text = d3.select(this).select('text');
        const rect = d3.select(this).select('rect');
        const textNode = text.node() as any;
        if (textNode) {
          const bbox = textNode.getBBox();
          const pad = 3;
          rect
            .attr('x', bbox.x - pad)
            .attr('width', bbox.width + pad * 2)
            .attr('y', bbox.y - pad / 2)
            .attr('height', bbox.height + pad);
        }
      });

      // Node coordinates
      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Drag handlers
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.2).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).attr('class', 'node-item cursor-grabbing');
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(this).attr('class', 'node-item cursor-grab');
    }

    // Recenter initially if nodes exist
    if (d3Nodes.length > 0) {
      setTimeout(() => {
        // center visual camera slightly with a smooth zoom transition
        svg.transition().duration(500).call(
          zoom.transform,
          d3.zoomIdentity.translate(0, 0).scale(1)
        );
      }, 100);
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, relations, selectedNodeId, selectedRelationId, dimensions]);

  // Stage camera controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(
      zoomBehaviorRef.current.scaleBy,
      1.3
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(
      zoomBehaviorRef.current.scaleBy,
      0.7
    );
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity
    );
  };

  return (
    <div className="relative w-full h-full bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden shadow-inner" ref={containerRef}>
      {/* Visual Canvas stage */}
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none"
        style={{ cursor: 'crosshair' }}
      />

      {/* Floating Canvas Camera controls */}
      <div className="absolute bottom-4 right-4 bg-white/95 border border-stone-200 p-1.5 rounded-lg flex items-center gap-1 shadow-md z-20">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 hover:bg-stone-50 rounded text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 hover:bg-stone-50 rounded text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-stone-200 mx-1" />
        <button
          onClick={handleResetZoom}
          title="Reset View"
          className="p-1.5 hover:bg-stone-50 rounded text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Aesthetic Legend Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 border border-stone-200 p-3 rounded-lg flex flex-col gap-1.5 pointer-events-none max-w-xs z-10 shadow-sm">
        <h4 className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-1 mb-1">
          Entity Schema
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-stone-600 capitalize font-medium">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
