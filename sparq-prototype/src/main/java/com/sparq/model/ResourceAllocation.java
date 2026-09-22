package com.sparq.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Stores allocated service rates mu_uv^{k,r} (GR) or mu_uv^r (SR).
 */
public class ResourceAllocation {
    private final Map<String, Double> rates; // "elementId:resourceType" -> allocated service rate mu

    public ResourceAllocation() {
        this.rates = new HashMap<>();
    }

    public void setRate(String elementId, String resourceType, double rate) {
        rates.put(elementId + ":" + resourceType, rate);
    }

    public double getRate(String elementId, String resourceType) {
        return rates.getOrDefault(elementId + ":" + resourceType, 0.0);
    }

    public Map<String, Double> getAllRates() {
        return rates;
    }
}
