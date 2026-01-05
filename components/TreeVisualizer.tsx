
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TreeNode } from '../types';

interface TreeVisualizerProps {
  data: TreeNode;
  onNodeClick: (node: TreeNode) => void;
}

const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear existing
    d3.select(svgRef.current).selectAll("*").remove();

    const nodeCount = data.children?.reduce((acc, curr) => acc + (curr.children?.length || 0), 0) || 0;
    const width = 1600; 
    const height = Math.max(1000, nodeCount * 28); 
    const margin = { top: 60, right: 250, bottom: 60, left: 180 };

    const svgMain = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    const g = svgMain.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<TreeNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    const root = d3.hierarchy(data);

    tree(root);

    // Links for Dark Mode
    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("stroke", "#334155") // Slate 700
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Nodes container
    const node = g.selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", d => `node ${d.children ? "node--internal" : "node--leaf"}`)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => onNodeClick(d.data))
      .style("cursor", "pointer");

    // Node circles for Dark Mode
    node.append("circle")
      .attr("r", d => d.data.type === 'root' ? 12 : d.data.type === 'company' ? 8 : 5)
      .attr("fill", d => d.data.type === 'root' ? '#3b82f6' : d.data.type === 'company' ? '#2563eb' : '#1e293b')
      .attr("stroke", d => d.data.type === 'contact' ? '#475569' : '#60a5fa')
      .attr("stroke-width", d => d.data.type === 'contact' ? 1.5 : 2.5);

    // Labels for Dark Mode
    // Halo (Darker background for readability)
    node.append("text")
      .attr("dy", "0.35em")
      .attr("x", d => d.children ? -18 : 18)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("fill", "#0f172a") // Matches background for contrast
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 5)
      .attr("stroke-linejoin", "round")
      .style("font-size", d => d.data.type === 'company' ? "15px" : "13px")
      .style("font-weight", "bold")
      .style("pointer-events", "none");

    // Foreground text
    node.append("text")
      .attr("dy", "0.35em")
      .attr("x", d => d.children ? -18 : 18)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("fill", d => {
        if (d.data.type === 'root') return "#f1f5f9";
        if (d.data.type === 'company') return "#93c5fd";
        return "#cbd5e1";
      })
      .style("font-family", "'Inter', sans-serif")
      .style("font-size", d => d.data.type === 'company' ? "15px" : "13px")
      .style("font-weight", d => d.data.type === 'company' ? "700" : "500")
      .style("pointer-events", "none");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 40]) 
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svgMain.call(zoom as any);

    const initialScale = 0.8;
    svgMain.call(zoom.transform as any, d3.zoomIdentity.translate(margin.left, margin.top).scale(initialScale));

  }, [data, onNodeClick]);

  return (
    <div className="relative w-full h-[750px] border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur-md p-4 rounded-xl text-xs border border-slate-700 shadow-xl max-w-[200px]">
        <p className="font-bold text-slate-100 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Advanced Navigation
        </p>
        <ul className="text-slate-400 space-y-2">
          <li>• <span className="font-bold text-blue-400">Mouse Wheel</span> for deep zoom (up to 40x)</li>
          <li>• <span className="font-bold text-blue-400">Drag</span> to move the map</li>
          <li>• <span className="font-bold text-blue-400">Click</span> nodes for details</li>
        </ul>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move" />
    </div>
  );
};

export default TreeVisualizer;
