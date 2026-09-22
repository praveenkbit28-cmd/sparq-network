package com.sparq.resource;

import com.sparq.model.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Solves convex resource allocation Subproblem P2 of SPARQ:
 * Optimizes mu_{uv}^r for links and compute nodes to satisfy stability
 * and delay constraints at minimum cost.
 */
public class ResourceAllocator {
    private final NetworkGraph networkGraph;

    public ResourceAllocator(NetworkGraph networkGraph) {
        this.networkGraph = networkGraph;
    }

    public ResourceAllocation allocateResources(ServiceGraph serviceGraph, Placement placement,
                                                Map<String, Route> routes, double targetUtilization)
            throws ResourceAllocationException {
        ResourceAllocation allocation = new ResourceAllocation();

        // 1. Calculate aggregated arrivals on links
        Map<String, Double> linkArrivals = new HashMap<>();
        for (Commodity c : serviceGraph.getCommodities()) {
            Route r = routes.get(c.getId());
            if (r != null) {
                for (String linkId : r.getLinkIds()) {
                    linkArrivals.put(linkId, linkArrivals.getOrDefault(linkId, 0.0) + c.getArrivalRate());
                }
            }
        }

        // Set link bandwidth service rates
        for (NetworkLink link : networkGraph.getLinks()) {
            double arrival = linkArrivals.getOrDefault(link.getId(), 0.0);
            if (arrival > 0) {
                // Set rate based on target utilization: mu = arrival / targetUtilization
                double targetMu = arrival / Math.min(targetUtilization, 0.95);
                targetMu = Math.min(targetMu, link.getBandwidth());
                if (targetMu < arrival) {
                    throw new ResourceAllocationException("Link capacity " + link.getId() + " exceeded by traffic!");
                }
                allocation.setRate(link.getId(), "bandwidth", targetMu);
            } else {
                allocation.setRate(link.getId(), "bandwidth", link.getBandwidth() * 0.1);
            }
        }

        // 2. Calculate compute workload on nodes
        Map<String, Double> nodeWorkload = new HashMap<>();
        for (Commodity c : serviceGraph.getCommodities()) {
            if (c.getFunctionId() != null) {
                String nodeId = placement.getNode(c.getFunctionId());
                if (nodeId != null) {
                    ServiceFunction fn = serviceGraph.getFunction(c.getFunctionId());
                    double req = fn != null ? fn.getRequirement("compute") : 1.0;
                    nodeWorkload.put(nodeId, nodeWorkload.getOrDefault(nodeId, 0.0) + (c.getArrivalRate() * req));
                }
            }
        }

        // Set compute service rates
        for (NetworkNode node : networkGraph.getNodes()) {
            if (node.isCompute()) {
                double work = nodeWorkload.getOrDefault(node.getId(), 0.0);
                if (work > 0) {
                    double targetMu = work / Math.min(targetUtilization, 0.88);
                    double capacity = node.getCapacity("compute");
                    targetMu = Math.min(targetMu, capacity);
                    if (targetMu < work) {
                        throw new ResourceAllocationException("Compute node capacity " + node.getId() + " exceeded!");
                    }
                    allocation.setRate(node.getId(), "compute", targetMu);
                } else {
                    allocation.setRate(node.getId(), "compute", 0.0);
                }
            }
        }

        return allocation;
    }
}
