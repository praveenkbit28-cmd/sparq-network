/**
 * Queue Models for the SPARQ Framework
 * Implements:
 * 1. Guaranteed-Resource (GR) M/M/1 Queue (Eq. 1, 12, 13)
 * 2. Shared-Resource (SR) M/G/1 Pollaczek-Khinchine Queue (Eq. 2-11, 14, 15)
 * 3. Epsilon-Safety Upper Bound & Convexification (Eq. 16-18)
 */

export interface QueueInputTraffic {
  commodityId: string;
  flowRateFraction: number; // f_uv^k in [0, 1]
  arrivalRateLambda: number; // Lambda^phi(k)
  workloadRequirementR: number; // R_uv^k (workload per request)
}

/**
 * Calculates expected sojourn time for Guaranteed-Resource (GR) M/M/1 Queue
 * Formula (Eq. 1 & 12):
 * E[D_uv^k] = R_uv^k / ( mu_uv^{k,r} - f_uv^k * Lambda^phi(k) * R_uv^k )
 * Returns delay in milliseconds (input rates in req/s, work units).
 */
export function calculateGuaranteedResourceDelay(
  flowFraction: number,
  arrivalRateLambda: number,
  workloadR: number,
  serviceRateMu: number
): {
  sojournTimeSec: number;
  sojournTimeMs: number;
  utilization: number;
  isStable: boolean;
} {
  const effectiveArrivalRate = flowFraction * arrivalRateLambda * workloadR;
  const utilization = serviceRateMu > 0 ? effectiveArrivalRate / serviceRateMu : 1.0;

  if (utilization >= 0.9999 || serviceRateMu <= effectiveArrivalRate) {
    // Unstable queue or near capacity
    return {
      sojournTimeSec: 999.0,
      sojournTimeMs: 999000.0,
      utilization,
      isStable: false,
    };
  }

  const denom = serviceRateMu - effectiveArrivalRate;
  const sojournTimeSec = workloadR / denom;

  return {
    sojournTimeSec,
    sojournTimeMs: sojournTimeSec * 1000,
    utilization,
    isStable: true,
  };
}

/**
 * Calculates expected waiting time and sojourn time for Shared-Resource (SR) M/G/1 Queue
 * using the Pollaczek-Khinchine formula (Eq. 2-11, 14):
 *
 * E[X_uv^k] = R_uv^k / mu_uv (Eq. 3)
 * E[(X_uv^k)^2] = 2 * (R_uv^k / mu_uv)^2 (Eq. 4)
 * E[W_uv] = sum_j (f_uv^j * Lambda^j * (R_uv^j)^2) / (mu_uv * (mu_uv - sum_j f_uv^j * Lambda^j * R_uv^j)) (Eq. 5, 11)
 * E[D_uv^k] = E[W_uv] + E[X_uv^k] (Eq. 11)
 */
export function calculateSharedResourceDelay(
  trafficList: QueueInputTraffic[],
  serviceRateMu: number,
  targetCommodityId: string
): {
  expectedWaitTimeMs: number;
  expectedServiceTimeMs: number;
  expectedSojournDelayMs: number;
  utilization: number;
  secondMomentServiceTimeSec2: number;
  isStable: boolean;
} {
  if (serviceRateMu <= 0) {
    return {
      expectedWaitTimeMs: 999000,
      expectedServiceTimeMs: 999000,
      expectedSojournDelayMs: 999000,
      utilization: 1.0,
      secondMomentServiceTimeSec2: 0,
      isStable: false,
    };
  }

  // Calculate cumulative arrival rate and workload
  let totalWorkloadArrival = 0; // sum_k f_uv^k * Lambda^k * R_uv^k
  let sumWeightedSecondMomentNumerator = 0; // sum_j f_uv^j * Lambda^j * (R_uv^j)^2
  let targetWorkloadR = 1.0;

  for (const t of trafficList) {
    const activeArrival = t.flowRateFraction * t.arrivalRateLambda;
    totalWorkloadArrival += activeArrival * t.workloadRequirementR;
    sumWeightedSecondMomentNumerator += activeArrival * Math.pow(t.workloadRequirementR, 2);

    if (t.commodityId === targetCommodityId) {
      targetWorkloadR = t.workloadRequirementR;
    }
  }

  const utilization = totalWorkloadArrival / serviceRateMu;

  // Stability condition: mu_uv > sum_k f_uv^k * Lambda^k * R_uv^k
  if (utilization >= 0.9999 || serviceRateMu <= totalWorkloadArrival) {
    return {
      expectedWaitTimeMs: 999000,
      expectedServiceTimeMs: (targetWorkloadR / serviceRateMu) * 1000,
      expectedSojournDelayMs: 999000,
      utilization,
      secondMomentServiceTimeSec2: 0,
      isStable: false,
    };
  }

  // Pollaczek-Khinchine waiting time (in seconds):
  // E[W_uv] = sumWeightedSecondMomentNumerator / ( mu_uv * (mu_uv - totalWorkloadArrival) )
  const denom = serviceRateMu * (serviceRateMu - totalWorkloadArrival);
  const expectedWaitTimeSec = denom > 0 ? sumWeightedSecondMomentNumerator / denom : 999;
  const expectedServiceTimeSec = targetWorkloadR / serviceRateMu;
  const expectedSojournDelaySec = expectedWaitTimeSec + expectedServiceTimeSec;

  const secondMomentServiceTimeSec2 =
    serviceRateMu > 0
      ? (2 * sumWeightedSecondMomentNumerator) / (serviceRateMu * totalWorkloadArrival || 1)
      : 0;

  return {
    expectedWaitTimeMs: Math.max(0, expectedWaitTimeSec * 1000),
    expectedServiceTimeMs: Math.max(0, expectedServiceTimeSec * 1000),
    expectedSojournDelayMs: Math.max(0, expectedSojournDelaySec * 1000),
    utilization: Math.min(1.0, Math.max(0, utilization)),
    secondMomentServiceTimeSec2,
    isStable: true,
  };
}

/**
 * Convexified Epsilon-Safety Upper Bound for Shared Resource (Eq. 18):
 * E[\bar{D}_uv^{k,r}(f, \mu, \epsilon)] <= sum_j (f_uv^j * Lambda^j * (R_uv^j)^2) / (epsilon_uv * mu_uv^2) + R_uv^k / mu_uv
 */
export function calculateConvexifiedEpsilonUpperBound(
  trafficList: QueueInputTraffic[],
  serviceRateMu: number,
  epsilonSafety: number,
  targetCommodityId: string
): number {
  if (serviceRateMu <= 0 || epsilonSafety <= 0) return 999000;

  let sumWeightedSecondMoment = 0;
  let targetR = 1.0;

  for (const t of trafficList) {
    const activeArrival = t.flowRateFraction * t.arrivalRateLambda;
    sumWeightedSecondMoment += activeArrival * Math.pow(t.workloadRequirementR, 2);
    if (t.commodityId === targetCommodityId) {
      targetR = t.workloadRequirementR;
    }
  }

  const waitBoundSec = sumWeightedSecondMoment / (epsilonSafety * Math.pow(serviceRateMu, 2));
  const serviceSec = targetR / serviceRateMu;
  return (waitBoundSec + serviceSec) * 1000;
}
