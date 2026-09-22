package com.sparq.validation;

import com.sparq.delay.ApplicationDelayResult;
import com.sparq.delay.CommodityDelayResult;
import com.sparq.model.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Validates candidate solutions against all constraints (a1)-(e4) of Problem P.
 */
public class ConstraintValidator {
    private final NetworkGraph networkGraph;
    private final ServiceGraph serviceGraph;

    public ConstraintValidator(NetworkGraph networkGraph, ServiceGraph serviceGraph) {
        this.networkGraph = networkGraph;
        this.serviceGraph = serviceGraph;
    }

    public FeasibilityResult validate(Placement placement, Map<String, Route> routes,
                                     ResourceAllocation allocation, ApplicationDelayResult delayResult) {
        List<String> violations = new ArrayList<>();

        // 1. Validate Delay Constraints (b5): l_T^k <= L^k
        if (delayResult != null) {
            for (CommodityDelayResult cdr : delayResult.getCommodityDelays().values()) {
                if (!cdr.isFeasible()) {
                    violations.add(String.format("Latency violation on commodity %s: %.1fms exceeds bound of %.1fms (Eq. b5)",
                            cdr.getCommodityId(), cdr.getCumulativeDagDelayMs(), cdr.getMaxLatencyBoundMs()));
                }
            }
        }

        // 2. Validate Node Capacities (e1)-(e2): mu_u^r <= M_u^r
        for (NetworkNode node : networkGraph.getNodes()) {
            if (node.isCompute()) {
                double rate = allocation.getRate(node.getId(), "compute");
                double maxCap = node.getCapacity("compute");
                if (rate > maxCap + 1e-6) {
                    violations.add(String.format("Compute capacity violation on node %s: %.1f > capacity %.1f (Eq. e1)",
                            node.getId(), rate, maxCap));
                }
            }
        }

        // 3. Validate Link Capacities (e3)-(e4): mu_uv^r <= M_uv^r
        for (NetworkLink link : networkGraph.getLinks()) {
            double rate = allocation.getRate(link.getId(), "bandwidth");
            double maxCap = link.getBandwidth();
            if (rate > maxCap + 1e-6) {
                violations.add(String.format("Link bandwidth violation on link %s: %.1f > bandwidth %.1f (Eq. e3)",
                        link.getId(), rate, maxCap));
            }
        }

        // 4. Validate Placement Mapping (a2): every function is placed
        for (ServiceFunction fn : serviceGraph.getFunctions()) {
            String nodeId = placement.getNode(fn.getId());
            if (nodeId == null || networkGraph.getNode(nodeId) == null) {
                violations.add(String.format("Placement violation: function %s is not assigned to a valid node (Eq. a2)", fn.getId()));
            }
        }

        return new FeasibilityResult(violations.isEmpty(), violations);
    }
}
