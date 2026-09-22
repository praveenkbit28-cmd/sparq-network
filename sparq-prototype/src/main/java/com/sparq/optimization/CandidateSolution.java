package com.sparq.optimization;

import com.sparq.cost.CostBreakdown;
import com.sparq.delay.ApplicationDelayResult;
import com.sparq.model.Placement;
import com.sparq.model.ResourceAllocation;
import com.sparq.model.Route;
import com.sparq.validation.FeasibilityResult;

import java.util.Map;

/**
 * Represents a candidate solution state in SPARQ optimization.
 */
public class CandidateSolution {
    private final Placement placement;
    private final Map<String, Route> routes;
    private final ResourceAllocation allocation;
    private final ApplicationDelayResult delayResult;
    private final CostBreakdown costBreakdown;
    private final FeasibilityResult feasibilityResult;

    public CandidateSolution(Placement placement, Map<String, Route> routes,
                             ResourceAllocation allocation, ApplicationDelayResult delayResult,
                             CostBreakdown costBreakdown, FeasibilityResult feasibilityResult) {
        this.placement = placement;
        this.routes = routes;
        this.allocation = allocation;
        this.delayResult = delayResult;
        this.costBreakdown = costBreakdown;
        this.feasibilityResult = feasibilityResult;
    }

    public Placement getPlacement() { return placement; }
    public Map<String, Route> getRoutes() { return routes; }
    public ResourceAllocation getAllocation() { return allocation; }
    public ApplicationDelayResult getDelayResult() { return delayResult; }
    public CostBreakdown getCostBreakdown() { return costBreakdown; }
    public FeasibilityResult getFeasibilityResult() { return feasibilityResult; }
    public double getTotalCost() { return costBreakdown.getTotalCost(); }
    public boolean isFeasible() { return feasibilityResult.isFeasible(); }
}
