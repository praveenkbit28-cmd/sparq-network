import React from 'react';
import {
  Layers,
  Activity,
  Cpu,
  BookOpen,
  Sparkles,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Code,
} from 'lucide-react';
import { OptimizationResult } from '../types/sparq';

export type ActiveTab = 'overview' | 'expA' | 'expB' | 'equations' | 'burstgpt' | 'simulation' | 'java';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  result: OptimizationResult | null;
  onRunSparq: () => void;
  isOptimizing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  result,
  onRunSparq,
  isOptimizing,
}) => {
  const tabs = [
    { id: 'overview', label: 'Topology & DAG', icon: Layers },
    { id: 'expA', label: 'Exp A: LLM + STT (Figs 6-9)', icon: Activity },
    { id: 'expB', label: 'Exp B: FANTASIA AR (Figs 10-13)', icon: Sparkles },
    { id: 'equations', label: 'Equations & Formulation', icon: BookOpen },
    { id: 'burstgpt', label: 'BurstGPT Validation (Figs 14-16)', icon: BarChart2 },
    { id: 'simulation', label: 'Monte Carlo Queue Sim', icon: Cpu },
    { id: 'java', label: 'Java 17 Codebase & Demo', icon: Code },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">SPARQ Framework</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono">
                IEEE TNSM 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Queue-Aware Service Placement, Routing & Resource Allocation Under Non-Linear Delays
            </p>
          </div>
        </div>

        {/* Global Action & Summary Stats */}
        <div className="flex items-center gap-3 text-xs">
          {result && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">COST:</span>
                <span className="font-bold text-emerald-400">${result.totalCost.toFixed(0)}/hr</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] block">MAX DELAY:</span>
                <span className="font-bold text-slate-200">{result.maxSojournDelayMs.toFixed(1)}ms</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] block">STATUS:</span>
                <span className={`font-bold ${result.isFeasible ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.isFeasible ? 'FEASIBLE' : 'VIOLATION'}
                </span>
              </div>
            </div>
          )}

          <button
            id="btn-run-sparq-header"
            onClick={onRunSparq}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Solving Algorithm 1...' : 'Run SPARQ Optimizer'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto border-t border-slate-800 flex space-x-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
