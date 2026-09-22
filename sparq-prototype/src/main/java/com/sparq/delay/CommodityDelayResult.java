package com.sparq.delay;

import java.util.HashMap;
import java.util.Map;

/**
 * Encapsulates detailed delay components for a single commodity k.
 */
public class CommodityDelayResult {
    private final String commodityId;
    private final double propagationDelayMs;
    private final double queuingDelayMs;
    private final double processingDelayMs;
    private final double totalDelayMs;
    private final double cumulativeDagDelayMs; // l_T^k
    private final double maxLatencyBoundMs;    // L^k
    private final boolean isFeasible;
    private final Map<String, Double> elementDelays; // elementId -> delayMs

    public CommodityDelayResult(String commodityId, double propagationDelayMs, double queuingDelayMs,
                                double processingDelayMs, double cumulativeDagDelayMs, double maxLatencyBoundMs) {
        this.commodityId = commodityId;
        this.propagationDelayMs = propagationDelayMs;
        this.queuingDelayMs = queuingDelayMs;
        this.processingDelayMs = processingDelayMs;
        this.totalDelayMs = propagationDelayMs + queuingDelayMs + processingDelayMs;
        this.cumulativeDagDelayMs = cumulativeDagDelayMs;
        this.maxLatencyBoundMs = maxLatencyBoundMs;
        this.isFeasible = cumulativeDagDelayMs <= maxLatencyBoundMs + 1e-6;
        this.elementDelays = new HashMap<>();
    }

    public void addElementDelay(String elementId, double delayMs) {
        elementDelays.put(elementId, delayMs);
    }

    public String getCommodityId() { return commodityId; }
    public double getPropagationDelayMs() { return propagationDelayMs; }
    public double getQueuingDelayMs() { return queuingDelayMs; }
    public double getProcessingDelayMs() { return processingDelayMs; }
    public double getTotalDelayMs() { return totalDelayMs; }
    public double getCumulativeDagDelayMs() { return cumulativeDagDelayMs; }
    public double getMaxLatencyBoundMs() { return maxLatencyBoundMs; }
    public boolean isFeasible() { return isFeasible; }
    public Map<String, Double> getElementDelays() { return elementDelays; }
}
