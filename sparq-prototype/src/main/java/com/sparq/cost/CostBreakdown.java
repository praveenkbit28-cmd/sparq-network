package com.sparq.cost;

import java.util.HashMap;
import java.util.Map;

/**
 * Breakdown of operational costs across compute nodes and communication links.
 */
public class CostBreakdown {
    private final double computeCost;
    private final double networkCost;
    private final double totalCost;
    private final Map<String, Double> itemizedCosts;

    public CostBreakdown(double computeCost, double networkCost) {
        this.computeCost = computeCost;
        this.networkCost = networkCost;
        this.totalCost = computeCost + networkCost;
        this.itemizedCosts = new HashMap<>();
    }

    public void addItemCost(String elementId, double cost) {
        itemizedCosts.put(elementId, cost);
    }

    public double getComputeCost() { return computeCost; }
    public double getNetworkCost() { return networkCost; }
    public double getTotalCost() { return totalCost; }
    public Map<String, Double> getItemizedCosts() { return itemizedCosts; }
}
