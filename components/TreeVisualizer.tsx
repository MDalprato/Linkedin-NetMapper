
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

    const width = 1200;
    const height = 800;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<TreeNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    const root = d3.hierarchy(data);

    tree(root);

    // Links
    svg.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Nodes
    const node = svg.selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", d => `node ${d.children ? "node--internal" : "node--leaf"}`)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => onNodeClick(d.data))
      .style("cursor", "pointer");

    node.append("circle")
      .attr("r", d => d.data.type === 'root' ? 10 : d.data.type === 'company' ? 6 : 4)
      .attr("fill", d => d.data.type === 'root' ? '#0a66c2' : d.data.type === 'company' ? '#70b5f9' : '#fff');

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -10 : 10)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    // Zoom and Pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        svg.attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom as any);

  }, [data, onNodeClick]);

  return (
    <div className="relative w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur p-2 rounded-md text-xs border border-gray-100">
        <p className="font-semibold text-gray-700">Navigation</p>
        <p className="text-gray-500">Scroll to zoom • Click and drag to pan</p>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default TreeVisualizer;
