package com.sparq.optimization;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates final optimization results of Algorithm 1.
 */
public class OptimizationResult {
    private final CandidateSolution bestSolution;
    private final int totalIterations;
    private final double executionTimeMs;
    private final List<IterationRecord> history;
    private final String algorithmName;

    public OptimizationResult(CandidateSolution bestSolution, int totalIterations,
                              double executionTimeMs, List<IterationRecord> history, String algorithmName) {
        this.bestSolution = bestSolution;
        this.totalIterations = totalIterations;
        this.executionTimeMs = executionTimeMs;
        this.history = history;
        this.algorithmName = algorithmName;
    }

    public CandidateSolution getBestSolution() { return bestSolution; }
    public int getTotalIterations() { return totalIterations; }
    public double getExecutionTimeMs() { return executionTimeMs; }
    public List<IterationRecord> getHistory() { return history; }
    public String getAlgorithmName() { return algorithmName; }

    public static class IterationRecord {
        public final int iteration;
        public final double stepSizeGamma;
        public final double safetyFactorEpsilon;
        public final double cost;
        public final double maxDelayMs;
        public final boolean isFeasible;

        public IterationRecord(int iteration, double stepSizeGamma, double safetyFactorEpsilon,
                               double cost, double maxDelayMs, boolean isFeasible) {
            this.iteration = iteration;
            this.stepSizeGamma = stepSizeGamma;
            this.safetyFactorEpsilon = safetyFactorEpsilon;
            this.cost = cost;
            this.maxDelayMs = maxDelayMs;
            this.isFeasible = isFeasible;
        }
    }
}
