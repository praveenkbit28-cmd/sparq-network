import React, { useState } from 'react';
import { Play, Activity, CheckCircle, RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import { StochasticQueueSimulator, SimulationSummary } from '../engine/stochasticSimulator';
import { calculateSharedResourceDelay } from '../engine/queueModels';

export const SimulationInspector: React.FC = () => {
  const [lambda, setLambda] = useState(65);
  const [mu, setMu] = useState(100);
  const [workloadR, setWorkloadR] = useState(1.0);
  const [modelType, setModelType] = useState<'SR' | 'GR'>('SR');
  const [sampleSize, setSampleSize] = useState(1000);

  // Compute theoretical delay
  const theoretical = calculateSharedResourceDelay(
    [{ commodityId: 'k1', flowRateFraction: 1.0, arrivalRateLambda: lambda, workloadRequirementR: workloadR }],
    mu,
    'k1'
  );

  const [simResult, setSimResult] = useState<SimulationSummary>(() =>
    StochasticQueueSimulator.simulateQueue(
      65,
      100,
      1.0,
      'SR',
      theoretical.expectedSojournDelayMs,
      1000
    )
  );

  const handleRunSimulation = () => {
    const theoreticalMs = theoretical.expectedSojournDelayMs;
    const res = StochasticQueueSimulator.simulateQueue(
      lambda,
      mu,
      workloadR,
      modelType,
      theoreticalMs,
      sampleSize
    );
    setSimResult(res);
  };

  return (
    <div id="simulation-inspector" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            A-Posteriori Stochastic Validation (Section VI & Appendix)
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Monte Carlo Discrete-Event Queue Simulator
          </h2>
          <p className="text-xs text-slate-500">
            Simulates actual Poisson request arrivals and exponential processing on shared hardware to validate analytical M/M/1 & M/G/1 formulas.
          </p>
        </div>

        <button
          id="btn-run-simulation"
          onClick={handleRunSimulation}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Run Monte Carlo Simulation ({sampleSize} Requests)
        </button>
      </div>

      {/* Simulator Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="text-slate-600 block mb-1">Queue Discipline</label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as any)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-medium"
          >
            <option value="SR">Shared-Resource (M/G/1)</option>
            <option value="GR">Guaranteed-Resource (M/M/1)</option>
          </select>
        </div>
        <div>
          <label className="text-slate-600 block mb-1">Arrival Rate Λ (req/s)</label>
          <input
            type="number"
            value={lambda}
            onChange={(e) => setLambda(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-900"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1">Service Rate μ (ops/s)</label>
          <input
            type="number"
            value={mu}
            onChange={(e) => setMu(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-900"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1">Workload R (units)</label>
          <input
            type="number"
            step="0.1"
            value={workloadR}
            onChange={(e) => setWorkloadR(Math.max(0.1, Number(e.target.value)))}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-900"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1">Sample Count</label>
          <select
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-medium"
          >
            <option value="500">500 Requests</option>
            <option value="1000">1,000 Requests</option>
            <option value="5000">5,000 Requests</option>
          </select>
        </div>
      </div>

      {/* Validation Comparison Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 block">Analytical Prediction E[D]:</span>
          <span className="text-base font-mono font-bold text-indigo-700">
            {simResult.theoreticalMeanSojournMs.toFixed(2)} ms
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Calculated via Eq. (11)</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 block">Empirical Mean Sojourn:</span>
          <span className="text-base font-mono font-bold text-emerald-700">
            {simResult.empiricalMeanSojournMs.toFixed(2)} ms
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Error: {simResult.relativeErrorPercent.toFixed(2)}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 block">99% Confidence Interval:</span>
          <span className="text-sm font-mono font-semibold text-slate-900">
            [{simResult.confidenceInterval99[0].toFixed(1)}, {simResult.confidenceInterval99[1].toFixed(1)}] ms
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">z = 2.576 sample bounds</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 block">95th Percentile Delay:</span>
          <span className="text-base font-mono font-bold text-amber-600">
            {simResult.percentile95Ms.toFixed(1)} ms
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">99th: {simResult.percentile99Ms.toFixed(1)} ms</span>
        </div>
      </div>

      {/* Discrete Event Sample Log Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
        <div className="bg-slate-100 px-3 py-2 font-semibold text-slate-700 flex justify-between items-center">
          <span>Stochastic Request Event Trace (First 15 of {simResult.totalPackets})</span>
          <span className="text-slate-500 font-mono text-[11px]">FCFS Non-Preemptive Queue</span>
        </div>
        <div className="max-h-[220px] overflow-y-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
              <tr>
                <th className="px-3 py-1.5">Req #</th>
                <th className="px-3 py-1.5">Arrival (s)</th>
                <th className="px-3 py-1.5">Queue Wait (ms)</th>
                <th className="px-3 py-1.5">Service (ms)</th>
                <th className="px-3 py-1.5">Total Sojourn (ms)</th>
                <th className="px-3 py-1.5">Departure (s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {simResult.packets.slice(0, 15).map((pkt) => (
                <tr key={pkt.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-1 text-slate-400">#{pkt.id}</td>
                  <td className="px-3 py-1">{pkt.arrivalTimeSec.toFixed(3)}s</td>
                  <td className="px-3 py-1 text-amber-700 font-semibold">{pkt.waitTimeMs.toFixed(1)}ms</td>
                  <td className="px-3 py-1 text-blue-700">{pkt.serviceTimeMs.toFixed(1)}ms</td>
                  <td className="px-3 py-1 font-bold text-slate-900">{pkt.sojournTimeMs.toFixed(1)}ms</td>
                  <td className="px-3 py-1 text-slate-500">{pkt.departureTimeSec.toFixed(3)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
