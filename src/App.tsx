import React, { useState, useMemo } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { NetworkGraphView } from './components/NetworkGraphView';
import { ServiceGraphView } from './components/ServiceGraphView';
import { ExperimentAView } from './components/ExperimentAView';
import { ExperimentBView } from './components/ExperimentBView';
import { EquationsExplorer } from './components/EquationsExplorer';
import { BurstGptValidationView } from './components/BurstGptValidationView';
import { SimulationInspector } from './components/SimulationInspector';
import { AlgorithmStepTracker } from './components/AlgorithmStepTracker';
import { JavaStudioView } from './components/JavaStudioView';
import { EXPERIMENT_A_PRESET, EXPERIMENT_B_PRESET, ExperimentPreset } from './engine/scenarios';
import { SparqOptimizer } from './engine/sparqOptimizer';
import { OptimizationResult, NetworkNode } from './types/sparq';
import {
  Layers,
  Cpu,
  Server,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activePreset, setActivePreset] = useState<ExperimentPreset>(EXPERIMENT_A_PRESET);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // Run initial optimization
  const [result, setResult] = useState<OptimizationResult | null>(() => {
    const opt = new SparqOptimizer(
      EXPERIMENT_A_PRESET.nodes,
      EXPERIMENT_A_PRESET.links,
      EXPERIMENT_A_PRESET.serviceGraph
    );
    return opt.solve({ algorithm: 'SPARQ' });
  });

  // Handle running SPARQ
  const handleRunSparq = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const opt = new SparqOptimizer(
        activePreset.nodes,
        activePreset.links,
        activePreset.serviceGraph
      );
      const res = opt.solve({ algorithm: 'SPARQ' });
      setResult(res);
      setIsOptimizing(false);
    }, 250);
  };

  // Handle switching preset
  const handleSelectPreset = (preset: ExperimentPreset) => {
    setActivePreset(preset);
    const opt = new SparqOptimizer(preset.nodes, preset.links, preset.serviceGraph);
    const res = opt.solve({ algorithm: 'SPARQ' });
    setResult(res);
    setSelectedNode(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        result={result}
        onRunSparq={handleRunSparq}
        isOptimizing={isOptimizing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab 1: Overview (Topology + Service Graph + Queue Inspector + Algorithm Tracker) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Scenario selector strip */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Scenario Topology
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{activePreset.name}</div>
                <div className="text-xs text-slate-500">{activePreset.subtitle}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-preset-exp-a"
                  onClick={() => handleSelectPreset(EXPERIMENT_A_PRESET)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activePreset.id === 'exp-a'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Experiment A (LLM + STT)
                </button>
                <button
                  id="btn-preset-exp-b"
                  onClick={() => handleSelectPreset(EXPERIMENT_B_PRESET)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activePreset.id === 'exp-b'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Experiment B (FANTASIA AR)
                </button>
              </div>
            </div>

            {/* Network Topology & Service Graph */}
            <div className="grid grid-cols-1 gap-6">
              <NetworkGraphView
                nodes={activePreset.nodes}
                links={activePreset.links}
                result={result}
                onSelectNode={(node) => setSelectedNode(node)}
              />

              <ServiceGraphView
                serviceGraph={activePreset.serviceGraph}
                result={result}
              />
            </div>

            {/* Queue Metrics Inspector Table */}
            {result && result.queueEvaluations.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      Queue Sojourn & Utilization Metrics (Equations 1 & 11)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluated expected waiting time E[W], service time E[X], and sojourn delay E[D] across all physical and augmented queues
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono rounded">
                    {result.queueEvaluations.length} Evaluated Queues
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Queue / Link</th>
                        <th className="px-3 py-2">Discipline</th>
                        <th className="px-3 py-2">Resource</th>
                        <th className="px-3 py-2">Arrival (Λ)</th>
                        <th className="px-3 py-2">Service (μ)</th>
                        <th className="px-3 py-2">Utilization (ρ)</th>
                        <th className="px-3 py-2">Waiting E[W]</th>
                        <th className="px-3 py-2">Service E[X]</th>
                        <th className="px-3 py-2">Sojourn E[D]</th>
                        <th className="px-3 py-2">Stability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {result.queueEvaluations.map((q, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2 font-semibold text-slate-900">{q.name}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                q.model === 'SR'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {q.model === 'SR' ? 'SR (M/G/1)' : 'GR (M/M/1)'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{q.resourceType}</td>
                          <td className="px-3 py-2">{q.arrivalRateLambda.toFixed(1)}/s</td>
                          <td className="px-3 py-2">{q.serviceRateMu.toFixed(1)}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            {(q.utilizationRho * 100).toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-amber-700">{q.expectedWaitTimeMs.toFixed(1)} ms</td>
                          <td className="px-3 py-2 text-blue-700">{q.expectedServiceTimeMs.toFixed(1)} ms</td>
                          <td className="px-3 py-2 font-bold text-indigo-900">
                            {q.expectedSojournDelayMs.toFixed(1)} ms
                          </td>
                          <td className="px-3 py-2">
                            {q.isStable ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Stable
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Overloaded
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Algorithm Step Tracker */}
            {result && <AlgorithmStepTracker result={result} />}
          </div>
        )}

        {/* Tab 2: Experiment A */}
        {activeTab === 'expA' && <ExperimentAView />}

        {/* Tab 3: Experiment B */}
        {activeTab === 'expB' && <ExperimentBView />}

        {/* Tab 4: Equations & Mathematical Formulation */}
        {activeTab === 'equations' && <EquationsExplorer />}

        {/* Tab 5: BurstGPT Validation */}
        {activeTab === 'burstgpt' && <BurstGptValidationView />}

        {/* Tab 6: Monte Carlo Stochastic Simulation */}
        {activeTab === 'simulation' && <SimulationInspector />}

        {/* Tab 7: Java 17 Reference Implementation Studio */}
        {activeTab === 'java' && <JavaStudioView />}
      </main>

      {/* Footer Citation */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Based on IEEE Transactions on Network and Service Management (TNSM 2026):{' '}
          <strong className="text-slate-800">
            "SPARQ: An Optimization Framework for the Distribution of AI-Intensive Applications Under Non-Linear Delay Constraints"
          </strong>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Authors: P. Spadaccino, P. Di Lorenzo, S. Barbarossa, A. M. Tulino, J. Llorca
        </div>
      </footer>
    </div>
  );
}
