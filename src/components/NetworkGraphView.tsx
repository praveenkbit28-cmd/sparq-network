import React, { useState } from 'react';
import { NetworkNode, NetworkLink, OptimizationResult } from '../types/sparq';
import { Server, Cpu, Radio, Laptop, HardDrive, Zap, Info, ShieldAlert } from 'lucide-react';

interface NetworkGraphViewProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  result?: OptimizationResult | null;
  onSelectNode?: (node: NetworkNode) => void;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  nodes,
  links,
  result,
  onSelectNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Helper for node icon
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return Laptop;
      case 'ROUTER':
        return Radio;
      case 'EDGE':
        return Zap;
      case 'CLOUD':
        return Server;
      case 'UE':
        return HardDrive;
      default:
        return Cpu;
    }
  };

  // Find functions placed on this node
  const getHostedFunctions = (nodeId: string): string[] => {
    if (!result?.placedNodes) return [];
    return Object.entries(result.placedNodes)
      .filter(([_, nId]) => nId === nodeId)
      .map(([fnId]) => fnId);
  };

  return (
    <div id="network-graph-container" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Distributed Edge-Cloud Physical & Augmented Infrastructure
          </h2>
          <p className="text-xs text-slate-500">
            Interactive topology visualization with queue discipline badges (GR vs SR) and active AI placements
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            GR Model (M/M/1 Dedicated)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            SR Model (M/G/1 Shared)
          </span>
        </div>
      </div>

      {/* SVG Canvas for Network Graph */}
      <div className="relative w-full h-[380px] bg-slate-900/95 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg className="w-full h-full" viewBox="0 0 760 360">
          <defs>
            {/* Gradients */}
            <linearGradient id="linkGradSR" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="linkGradGR" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0.7" />
            </linearGradient>
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Links / Channels */}
          {links.map((link) => {
            const src = nodes.find((n) => n.id === link.source);
            const tgt = nodes.find((n) => n.id === link.target);
            if (!src || !tgt) return null;

            const isSR = link.resourceModel === 'SR';
            const strokeColor = isSR ? '#f59e0b' : '#6366f1';
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={link.id} className="transition-all duration-300">
                {/* Main Link Line */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={strokeColor}
                  strokeWidth={isSR ? 3 : 2.5}
                  strokeDasharray={isSR ? '6,3' : undefined}
                  className="opacity-75 hover:opacity-100"
                />

                {/* Animated Flow Pulse */}
                <circle r="3.5" fill={isSR ? '#fbbf24' : '#818cf8'}>
                  <animateMotion
                    path={`M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`}
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Link label badge */}
                <g transform={`translate(${midX}, ${midY - 10})`}>
                  <rect
                    x="-32"
                    y="-10"
                    width="64"
                    height="18"
                    rx="4"
                    fill="#1e293b"
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {link.resourceModel} | {link.propagationDelayMs}ms
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const hostedFns = getHostedFunctions(node.id);
            const isHosting = hostedFns.length > 0;
            const isEdge = node.type === 'EDGE';
            const isCloud = node.type === 'CLOUD';
            const isUser = node.type === 'USER' || node.type === 'UE';

            let nodeColor = '#3b82f6';
            if (isCloud) nodeColor = '#10b981';
            if (isEdge) nodeColor = '#f59e0b';
            if (isUser) nodeColor = '#8b5cf6';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (onSelectNode) onSelectNode(node);
                }}
                className="cursor-pointer group"
              >
                {/* Outer halo when selected or active */}
                {(isSelected || isHosting) && (
                  <circle
                    r="32"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    className="animate-spin-slow opacity-80"
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  r="24"
                  fill="#0f172a"
                  stroke={isSelected ? '#ffffff' : nodeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-transform group-hover:scale-110"
                />

                {/* Node Type Label inside */}
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {node.type}
                </text>

                {/* Name Label underneath */}
                <text
                  y="38"
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="11"
                  fontWeight="600"
                >
                  {node.name}
                </text>

                {/* Hosting AI functions pill */}
                {isHosting && (
                  <g transform="translate(0, -32)">
                    <rect
                      x="-48"
                      y="-8"
                      width="96"
                      height="16"
                      rx="8"
                      fill="#38bdf8"
                      stroke="#0284c7"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {hostedFns.length === 1 ? hostedFns[0].replace('fn-', '') : `${hostedFns.length} Tasks`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Bar */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold">
              {selectedNode.type}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{selectedNode.name}</div>
              <div className="text-slate-500">Node ID: <span className="font-mono">{selectedNode.id}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {selectedNode.resources.GPU_VRAM && (
              <div>
                <span className="text-slate-500 block">GPU VRAM Capacity:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedNode.resources.GPU_VRAM.capacity} units (c = {selectedNode.resources.GPU_VRAM.costPerUnit}x)
                </span>
              </div>
            )}
            {selectedNode.resources.CPU && (
              <div>
                <span className="text-slate-500 block">CPU Capacity:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedNode.resources.CPU.capacity} units (c = {selectedNode.resources.CPU.costPerUnit}x)
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Hosted AI Functions:</span>
              <span className="font-mono font-semibold text-indigo-700">
                {getHostedFunctions(selectedNode.id).join(', ') || 'Idle / In Transit'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
