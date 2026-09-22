package com.sparq.delay;

import com.sparq.model.*;
import com.sparq.queue.GuaranteedResourceQueue;
import com.sparq.queue.SharedResourceQueue;

import java.util.*;

/**
 * Calculates and verifies non-linear delay constraints across the network graph
 * and DAG dependencies according to constraints (b1)-(b5) of Problem P.
 */
public class DelayCalculator {
    private final NetworkGraph networkGraph;
    private final ServiceGraph serviceGraph;

    public DelayCalculator(NetworkGraph networkGraph, ServiceGraph serviceGraph) {
        this.networkGraph = networkGraph;
        this.serviceGraph = serviceGraph;
    }

    /**
     * Computes the complete application delay result given placement, routing, and resource allocations.
     */
    public ApplicationDelayResult calculateDelays(Placement placement, Map<String, Route> routes,
                                                  ResourceAllocation resourceAllocation) {
        Map<String, CommodityDelayResult> results = new HashMap<>();
        Map<String, Double> cumulativeDelays = new HashMap<>();

        // Group commodities and topological order
        List<Commodity> orderedCommodities = getTopologicalCommodityOrder();

        // 1. First build queue models for shared resources
        Map<String, SharedResourceQueue> srQueues = new HashMap<>();
        for (NetworkLink link : networkGraph.getLinks()) {
            if (link.getResourceModel() == ResourceModel.SR) {
                double rate = resourceAllocation.getRate(link.getId(), "bandwidth");
                if (rate <= 0) rate = link.getBandwidth();
                srQueues.put(link.getId(), new SharedResourceQueue(rate));
            }
        }

        // Add commodity arrivals to shared queues
        for (Commodity c : serviceGraph.getCommodities()) {
            Route route = routes.get(c.getId());
            if (route != null) {
                for (String linkId : route.getLinkIds()) {
                    SharedResourceQueue srq = srQueues.get(linkId);
                    if (srq != null) {
                        srq.addCommodityFlow(c.getId(), c.getArrivalRate(), 1.0);
                    }
                }
            }
        }

        // 2. Evaluate delay per commodity along its route and compute DAG cumulative delay
        for (Commodity c : orderedCommodities) {
            double propDelayMs = 0.0;
            double queueDelayMs = 0.0;
            double procDelayMs = 0.0;
            Map<String, Double> elementDelays = new HashMap<>();

            Route route = routes.get(c.getId());
            if (route != null) {
                for (String linkId : route.getLinkIds()) {
                    NetworkLink link = networkGraph.getLink(linkId);
                    if (link != null) {
                        propDelayMs += link.getPropagationDelayMs();

                        double linkQueueMs = 0.0;
                        if (link.getResourceModel() == ResourceModel.SR) {
                            SharedResourceQueue srq = srQueues.get(linkId);
                            if (srq != null) {
                                linkQueueMs = srq.calculateSojournTimeMs(c.getId());
                            }
                        } else {
                            double rate = resourceAllocation.getRate(linkId, "bandwidth");
                            if (rate <= 0) rate = link.getBandwidth();
                            GuaranteedResourceQueue grq = new GuaranteedResourceQueue(c.getArrivalRate(), 1.0, rate);
                            linkQueueMs = grq.calculateSojournTimeMs(c.getId());
                        }
                        queueDelayMs += linkQueueMs;
                        elementDelays.put(linkId, link.getPropagationDelayMs() + linkQueueMs);
                    }
                }
            }

            // Compute node processing delay if mapped to a function
            if (c.getFunctionId() != null) {
                String nodeId = placement.getNode(c.getFunctionId());
                if (nodeId != null) {
                    NetworkNode node = networkGraph.getNode(nodeId);
                    if (node != null) {
                        double computeRate = resourceAllocation.getRate(nodeId, "compute");
                        if (computeRate <= 0) computeRate = node.getCapacity("compute");
                        double req = 1.0;
                        ServiceFunction fn = serviceGraph.getFunction(c.getFunctionId());
                        if (fn != null) {
                            req = fn.getRequirement("compute");
                        }

                        // Use SR queue for GPU compute
                        SharedResourceQueue nodeQueue = new SharedResourceQueue(computeRate);
                        nodeQueue.addCommodityFlow(c.getId(), c.getArrivalRate(), req);
                        double nodeDelayMs = nodeQueue.calculateSojournTimeMs(c.getId());
                        procDelayMs += nodeDelayMs;
                        elementDelays.put(nodeId, nodeDelayMs);
                    }
                }
            }

            double selfDelay = propDelayMs + queueDelayMs + procDelayMs;

            // DAG dependency constraint (b3)-(b4): l_T^k >= l_T^j + l^k for all j in X(k)
            double maxParentCumulative = 0.0;
            for (String parentId : c.getInputCommodities()) {
                double parentCum = cumulativeDelays.getOrDefault(parentId, 0.0);
                if (parentCum > maxParentCumulative) {
                    maxParentCumulative = parentCum;
                }
            }

            double totalCumDelay = maxParentCumulative + selfDelay;
            cumulativeDelays.put(c.getId(), totalCumDelay);

            CommodityDelayResult cdr = new CommodityDelayResult(
                    c.getId(),
                    propDelayMs,
                    queueDelayMs,
                    procDelayMs,
                    totalCumDelay,
                    c.getMaxLatencyMs()
            );
            elementDelays.forEach(cdr::addElementDelay);
            results.put(c.getId(), cdr);
        }

        return new ApplicationDelayResult(serviceGraph.getId(), results);
    }

    private List<Commodity> getTopologicalCommodityOrder() {
        List<Commodity> list = new ArrayList<>(serviceGraph.getCommodities());
        // Sort commodities by dependency depth
        list.sort((c1, c2) -> Integer.compare(c1.getInputCommodities().size(), c2.getInputCommodities().size()));
        return list;
    }
}
