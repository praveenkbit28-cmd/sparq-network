package com.sparq.routing;

import com.sparq.model.*;

import java.util.HashMap;
import java.util.Map;

/**
 * High-level routing engine mapping commodities across physical paths.
 */
public class RoutingEngine {
    private final DijkstraRouter router;

    public RoutingEngine(NetworkGraph graph) {
        this.router = new DijkstraRouter(graph);
    }

    public Map<String, Route> routeCommodities(ServiceGraph serviceGraph, Placement placement, RouteMetric metric)
            throws RoutingException {
        Map<String, Route> routes = new HashMap<>();

        for (Commodity c : serviceGraph.getCommodities()) {
            String srcNode = c.getSourceNodeId();
            String dstNode = c.getDestNodeId();

            if (c.getFunctionId() != null) {
                String placedNode = placement.getNode(c.getFunctionId());
                if (placedNode != null) {
                    dstNode = placedNode;
                }
            }

            Route r = router.findRoute(c.getId(), srcNode, dstNode, metric);
            routes.put(c.getId(), r);
        }

        return routes;
    }
}
