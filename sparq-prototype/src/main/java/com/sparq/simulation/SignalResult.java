package com.sparq.simulation;

/**
 * Summary metrics of stochastic packet simulation.
 */
public class SignalResult {
    private final int totalSignals;
    private final double empiricalMeanDelayMs;
    private final double theoreticalDelayMs;
    private final double relativeErrorPercent;
    private final double percentile95Ms;
    private final double percentile99Ms;

    public SignalResult(int totalSignals, double empiricalMeanDelayMs, double theoreticalDelayMs,
                        double percentile95Ms, double percentile99Ms) {
        this.totalSignals = totalSignals;
        this.empiricalMeanDelayMs = empiricalMeanDelayMs;
        this.theoreticalDelayMs = theoreticalDelayMs;
        this.relativeErrorPercent = Math.abs(empiricalMeanDelayMs - theoreticalDelayMs) / Math.max(theoreticalDelayMs, 1e-6) * 100.0;
        this.percentile95Ms = percentile95Ms;
        this.percentile99Ms = percentile99Ms;
    }

    public int getTotalSignals() { return totalSignals; }
    public double getEmpiricalMeanDelayMs() { return empiricalMeanDelayMs; }
    public double getTheoreticalDelayMs() { return theoreticalDelayMs; }
    public double getRelativeErrorPercent() { return relativeErrorPercent; }
    public double getPercentile95Ms() { return percentile95Ms; }
    public double getPercentile99Ms() { return percentile99Ms; }
}
