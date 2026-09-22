/**
 * TypeScript types for the SPARQ Optimization Framework
 * Based on: "SPARQ: An Optimization Framework for the Distribution of AI-Intensive
 * Applications Under Non-Linear Delay Constraints" (IEEE TNSM 2026)
 */

export type ResourceType = 'CPU' | 'GPU_VRAM' | 'BANDWIDTH';

export type ResourceModel = 'GR' | 'SR'; // Guaranteed-Resource vs Shared-Resource

export type NodeType = 'USER' | 'ROUTER' | 'EDGE' | 'CLOUD' | 'UE';

export interface HardwareCapacity {
  capacity: number; // M_uv^r
  costPerUnit: number; // c_uv^r
  allocated?: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  x: number;
  y: number;
  isCompute: boolean;
  resources: Partial<Record<ResourceType, HardwareCapacity>>;
  active?: boolean;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  resourceModel: ResourceModel;
  bandwidth: number; // bps or Mbps
  costPerUnit: number;
  propagationDelayMs: number;
  resourceRequirements?: Partial<Record<ResourceType, number>>;
}

export interface ServiceFunction {
  id: string;
  name: string;
  serviceId: string;
  workloadDescription: string;
  defaultResourceModel: ResourceModel;
  // Resource requirements R_uv^{k,r} per request
  resourceDemands: Partial<Record<ResourceType, number>>;
}

export interface Commodity {
  id: string; // k in K
  name: string;
  serviceId: string; // phi(k)
  functionId?: string; // Associated service function if computation
  sourceNodeId: string; // s(k)
  destNodeId: string; // d(k)
  arrivalRateLambda: number; // Lambda^phi(k) in requests/s
  inputCommodities: string[]; // X(k)
  maxLatencyDeadlineMs: number; // L^k in ms
  isSource: boolean; // k in K^s
  isDestination: boolean; // k in K^d
}

export interface ServiceGraphDAG {
  id: string;
  name: string;
  serviceArrivalRate: number; // Lambda^phi
  commodities: Commodity[];
  functions: ServiceFunction[];
}

export interface QueueEvaluation {
  elementId: string; // link or node ID
  name: string;
  model: ResourceModel;
  resourceType: ResourceType;
  arrivalRateLambda: number; // lambda_uv = sum f_uv^k Lambda^phi(k)
  serviceRateMu: number; // mu_uv^r
  utilizationRho: number; // rho_uv
  expectedServiceTimeMs: number; // E[X_uv] in ms
  secondMomentServiceTimeMs2: number; // E[X_uv^2] in ms^2
  expectedWaitTimeMs: number; // E[W_uv] in ms
  expectedSojournDelayMs: number; // E[D_uv^k] in ms
  isStable: boolean; // mu > arrivalRate
  activeCommodities: string[];
}

export interface CommodityPathResult {
  commodityId: string;
  commodityName: string;
  placedNodeId?: string;
  routeLinkIds: string[];
  computationDelayMs: number;
  communicationDelayMs: number;
  totalPathDelayMs: number;
  cumulativeDagDelayMs: number; // l_T^k
  latencyDeadlineMs: number; // L^k
  meetsDeadline: boolean;
}

export interface OptimizationIteration {
  iteration: number;
  gamma: number; // Step size
  epsilon: number; // Safety factor
  rmse: number; // Error decay
  totalCost: number; // Objective value
  maxDelayViolationMs: number;
  utilizationAvg: number;
  edgeNodeActive: boolean;
  ueNodeActive: boolean;
}

export interface OptimizationResult {
  algorithm: 'SPARQ' | 'PRIVATE_MODEL';
  converged: boolean;
  iterationsCount: number;
  totalCost: number;
  isFeasible: boolean;
  maxSojournDelayMs: number;
  deadlineViolationCount: number;
  placedNodes: Record<string, string>; // functionId -> nodeId
  commodityPaths: Record<string, CommodityPathResult>;
  queueEvaluations: QueueEvaluation[];
  iterationHistory: OptimizationIteration[];
  executionTimeMs: number;
  overAllocationAlpha?: number; // for Private Model baseline
}

export interface TradeOffPoint {
  algorithm: string;
  alpha?: number;
  operationalCost: number;
  measuredLatencyMs: number;
  isFeasible: boolean;
  edgeActive: boolean;
  arrivalRate?: number;
  latencyBound?: number;
}
