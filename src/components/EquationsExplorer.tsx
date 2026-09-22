import React, { useState } from 'react';
import { BookOpen, Calculator, Layers, Cpu, Network, CheckCircle2, ShieldCheck } from 'lucide-react';
import { calculateGuaranteedResourceDelay, calculateSharedResourceDelay, calculateConvexifiedEpsilonUpperBound } from '../engine/queueModels';

export const EquationsExplorer: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'queue' | 'pk' | 'convex' | 'problem' | 'algo'>('queue');

  // Interactive sandbox values
  const [lambda, setLambda] = useState(60); // req/s
  const [mu, setMu] = useState(100); // units/s
  const [workloadR, setWorkloadR] = useState(1.0);
  const [workloadR2, setWorkloadR2] = useState(2.0);
  const [lambda2, setLambda2] = useState(20);
  const [epsilon, setEpsilon] = useState(0.2);

  // Compute live sandbox values
  const grResult = calculateGuaranteedResourceDelay(1.0, lambda, workloadR, mu);
  const srResult = calculateSharedResourceDelay(
    [
      { commodityId: 'k1', flowRateFraction: 1.0, arrivalRateLambda: lambda, workloadRequirementR: workloadR },
      { commodityId: 'k2', flowRateFraction: 1.0, arrivalRateLambda: lambda2, workloadRequirementR: workloadR2 },
    ],
    mu,
    'k1'
  );
  const convexResult = calculateConvexifiedEpsilonUpperBound(
    [
      { commodityId: 'k1', flowRateFraction: 1.0, arrivalRateLambda: lambda, workloadRequirementR: workloadR },
      { commodityId: 'k2', flowRateFraction: 1.0, arrivalRateLambda: lambda2, workloadRequirementR: workloadR2 },
    ],
    mu,
    epsilon,
    'k1'
  );

  return (
    <div id="equations-explorer-container" className="space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'queue', label: '1. GR Model (M/M/1)', icon: Cpu },
          { id: 'pk', label: '2. SR Model (Pollaczek-Khinchine M/G/1)', icon: Network },
          { id: 'convex', label: '3. ε-Safety Convexification', icon: ShieldCheck },
          { id: 'problem', label: '4. Optimization Problem P', icon: Layers },
          { id: 'algo', label: '5. SPARQ Algorithm 1 Steps', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-equation-${tab.id}`}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Parameter Sandbox for Formulas */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Live Mathematical Parameter Sandbox</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Dynamic queue metrics evaluation</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-slate-600 block mb-1">λ₁ Arrival (req/s)</label>
            <input
              type="number"
              value={lambda}
              onChange={(e) => setLambda(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">λ₂ Arrival (req/s)</label>
            <input
              type="number"
              value={lambda2}
              onChange={(e) => setLambda2(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">μ Service Rate</label>
            <input
              type="number"
              value={mu}
              onChange={(e) => setMu(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">R₁ Workload / req</label>
            <input
              type="number"
              step="0.1"
              value={workloadR}
              onChange={(e) => setWorkloadR(Math.max(0.1, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">R₂ Workload / req</label>
            <input
              type="number"
              step="0.1"
              value={workloadR2}
              onChange={(e) => setWorkloadR2(Math.max(0.1, Number(e.target.value)))}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">ε Safety Margin</label>
            <input
              type="number"
              step="0.05"
              value={epsilon}
              onChange={(e) => setEpsilon(Math.min(0.95, Math.max(0.01, Number(e.target.value))))}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-mono text-slate-900"
            />
          </div>
        </div>

        {/* Live calculated outputs comparison */}
        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-slate-500 font-medium block">GR M/M/1 Sojourn E[D₁]:</span>
            <span className="text-sm font-mono font-bold text-indigo-700">
              {grResult.isStable ? `${grResult.sojournTimeMs.toFixed(2)} ms` : 'UNSTABLE (ρ ≥ 1)'}
            </span>
            <span className="text-slate-400 block mt-0.5 font-mono">ρ = {(grResult.utilization * 100).toFixed(1)}%</span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-slate-500 font-medium block">SR M/G/1 Sojourn E[D₁]:</span>
            <span className="text-sm font-mono font-bold text-amber-700">
              {srResult.isStable ? `${srResult.expectedSojournDelayMs.toFixed(2)} ms` : 'UNSTABLE (ρ ≥ 1)'}
            </span>
            <span className="text-slate-400 block mt-0.5 font-mono">
              Wait: {srResult.expectedWaitTimeMs.toFixed(1)}ms | ρ = {(srResult.utilization * 100).toFixed(1)}%
            </span>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-slate-500 font-medium block">ε-Safety Convex Upper Bound:</span>
            <span className="text-sm font-mono font-bold text-emerald-700">
              {convexResult.toFixed(2)} ms
            </span>
            <span className="text-slate-400 block mt-0.5 font-mono">Gap: +{(convexResult - srResult.expectedSojournDelayMs).toFixed(1)}ms</span>
          </div>
        </div>
      </div>

      {/* Detail card per tab */}
      {activeCategory === 'queue' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Guaranteed-Resource (GR) Model & Equations</h2>
              <p className="text-sm text-slate-500">Dedicated resource slicing with independent M/M/1 queues (Section III-A)</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              Eq. (1), (12), (13)
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
            <div className="text-indigo-400 mb-1">// Equation (1): Expected Sojourn Time for Dedicated Queue</div>
            <div>
              E[D_uv^k] = 1 / (ν_uv^k - λ_uv^k) = R_uv^k / ( μ_uv^{"{k,r}"} - f_uv^k · Λ^φ(k) · R_uv^k )
            </div>
            <div className="text-indigo-400 mt-4 mb-1">// Equation (12) & (13): Multi-Resource Bottleneck on Computation Node</div>
            <div>
              E[D_uv^{"{k,r}"}] = R_uv^{"{k,r}"} / ( μ_uv^{"{k,r}"} - f_uv^k · Λ^φ(k) · R_uv^{"{k,r}"} )
            </div>
            <div className="mt-1">
              E[D_uv^k] = E[ max_{"{r ∈ R}"} D_uv^{"{k,r}"} ] ≥ max_{"{r ∈ R}"} E[D_uv^{"{k,r}"}]  (Jensen's Inequality)
            </div>
          </div>

          <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
            <p>
              <strong>Physical System Meaning:</strong> In the Guaranteed-Resource (GR) model, computational resources are
              isolated and reserved per container or network slice (e.g. CPU core pinning, dedicated cloud bandwidth, or fixed VRAM slices).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>R_uv^k:</strong> Resource requirement per request (e.g., cycles/req, bits/req).</li>
              <li><strong>μ_uv^{"{k,r}"}:</strong> Dedicated service rate allocated specifically to commodity <em>k</em> on resource <em>r</em>.</li>
              <li><strong>Independence:</strong> Delays experienced by commodity <em>k</em> are unaffected by traffic fluctuations in other commodities.</li>
            </ul>
          </div>
        </div>
      )}

      {activeCategory === 'pk' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Shared-Resource (SR) Model & Pollaczek-Khinchine Formula</h2>
              <p className="text-sm text-slate-500">M/G/1 queueing dynamics on unpartitioned resources like GPUs (Section III-B)</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              Eq. (2) - (11), (14)
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto space-y-3">
            <div>
              <span className="text-amber-400">// Eq. (3) & (4): First and Second Moments of Service Time</span>
              <div>E[X_uv^k] = R_uv^k / μ_uv</div>
              <div>E[(X_uv^k)²] = 2 · (R_uv^k / μ_uv)²</div>
            </div>

            <div>
              <span className="text-amber-400">// Eq. (9): Aggregate Second Moment Across All Interleaved Commodities</span>
              <div>E[(X_uv)²] = 2 · ∑_{"{k ∈ K}"} ( (f_uv^k · Λ^φ(k)) / μ_uv ) · ( R_uv^k / μ_uv )²</div>
            </div>

            <div>
              <span className="text-amber-400">// Eq. (10): Shared Resource Utilization Factor</span>
              <div>ρ_uv = ∑_{"{k ∈ K}"} ρ_uv^k = (1 / μ_uv) · ∑_{"{k ∈ K}"} f_uv^k · Λ^φ(k) · R_uv^k</div>
            </div>

            <div>
              <span className="text-amber-400">// Eq. (5) & (11): Expected Waiting Time E[W] and Total Sojourn Time E[D]</span>
              <div>E[W_uv] = ( λ_uv · E[X_uv²] ) / ( 2 · (1 - ρ_uv) )</div>
              <div className="text-emerald-300 font-bold">
                E[D_uv^k] = [ ∑_{"{j ∈ K}"} f_uv^j · Λ^φ(j) · (R_uv^j)² ] / [ μ_uv · ( μ_uv - ∑_{"{j ∈ K}"} f_uv^j · Λ^φ(j) · R_uv^j ) ] + ( R_uv^k / μ_uv )
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
            <p>
              <strong>Why This Matters for AI Inference:</strong> When large AI models (such as LLMs or vision transformers) execute on a GPU,
              they occupy VRAM and cannot easily context-switch per token without massive I/O penalties. Requests from multiple services compete
              for the same physical hardware queue, making delays non-linear and interdependent.
            </p>
          </div>
        </div>
      )}

      {activeCategory === 'convex' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">ε-Safety Margin & Convexification Framework</h2>
              <p className="text-sm text-slate-500">Transforming intractable non-convex delay constraints into solvable convex upper bounds (Section V-A)</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Eq. (16), (17), (18)
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto space-y-3">
            <div>
              <span className="text-emerald-400">// Eq. (16) & (17): Utilization Bound with ε-Safety Parameter</span>
              <div>ρ_uv ≤ 1 - ε_uv^r,    ε_uv^r ∈ [0, 1]</div>
              <div>(1 - ε_uv^r) · μ_uv^r ≥ ∑_{"{k ∈ K}"} f_uv^k · Λ^φ(k) · R_uv^{"{k,r}"}</div>
            </div>

            <div>
              <span className="text-emerald-400">// Eq. (18): Convexified Upper Bound Formulation</span>
              <div className="text-emerald-300 font-bold">
                E[D̄_uv^{"{k,r}"}(f, μ, ε)] ≤ [ ∑_{"{j ∈ K}"} f_uv^j · Λ^φ(j) · (R_uv^{"{j,r}"})² ] / [ ε_uv^r · (μ_uv^r)² ] + ( R_uv^{"{k,r}"} / μ_uv^r )
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
            <p>
              <strong>Mathematical Insight:</strong> Direct optimization of Eq. (11) is non-convex and NP-hard.
              By bounding utilization to (1 - ε), Eq. (18) becomes jointly convex in flow variables <em>f</em> when rate <em>μ</em> is fixed,
              and convex in <em>μ</em> when <em>f</em> is fixed.
            </p>
            <p>
              The safety factor ε is updated iteratively via <code>ε(i+1) = γ_i · ε(i) + (1 - γ_i) · (1 - ρ(i))</code>, tightening the gap
              between the upper bound and the true queueing delay at every step!
            </p>
          </div>
        </div>
      )}

      {activeCategory === 'problem' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Optimization Problem Formulation (Problem P)</h2>
              <p className="text-sm text-slate-500">Joint service placement, flow routing, and resource allocation (Section IV)</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-white rounded-full">
              Eq. (P) & Constraints (a1)-(e4)
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto space-y-3">
            <div className="text-amber-300 font-bold">
              min_{"{f, μ}"}  ∑_{"{(u,v) ∈ E^{a,SR}, r}"} F_uv · μ_uv^r · c_uv^r  +  ∑_{"{(u,v) ∈ E^{a,GR}, k, r}"} F_uv · μ_uv^{"{k,r}"} · c_uv^r
            </div>

            <div className="border-t border-slate-800 pt-2 space-y-1 text-xs text-slate-300">
              <div><strong className="text-indigo-300">(a1) Flow Conservation:</strong> ∑ f_kuv = ∑ f_kvu (intermediate routing)</div>
              <div><strong className="text-indigo-300">(a2) Input Dependency:</strong> f_up^k = f_up^l, ∀ l ∈ X(k) (all parent outputs fed to task)</div>
              <div><strong className="text-indigo-300">(a3)-(a4) Source/Sink:</strong> f_su^k = 0 for u ≠ s(k); f_ud^k = 1 for u = d(k)</div>
              <div><strong className="text-indigo-300">(a5) Activation:</strong> F_uv ≥ f_uv^k (link activation flag)</div>
              <div><strong className="text-amber-300">(b1)-(b2) Link Delay:</strong> d_uv^k ≥ E[D_uv^{"{k,r}"}(f, μ)], l^k = ∑ f_uv^k · d_uv^k</div>
              <div><strong className="text-amber-300">(b3)-(b4) DAG Cumulative Delay:</strong> l_T^k ≥ l_T^j + l^k, ∀ j ∈ X(k)</div>
              <div><strong className="text-rose-300">(b5) End-to-End Latency Deadline:</strong> l_T^k ≤ L^k, ∀ k ∈ K^d</div>
              <div><strong className="text-emerald-300">(c1)-(c2) Queue Stability:</strong> μ_uv^r &gt; aggregate arrival rate</div>
              <div><strong className="text-slate-400">(e1)-(e4) Capacity Bounds:</strong> μ_uv^r ≤ M_uv^r, f_uv^k ∈ {'{0, 1}'}</div>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'algo' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Algorithm 1: SPARQ Step-by-Step Architecture</h2>
              <p className="text-sm text-slate-500">Biconvex alternating decomposition with IDAGO rounding (Section V-B, V-C)</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Algorithm 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="font-bold text-slate-900 text-sm mb-2">Algorithm 1 Pseudo-Code</div>
              <div>1: Initialize μ(0) ← M (System Maximum Capacity)</div>
              <div>2: for i = 1 to maximum iterations or convergence:</div>
              <div className="pl-4 text-indigo-700">3:   f̄(i) ← P₁(μ, ε, i - 1)  // Flow Routing & Placement</div>
              <div className="pl-4 text-amber-700">4:   μ̄(i) ← P₂(f, ε, i - 1)  // Resource Rate Allocation</div>
              <div className="pl-4">5:   f(i + 1) ← f(i) + γ_i · (f̄(i) - f(i))</div>
              <div className="pl-4">6:   μ(i + 1) ← μ(i) + γ_i · (μ̄(i) - μ(i))</div>
              <div className="pl-4 text-emerald-700">7:   Compute ρ(i) with f(i), μ(i) via Eq. (10)</div>
              <div className="pl-4 text-emerald-700">8:   ε(i + 1) ← γ_i · ε(i) + (1 - γ_i) · (1 - ρ(i))</div>
              <div className="pl-4">9:   i ← i + 1</div>
              <div>10: end for</div>
              <div className="text-purple-700 font-bold">11: f̂ ← Decomposition & Rounding IDAGO of f̄(i + 1)</div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <span className="font-bold text-indigo-900 block mb-1">Subproblem P₁: Placement & Routing</span>
                Fixes service rates μ and safety factor ε, solving for flow variables <em>f</em>. Bilinear product terms are linearized
                using previous iteration values, resulting in an efficient linear programming representation.
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="font-bold text-amber-900 block mb-1">Subproblem P₂: Resource Allocation</span>
                Fixes flow variables <em>f</em>, determining the exact minimum service rates μ needed to satisfy the latency deadlines
                with the given flow routes.
              </div>
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                <span className="font-bold text-purple-900 block mb-1">IDAGO Decomposition & Rounding</span>
                Converts fractional continuous flows into integer path variables {"{0, 1}"} through randomized candidate generation,
                maintaining guaranteed bi-criteria approximation factors.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
