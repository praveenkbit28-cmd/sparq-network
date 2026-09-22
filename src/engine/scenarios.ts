/**
 * Benchmark scenarios directly matching the IEEE TNSM 2026 paper:
 * 1. Experiment A: LLM & Speech-to-Text Multi-Service over Edge-Cloud (Fig. 6)
 * 2. Experiment B: FANTASIA Augmented Reality / Holographic Communication (Fig. 10)
 * 3. BurstGPT Empirical Workload Profile (Fig. 14, 15)
 */

import { NetworkNode, NetworkLink, ServiceGraphDAG } from '../types/sparq';

export interface ExperimentPreset {
  id: 'exp-a' | 'exp-b' | 'burstgpt' | 'custom';
  name: string;
  subtitle: string;
  description: string;
  nodes: NetworkNode[];
  links: NetworkLink[];
  serviceGraph: ServiceGraphDAG;
  defaultArrivalRateSweep: number[];
  defaultLatencyBoundSweep?: number[];
}

/**
 * Experiment A (Section VI-A, Figure 6):
 * Dual AI services: LLM (GPT-3.5/GPT-4) + Speech-to-Text
 */
export const EXPERIMENT_A_PRESET: ExperimentPreset = {
  id: 'exp-a',
  name: 'Experiment A: Dual AI Workloads (LLM + Speech-to-Text)',
  subtitle: 'Figure 6, 7, 8, 9 from Paper (Edge Activation Threshold at 100ms)',
  description:
    'A user pool connects to a dual-service infrastructure. Service 1 is an LLM with 70 req/s. Service 2 is Speech-to-Text with varying arrival rate. As load increases, cloud reaches delay boundary and activates the 10x more expensive Edge node.',
  nodes: [
    {
      id: 'node-u',
      name: 'User Node (u)',
      type: 'USER',
      x: 80,
      y: 200,
      isCompute: false,
      resources: {},
    },
    {
      id: 'node-r1',
      name: 'Access Router (r1)',
      type: 'ROUTER',
      x: 230,
      y: 200,
      isCompute: false,
      resources: {},
    },
    {
      id: 'node-e',
      name: 'Edge Compute (e)',
      type: 'EDGE',
      x: 360,
      y: 90,
      isCompute: true,
      resources: {
        GPU_VRAM: { capacity: 250, costPerUnit: 10.0 }, // c_pe = 10c
        CPU: { capacity: 300, costPerUnit: 5.0 },
      },
      active: false,
    },
    {
      id: 'node-r2',
      name: 'Backbone Router (r2)',
      type: 'ROUTER',
      x: 420,
      y: 270,
      isCompute: false,
      resources: {},
    },
    {
      id: 'node-n',
      name: 'Cloud Data Center (n)',
      type: 'CLOUD',
      x: 580,
      y: 270,
      isCompute: true,
      resources: {
        GPU_VRAM: { capacity: 350, costPerUnit: 1.0 }, // c_pn = c = 1.0
        CPU: { capacity: 500, costPerUnit: 0.5 },
      },
      active: true,
    },
  ],
  links: [
    {
      id: 'link-u-r1',
      source: 'node-u',
      target: 'node-r1',
      resourceModel: 'GR',
      bandwidth: 1000,
      costPerUnit: 0.1,
      propagationDelayMs: 2.0,
    },
    {
      id: 'link-r1-e',
      source: 'node-r1',
      target: 'node-e',
      resourceModel: 'SR',
      bandwidth: 800,
      costPerUnit: 0.2,
      propagationDelayMs: 1.5, // Low edge latency
    },
    {
      id: 'link-r1-r2',
      source: 'node-r1',
      target: 'node-r2',
      resourceModel: 'GR',
      bandwidth: 1200,
      costPerUnit: 0.3,
      propagationDelayMs: 12.0, // Backbone latency
    },
    {
      id: 'link-r2-n',
      source: 'node-r2',
      target: 'node-n',
      resourceModel: 'SR',
      bandwidth: 1500,
      costPerUnit: 0.15,
      propagationDelayMs: 18.0, // High cloud distance latency
    },
  ],
  serviceGraph: {
    id: 'sg-exp-a',
    name: 'Dual AI Services (LLM & STT)',
    serviceArrivalRate: 70,
    functions: [
      {
        id: 'fn-llm',
        name: 'LLM Inference Model',
        serviceId: 'phi-1',
        workloadDescription: 'GPT-3.5/GPT-4 autoregressive token generator (SR GPU)',
        defaultResourceModel: 'SR',
        resourceDemands: { GPU_VRAM: 1.0 }, // R = q
      },
      {
        id: 'fn-stt',
        name: 'Speech-to-Text Model',
        serviceId: 'phi-2',
        workloadDescription: 'Whisper/Conformer acoustic feature processing (SR GPU)',
        defaultResourceModel: 'SR',
        resourceDemands: { GPU_VRAM: 2.0 }, // R = 2q
      },
    ],
    commodities: [
      {
        id: 'k1',
        name: 'k1: LLM Prompt Stream',
        serviceId: 'phi-1',
        sourceNodeId: 'node-u',
        destNodeId: 'node-n',
        arrivalRateLambda: 70, // Fixed Lambda^phi1 = 70 req/s
        inputCommodities: [],
        maxLatencyDeadlineMs: 100,
        isSource: true,
        isDestination: false,
      },
      {
        id: 'k2',
        name: 'k2: LLM Generated Response',
        serviceId: 'phi-1',
        functionId: 'fn-llm',
        sourceNodeId: 'node-n',
        destNodeId: 'node-u',
        arrivalRateLambda: 70,
        inputCommodities: ['k1'],
        maxLatencyDeadlineMs: 100, // L^k2 = 100ms
        isSource: false,
        isDestination: true,
      },
      {
        id: 'k3',
        name: 'k3: Audio Input Stream',
        serviceId: 'phi-2',
        sourceNodeId: 'node-u',
        destNodeId: 'node-n',
        arrivalRateLambda: 65, // Variable Lambda^phi2 (sweep 50 to 85)
        inputCommodities: [],
        maxLatencyDeadlineMs: 100,
        isSource: true,
        isDestination: false,
      },
      {
        id: 'k4',
        name: 'k4: Transcribed Output Text',
        serviceId: 'phi-2',
        functionId: 'fn-stt',
        sourceNodeId: 'node-n',
        destNodeId: 'node-u',
        arrivalRateLambda: 65,
        inputCommodities: ['k3'],
        maxLatencyDeadlineMs: 100, // L^k4 = 100ms
        isSource: false,
        isDestination: true,
      },
    ],
  },
  defaultArrivalRateSweep: [50, 55, 60, 65, 68, 70, 75, 80, 85],
};

/**
 * Experiment B (Section VI-B, Figure 10):
 * FANTASIA Augmented Reality Holographic Communication
 */
export const EXPERIMENT_B_PRESET: ExperimentPreset = {
  id: 'exp-b',
  name: 'Experiment B: FANTASIA Augmented Reality Holographic Communication',
  subtitle: 'Figure 10, 11, 12, 13 from Paper (UE Offloading Transition at 140ms)',
  description:
    'Full multi-stage pipeline: Video & audio capture, feature extraction, AI video tracking, AI audio tracking, output combination, and holographic rendering. The user equipment (UE) has zero operational cost but limited capacity (5%).',
  nodes: [
    {
      id: 'node-source',
      name: 'User Source (s)',
      type: 'USER',
      x: 70,
      y: 200,
      isCompute: false,
      resources: {},
    },
    {
      id: 'node-edge-in',
      name: 'Source Edge Node',
      type: 'EDGE',
      x: 200,
      y: 110,
      isCompute: true,
      resources: {
        CPU: { capacity: 200, costPerUnit: 3.0 },
        GPU_VRAM: { capacity: 160, costPerUnit: 8.0 },
      },
      active: true,
    },
    {
      id: 'node-core',
      name: 'Cloud Core Network',
      type: 'CLOUD',
      x: 380,
      y: 240,
      isCompute: true,
      resources: {
        CPU: { capacity: 600, costPerUnit: 0.8 },
        GPU_VRAM: { capacity: 450, costPerUnit: 1.5 },
      },
      active: true,
    },
    {
      id: 'node-edge-out',
      name: 'Dest Edge Node',
      type: 'EDGE',
      x: 540,
      y: 110,
      isCompute: true,
      resources: {
        CPU: { capacity: 200, costPerUnit: 3.0 },
        GPU_VRAM: { capacity: 160, costPerUnit: 8.0 },
      },
      active: true,
    },
    {
      id: 'node-ue',
      name: 'User Equipment (UE v)',
      type: 'UE',
      x: 670,
      y: 200,
      isCompute: true,
      resources: {
        CPU: { capacity: 25, costPerUnit: 0.0 }, // 5% capacity of cloud, cost = 0
        GPU_VRAM: { capacity: 18, costPerUnit: 0.0 },
      },
      active: false,
    },
  ],
  links: [
    {
      id: 'link-src-edge',
      source: 'node-source',
      target: 'node-edge-in',
      resourceModel: 'GR',
      bandwidth: 800,
      costPerUnit: 0.1,
      propagationDelayMs: 2.0,
    },
    {
      id: 'link-edgein-core',
      source: 'node-edge-in',
      target: 'node-core',
      resourceModel: 'GR',
      bandwidth: 1200,
      costPerUnit: 0.2,
      propagationDelayMs: 14.0,
    },
    {
      id: 'link-core-edgeout',
      source: 'node-core',
      target: 'node-edge-out',
      resourceModel: 'GR',
      bandwidth: 1200,
      costPerUnit: 0.2,
      propagationDelayMs: 14.0,
    },
    {
      id: 'link-edgeout-ue',
      source: 'node-edge-out',
      target: 'node-ue',
      resourceModel: 'SR',
      bandwidth: 600,
      costPerUnit: 0.15,
      propagationDelayMs: 3.0,
    },
  ],
  serviceGraph: {
    id: 'sg-fantasia',
    name: 'FANTASIA Holographic Stream DAG',
    serviceArrivalRate: 24, // Lambda^phi1 = 24 req/s (from paper Fig. 10b)
    functions: [
      {
        id: 'fn-video-feat',
        name: 'Video Feature Extraction',
        serviceId: 'phi-ar',
        workloadDescription: 'Keypoint detection & frame filtering (GR CPU)',
        defaultResourceModel: 'GR',
        resourceDemands: { CPU: 0.8 },
      },
      {
        id: 'fn-audio-feat',
        name: 'Audio Feature Extraction',
        serviceId: 'phi-ar',
        workloadDescription: 'Spectrogram & MFCC extraction (GR CPU)',
        defaultResourceModel: 'GR',
        resourceDemands: { CPU: 0.5 },
      },
      {
        id: 'fn-video-ai',
        name: 'Video Tracking AI Model',
        serviceId: 'phi-ar',
        workloadDescription: 'Deep 3D mesh reconstruction (SR GPU)',
        defaultResourceModel: 'SR',
        resourceDemands: { GPU_VRAM: 1.8 },
      },
      {
        id: 'fn-audio-ai',
        name: 'Audio Tracking AI Model',
        serviceId: 'phi-ar',
        workloadDescription: 'Spatial sound localization AI (SR GPU)',
        defaultResourceModel: 'SR',
        resourceDemands: { GPU_VRAM: 1.2 },
      },
      {
        id: 'fn-combination',
        name: 'Output Combination',
        serviceId: 'phi-ar',
        workloadDescription: 'Multi-modal synchronization (GR CPU)',
        defaultResourceModel: 'GR',
        resourceDemands: { CPU: 0.6 },
      },
      {
        id: 'fn-rendering',
        name: 'Hologram Rendering',
        serviceId: 'phi-ar',
        workloadDescription: 'Final holographic raymarch / view synthesis (SR GPU)',
        defaultResourceModel: 'SR',
        resourceDemands: { GPU_VRAM: 2.2, CPU: 1.0 },
      },
    ],
    commodities: [
      {
        id: 'k1',
        name: 'k1: Video Raw Frames',
        serviceId: 'phi-ar',
        sourceNodeId: 'node-source',
        destNodeId: 'node-edge-in',
        arrivalRateLambda: 24,
        inputCommodities: [],
        maxLatencyDeadlineMs: 200,
        isSource: true,
        isDestination: false,
      },
      {
        id: 'k2',
        name: 'k2: Video Keypoints',
        serviceId: 'phi-ar',
        functionId: 'fn-video-feat',
        sourceNodeId: 'node-edge-in',
        destNodeId: 'node-core',
        arrivalRateLambda: 24,
        inputCommodities: ['k1'],
        maxLatencyDeadlineMs: 200,
        isSource: false,
        isDestination: false,
      },
      {
        id: 'k3',
        name: 'k3: Audio Raw Stream',
        serviceId: 'phi-ar',
        sourceNodeId: 'node-source',
        destNodeId: 'node-edge-in',
        arrivalRateLambda: 24,
        inputCommodities: [],
        maxLatencyDeadlineMs: 200,
        isSource: true,
        isDestination: false,
      },
      {
        id: 'k4',
        name: 'k4: Audio Spectrograms',
        serviceId: 'phi-ar',
        functionId: 'fn-audio-feat',
        sourceNodeId: 'node-edge-in',
        destNodeId: 'node-core',
        arrivalRateLambda: 24,
        inputCommodities: ['k3'],
        maxLatencyDeadlineMs: 200,
        isSource: false,
        isDestination: false,
      },
      {
        id: 'k5',
        name: 'k5: 3D Video Pose/Mesh',
        serviceId: 'phi-ar',
        functionId: 'fn-video-ai',
        sourceNodeId: 'node-core',
        destNodeId: 'node-edge-out',
        arrivalRateLambda: 24,
        inputCommodities: ['k2'],
        maxLatencyDeadlineMs: 200,
        isSource: false,
        isDestination: false,
      },
      {
        id: 'k6',
        name: 'k6: Spatial Sound Spatialized',
        serviceId: 'phi-ar',
        functionId: 'fn-audio-ai',
        sourceNodeId: 'node-core',
        destNodeId: 'node-edge-out',
        arrivalRateLambda: 24,
        inputCommodities: ['k4'],
        maxLatencyDeadlineMs: 200,
        isSource: false,
        isDestination: false,
      },
      {
        id: 'k7',
        name: 'k7: Combined Multi-Modal Scene',
        serviceId: 'phi-ar',
        functionId: 'fn-combination',
        sourceNodeId: 'node-edge-out',
        destNodeId: 'node-ue',
        arrivalRateLambda: 24,
        inputCommodities: ['k5', 'k6'],
        maxLatencyDeadlineMs: 200,
        isSource: false,
        isDestination: false,
      },
      {
        id: 'k8',
        name: 'k8: Final Rendered Hologram',
        serviceId: 'phi-ar',
        functionId: 'fn-rendering',
        sourceNodeId: 'node-edge-out',
        destNodeId: 'node-ue',
        arrivalRateLambda: 24,
        inputCommodities: ['k7'],
        maxLatencyDeadlineMs: 200, // Varied in sweep: 50ms to 300ms
        isSource: false,
        isDestination: true,
      },
    ],
  },
  defaultArrivalRateSweep: [24],
  defaultLatencyBoundSweep: [80, 100, 120, 130, 140, 150, 175, 200, 250, 300],
};

/**
 * BurstGPT Trace Characteristics (Section VII & Appendix, Figures 14 & 15)
 */
export const BURSTGPT_PROFILE = {
  name: 'BurstGPT Dataset Trace (2024)',
  description:
    'Timestamped real-world prompts and token responses from GPT-3.5 and GPT-4 evaluated under consecutive hourly windows. Validates Poisson inter-arrivals and mixture-of-exponentials service time distribution on GPUs.',
  hours: [
    { hour: '11:00 AM', meanInterArrivalMs: 14.2, fitP95: 42.1, empiricalP95: 41.8 },
    { hour: '12:00 PM', meanInterArrivalMs: 11.5, fitP95: 35.2, empiricalP95: 35.8 },
    { hour: '01:00 PM', meanInterArrivalMs: 10.8, fitP95: 32.7, empiricalP95: 33.1 },
    { hour: '02:00 PM', meanInterArrivalMs: 13.0, fitP95: 39.4, empiricalP95: 39.0 },
  ],
  tokenDistribution: [
    { bin: '0-200', gpt35Prob: 0.0038, gpt4Prob: 0.0018, fittedExp35: 0.0039, fittedExp4: 0.0019 },
    { bin: '200-400', gpt35Prob: 0.0024, gpt4Prob: 0.0015, fittedExp35: 0.0023, fittedExp4: 0.0014 },
    { bin: '400-600', gpt35Prob: 0.0014, gpt4Prob: 0.0012, fittedExp35: 0.0013, fittedExp4: 0.0011 },
    { bin: '600-800', gpt35Prob: 0.0008, gpt4Prob: 0.0009, fittedExp35: 0.0008, fittedExp4: 0.0008 },
    { bin: '800-1000', gpt35Prob: 0.0004, gpt4Prob: 0.0006, fittedExp35: 0.0005, fittedExp4: 0.0006 },
    { bin: '1000-1200', gpt35Prob: 0.0002, gpt4Prob: 0.0004, fittedExp35: 0.0003, fittedExp4: 0.0004 },
    { bin: '1200+', gpt35Prob: 0.0001, gpt4Prob: 0.0003, fittedExp35: 0.0001, fittedExp4: 0.0002 },
  ],
  convergenceStats: [
    { iteration: 1, rmse: 11.8, gamma: 1.0, epsilon: 0.15 },
    { iteration: 2, rmse: 7.2, gamma: 0.85, epsilon: 0.22 },
    { iteration: 3, rmse: 4.5, gamma: 0.72, epsilon: 0.28 },
    { iteration: 4, rmse: 2.9, gamma: 0.61, epsilon: 0.32 },
    { iteration: 5, rmse: 1.8, gamma: 0.52, epsilon: 0.35 },
    { iteration: 6, rmse: 1.2, gamma: 0.45, epsilon: 0.37 },
    { iteration: 7, rmse: 0.75, gamma: 0.39, epsilon: 0.38 },
    { iteration: 8, rmse: 0.51, gamma: 0.34, epsilon: 0.39 },
    { iteration: 9, rmse: 0.38, gamma: 0.30, epsilon: 0.395 },
    { iteration: 10, rmse: 0.29, gamma: 0.26, epsilon: 0.40 },
  ],
};
