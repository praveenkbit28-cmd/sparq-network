import React from 'react';
import { ServiceGraphDAG, OptimizationResult } from '../types/sparq';
import { GitFork, CheckCircle, AlertTriangle, ArrowRight, Layers } from 'lucide-react';

interface ServiceGraphViewProps {
  serviceGraph: ServiceGraphDAG;
  result?: OptimizationResult | null;
}

export const ServiceGraphView: React.FC<ServiceGraphViewProps> = ({ serviceGraph, result }) => {
  return (
    <div id="service-graph-container" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            Service Function Chain (SFC) DAG & Commodity Flow Paths
          </h2>
          <p className="text-xs text-slate-500">
            Directed Acyclic Graph (DAG) representing service dependencies, task placement, and latency deadlines (Section II)
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded-md">
          {serviceGraph.commodities.length} Commodities | {serviceGraph.functions.length} AI Functions
        </span>
      </div>

      {/* Grid of Commodities in DAG */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {serviceGraph.commodities.map((comm) => {
          const pathInfo = result?.commodityPaths?.[comm.id];
          const fn = serviceGraph.functions.find((f) => f.id === comm.functionId);
          const meetsDeadline = pathInfo ? pathInfo.meetsDeadline : true;
          const isSource = comm.isSource;
          const isDest = comm.isDestination;

          return (
            <div
              key={comm.id}
              className={`p-3.5 rounded-lg border text-xs transition-all ${
                pathInfo && !meetsDeadline
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {comm.id}
                </span>
                {pathInfo && (
                  <span
                    className={`flex items-center gap-1 font-semibold ${
                      meetsDeadline ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {meetsDeadline ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {meetsDeadline ? 'Valid' : 'Violated'}
                  </span>
                )}
              </div>

              <div className="text-slate-700 font-medium truncate mb-2">{comm.name}</div>

              {fn && (
                <div className="mb-2 p-2 bg-white rounded border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    AI Service Task
                  </span>
                  <span className="font-semibold text-indigo-900 block truncate">{fn.name}</span>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>Model: {fn.defaultResourceModel}</span>
                    <span>•</span>
                    <span>Placed: <strong className="text-slate-800">{pathInfo?.placedNodeId || 'Cloud'}</strong></span>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Arrival Rate (Λ):</span>
                  <span className="font-mono font-semibold">{comm.arrivalRateLambda} req/s</span>
                </div>
                {comm.inputCommodities.length > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Input Dep X(k):</span>
                    <span className="font-mono">{comm.inputCommodities.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Deadline (L^k):</span>
                  <span className="font-mono font-semibold text-slate-800">{comm.maxLatencyDeadlineMs} ms</span>
                </div>
                {pathInfo && (
                  <div className="pt-1.5 mt-1 border-t border-slate-200 flex justify-between font-bold">
                    <span>Cumulative Latency (l_T):</span>
                    <span
                      className={`font-mono ${
                        meetsDeadline ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {pathInfo.cumulativeDagDelayMs.toFixed(1)} ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
