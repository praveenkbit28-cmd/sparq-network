package com.sparq.cost;

import com.sparq.model.*;

import java.util.Map;

/**
 * Calculates operational deployment cost for Problem P:
 * Total Cost = sum_{(u,v)} F_uv * mu_uv^r * c_uv^r (Compute + Network).
 */
public class CostCalculator {
    private final NetworkGraph networkGraph;

    public CostCalculator(NetworkGraph networkGraph) {
        this.networkGraph = networkGraph;
    }

    public CostBreakdown calculateCost(ResourceAllocation allocation, Placement placement, Map<String, Route> routes) {
        double computeCost = 0.0;
        double networkCost = 0.0;
        CostBreakdown breakdown = new CostBreakdown(0, 0);

        // Compute costs: sum mu_u * c_u
        for (NetworkNode node : networkGraph.getNodes()) {
            if (node.isCompute()) {
                double rate = allocation.getRate(node.getId(), "compute");
                double unitCost = node.getCostPerUnit("compute");
                double cost = rate * unitCost;
                computeCost += cost;
                breakdown.addItemCost(node.getId(), cost);
            }
        }

        // Network link costs: sum mu_uv * c_uv
        for (NetworkLink link : networkGraph.getLinks()) {
            double rate = allocation.getRate(link.getId(), "bandwidth");
            double unitCost = link.getCostPerUnit();
            double cost = rate * unitCost;
            networkCost += cost;
            breakdown.addItemCost(link.getId(), cost);
        }

        CostBreakdown result = new CostBreakdown(computeCost, networkCost);
        breakdown.getItemizedCosts().forEach(result::addItemCost);
        return result;
    }
}
