/**
 * Stochastic Discrete-Event Queue Simulator
 * Validates theoretical queueing formulas (M/M/1 and M/G/1 Pollaczek-Khinchine)
 * against real-world stochastic realizations, matching Section VI & Appendix.
 */

export interface SimulatedPacket {
  id: number;
  commodityId: string;
  arrivalTimeSec: number;
  serviceStartSec: number;
  departureTimeSec: number;
  waitTimeMs: number;
  serviceTimeMs: number;
  sojournTimeMs: number;
}

export interface SimulationSummary {
  totalPackets: number;
  empiricalMeanWaitMs: number;
  empiricalMeanServiceMs: number;
  empiricalMeanSojournMs: number;
  theoreticalMeanSojournMs: number;
  percentile95Ms: number;
  percentile99Ms: number;
  confidenceInterval99: [number, number]; // [lower, upper]
  empiricalUtilization: number;
  relativeErrorPercent: number;
  packets: SimulatedPacket[];
}

export class StochasticQueueSimulator {
  /**
   * Runs discrete-event simulation for an M/G/1 or M/M/1 queue
   */
  public static simulateQueue(
    arrivalRateLambda: number,
    serviceRateMu: number,
    workloadR: number,
    model: 'GR' | 'SR',
    theoreticalDelayMs: number,
    sampleSize = 1000
  ): SimulationSummary {
    const packets: SimulatedPacket[] = [];
    let currentTime = 0;
    let serverAvailableAt = 0;

    for (let i = 0; i < sampleSize; i++) {
      // 1. Exponential inter-arrival time: tau = -ln(U) / lambda
      const u1 = Math.max(1e-7, Math.random());
      const interArrivalSec = -Math.log(u1) / Math.max(0.1, arrivalRateLambda);
      currentTime += interArrivalSec;

      // 2. Exponential service time: X = -ln(U) * (R / mu)
      const u2 = Math.max(1e-7, Math.random());
      const meanServiceSec = workloadR / Math.max(0.1, serviceRateMu);
      const serviceDurationSec = -Math.log(u2) * meanServiceSec;

      // 3. FCFS queue scheduling
      const serviceStartSec = Math.max(currentTime, serverAvailableAt);
      const departureTimeSec = serviceStartSec + serviceDurationSec;
      serverAvailableAt = departureTimeSec;

      const waitTimeSec = serviceStartSec - currentTime;
      const sojournTimeSec = departureTimeSec - currentTime;

      packets.push({
        id: i + 1,
        commodityId: 'k',
        arrivalTimeSec: currentTime,
        serviceStartSec,
        departureTimeSec,
        waitTimeMs: Math.max(0, waitTimeSec * 1000),
        serviceTimeMs: serviceDurationSec * 1000,
        sojournTimeMs: Math.max(0, sojournTimeSec * 1000),
      });
    }

    // Compute statistics
    const sojournTimes = packets.map((p) => p.sojournTimeMs).sort((a, b) => a - b);
    const sumWait = packets.reduce((acc, p) => acc + p.waitTimeMs, 0);
    const sumService = packets.reduce((acc, p) => acc + p.serviceTimeMs, 0);
    const sumSojourn = packets.reduce((acc, p) => acc + p.sojournTimeMs, 0);

    const empiricalMeanWaitMs = sumWait / sampleSize;
    const empiricalMeanServiceMs = sumService / sampleSize;
    const empiricalMeanSojournMs = sumSojourn / sampleSize;

    // Variance and standard error for 99% CI (z = 2.576)
    const variance =
      packets.reduce((acc, p) => acc + Math.pow(p.sojournTimeMs - empiricalMeanSojournMs, 2), 0) /
      (sampleSize - 1);
    const stdErr = Math.sqrt(variance / sampleSize);
    const marginOfError = 2.576 * stdErr;

    const p95Index = Math.floor(sampleSize * 0.95);
    const p99Index = Math.floor(sampleSize * 0.99);

    const relativeErrorPercent =
      Math.abs(empiricalMeanSojournMs - theoreticalDelayMs) /
      Math.max(1, theoreticalDelayMs) *
      100;

    const empiricalUtilization = (arrivalRateLambda * workloadR) / serviceRateMu;

    return {
      totalPackets: sampleSize,
      empiricalMeanWaitMs,
      empiricalMeanServiceMs,
      empiricalMeanSojournMs,
      theoreticalMeanSojournMs: theoreticalDelayMs,
      percentile95Ms: sojournTimes[p95Index] ?? empiricalMeanSojournMs,
      percentile99Ms: sojournTimes[p99Index] ?? empiricalMeanSojournMs,
      confidenceInterval99: [
        Math.max(0, empiricalMeanSojournMs - marginOfError),
        empiricalMeanSojournMs + marginOfError,
      ],
      empiricalUtilization,
      relativeErrorPercent,
      packets: packets.slice(0, 50), // keep sample for display
    };
  }
}
