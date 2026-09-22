import React from 'react';
import { OptimizationResult } from '../types/sparq';
import { CheckCircle2, RefreshCw, Terminal, Layers } from 'lucide-react';

interface AlgorithmStepTrackerProps {
  result: OptimizationResult;
}

export const AlgorithmStepTracker: React.FC<AlgorithmStepTrackerProps> = ({ result }) => {
  return (
    <div id="algorithm-step-tracker" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            SPARQ Algorithm 1 Execution & Convergence Trace
          </h3>
          <p className="text-xs text-slate-500">
            Decomposes Problem P into alternating convex sub-problems P1 and P2 with diminishing step size γ_i and adaptive safety factor ε(i)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
            Time: {result.executionTimeMs.toFixed(1)} ms
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono">
            {result.iterationsCount} Iterations
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
            <tr>
              <th className="px-3 py-2">Iter (i)</th>
              <th className="px-3 py-2">Step Size (γ_i)</th>
              <th className="px-3 py-2">Safety Factor (ε_i)</th>
              <th className="px-3 py-2">Avg Utilization (ρ)</th>
              <th className="px-3 py-2">RMSE Error</th>
              <th className="px-3 py-2">Cost ($/hr)</th>
              <th className="px-3 py-2">Decisions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {result.iterationHistory.map((iter) => (
              <tr key={iter.iteration} className="hover:bg-slate-50/70">
                <td className="px-3 py-1.5 font-bold text-indigo-700">#{iter.iteration}</td>
                <td className="px-3 py-1.5 text-amber-700">{iter.gamma.toFixed(3)}</td>
                <td className="px-3 py-1.5 text-emerald-700">{iter.epsilon.toFixed(3)}</td>
                <td className="px-3 py-1.5">{(iter.utilizationAvg * 100).toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-slate-500">{iter.rmse.toFixed(3)}</td>
                <td className="px-3 py-1.5 font-semibold text-slate-900">${iter.totalCost.toFixed(0)}</td>
                <td className="px-3 py-1.5 text-[11px]">
                  {iter.edgeNodeActive && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded mr-1">Edge On</span>
                  )}
                  {iter.ueNodeActive && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">UE Offloaded</span>
                  )}
                  {!iter.edgeNodeActive && !iter.ueNodeActive && (
                    <span className="text-slate-400">Cloud Centralized</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong>IDAGO Bi-Criteria Rounding Complete:</strong> Continuous flow variables were successfully
          rounded to integer values {'{0, 1}'} while satisfying flow conservation (a1)-(a5) and guaranteeing theoretical bi-criteria bounds.
        </div>
      </div>
    </div>
  );
};
