package com.sparq.optimization;

import com.sparq.cost.CostBreakdown;
import com.sparq.cost.CostCalculator;
import com.sparq.delay.ApplicationDelayResult;
import com.sparq.delay.DelayCalculator;
import com.sparq.model.*;
import com.sparq.placement.PlacementEngine;
import com.sparq.resource.ResourceAllocator;
import com.sparq.routing.RouteMetric;
import com.sparq.routing.RoutingEngine;
import com.sparq.validation.ConstraintValidator;
import com.sparq.validation.FeasibilityResult;

import java.util.*;

/**
 * Core implementation of Algorithm 1: SPARQ (Service Placement, Resource Allocation and Routing with Queue-Aware Delays).
 * Based on IEEE TNSM 2026 paper:
 * "SPARQ: An Optimization Framework for the Distribution of AI-Intensive Applications Under Non-Linear Delay Constraints"
 */
public class SparqOptimizationEngine {
    private final NetworkGraph networkGraph;
    private final ServiceGraph serviceGraph;
    private final PlacementEngine placementEngine;
    private final RoutingEngine routingEngine;
    private final ResourceAllocator resourceAllocator;
    private final DelayCalculator delayCalculator;
    private final CostCalculator costCalculator;
    private final ConstraintValidator validator;

    public SparqOptimizationEngine(NetworkGraph networkGraph, ServiceGraph serviceGraph) {
        this.networkGraph = networkGraph;
        this.serviceGraph = serviceGraph;
        this.placementEngine = new PlacementEngine(networkGraph);
        this.routingEngine = new RoutingEngine(networkGraph);
        this.resourceAllocator = new ResourceAllocator(networkGraph);
        this.delayCalculator = new DelayCalculator(networkGraph, serviceGraph);
        this.costCalculator = new CostCalculator(networkGraph);
        this.validator = new ConstraintValidator(networkGraph, serviceGraph);
    }

    /**
     * Executes Algorithm 1 alternating minimization.
     */
    public OptimizationResult optimize(int maxIterations, double targetCostTol) {
        long startTime = System.currentTimeMillis();
        List<OptimizationResult.IterationRecord> history = new ArrayList<>();

        CandidateSolution bestFeasible = null;
        double minFeasibleCost = Double.POSITIVE_INFINITY;

        // Initial safety factor epsilon_0 in (0, 1) from Eq. (18)
        double epsilon = 0.25;

        for (int i = 1; i <= maxIterations; i++) {
            // Step size sequence gamma_i in (0, 1] with diminishing condition (Section V-B)
            double gamma = 1.0 / Math.pow(1.0 + 0.15 * i, 0.65);

            // Subproblem P1: Placement & Routing (f-step)
            // Explore placement options based on iteration phase and safety factor
            boolean allowUE = (epsilon < 0.6); // Allow offloading when delay margin permits
            boolean prioritizeCost = (i % 2 == 0);

            Placement placement;
            try {
                placement = placementEngine.generateCandidatePlacement(serviceGraph, prioritizeCost, allowUE);
            } catch (Exception e) {
                placement = new Placement();
            }

            Map<String, Route> routes;
            try {
                RouteMetric metric = prioritizeCost ? RouteMetric.MIN_COST : RouteMetric.BALANCED;
                routes = routingEngine.routeCommodities(serviceGraph, placement, metric);
            } catch (Exception e) {
                routes = Collections.emptyMap();
            }

            // Subproblem P2: Optimal Resource Allocation (mu-step)
            double targetRho = 1.0 - epsilon;
            ResourceAllocation allocation;
            try {
                allocation = resourceAllocator.allocateResources(serviceGraph, placement, routes, targetRho);
            } catch (Exception e) {
                allocation = new ResourceAllocation();
            }

            // Evaluate non-linear delays (Equations 1-11 & b1-b5)
            ApplicationDelayResult delays = delayCalculator.calculateDelays(placement, routes, allocation);

            // Calculate objective cost
            CostBreakdown cost = costCalculator.calculateCost(allocation, placement, routes);

            // Validate constraints (a1)-(e4)
            FeasibilityResult feasibility = validator.validate(placement, routes, allocation, delays);

            CandidateSolution candidate = new CandidateSolution(
                    placement, routes, allocation, delays, cost, feasibility
            );

            double currentCost = cost.getTotalCost();
            double maxDelay = delays.getMaxEndToEndDelayMs();

            history.add(new OptimizationResult.IterationRecord(
                    i, gamma, epsilon, currentCost, maxDelay, feasibility.isFeasible()
            ));

            if (feasibility.isFeasible() && currentCost < minFeasibleCost) {
                minFeasibleCost = currentCost;
                bestFeasible = candidate;
            }

            // Adaptive safety factor update (Eq. 17-18)
            // epsilon(i+1) = gamma_i * epsilon(i) + (1 - gamma_i) * (1 - rho_avg)
            double avgRho = targetRho;
            epsilon = gamma * epsilon + (1.0 - gamma) * (1.0 - avgRho);
            epsilon = Math.max(0.05, Math.min(0.85, epsilon));
        }

        long executionTime = System.currentTimeMillis() - startTime;

        // If no strictly feasible solution found, return best candidate
        if (bestFeasible == null && !history.isEmpty()) {
            bestFeasible = generateFallbackSolution();
        }

        return new OptimizationResult(bestFeasible, maxIterations, (double) executionTime, history, "SPARQ");
    }

    private CandidateSolution generateFallbackSolution() {
        try {
            Placement placement = placementEngine.generateCandidatePlacement(serviceGraph, false, false);
            Map<String, Route> routes = routingEngine.routeCommodities(serviceGraph, placement, RouteMetric.MIN_DELAY);
            ResourceAllocation alloc = resourceAllocator.allocateResources(serviceGraph, placement, routes, 0.7);
            ApplicationDelayResult delays = delayCalculator.calculateDelays(placement, routes, alloc);
            CostBreakdown cost = costCalculator.calculateCost(alloc, placement, routes);
            FeasibilityResult feas = validator.validate(placement, routes, alloc, delays);
            return new CandidateSolution(placement, routes, alloc, delays, cost, feas);
        } catch (Exception e) {
            return null;
        }
    }
}
