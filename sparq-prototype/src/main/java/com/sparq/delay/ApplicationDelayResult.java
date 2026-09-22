package com.sparq.delay;

import java.util.HashMap;
import java.util.Map;

/**
 * End-to-end delay summary across the full AI service application.
 */
public class ApplicationDelayResult {
    private final String serviceId;
    private final Map<String, CommodityDelayResult> commodityDelays;
    private final double maxEndToEndDelayMs;
    private final boolean isFeasible;

    public ApplicationDelayResult(String serviceId) {
        this.serviceId = serviceId;
        this.commodityDelays = new HashMap<>();
        this.maxEndToEndDelayMs = 0.0;
        this.isFeasible = true;
    }

    public ApplicationDelayResult(String serviceId, Map<String, CommodityDelayResult> commodityDelays) {
        this.serviceId = serviceId;
        this.commodityDelays = commodityDelays;
        double maxDelay = 0.0;
        boolean feasible = true;
        for (CommodityDelayResult cdr : commodityDelays.values()) {
            if (cdr.getCumulativeDagDelayMs() > maxDelay) {
                maxDelay = cdr.getCumulativeDagDelayMs();
            }
            if (!cdr.isFeasible()) {
                feasible = false;
            }
        }
        this.maxEndToEndDelayMs = maxDelay;
        this.isFeasible = feasible;
    }

    public String getServiceId() { return serviceId; }
    public Map<String, CommodityDelayResult> getCommodityDelays() { return commodityDelays; }
    public CommodityDelayResult getDelay(String commodityId) { return commodityDelays.get(commodityId); }
    public double getMaxEndToEndDelayMs() { return maxEndToEndDelayMs; }
    public boolean isFeasible() { return isFeasible; }
}
