package com.sparq.routing;

import com.sparq.model.NetworkGraph;
import com.sparq.model.NetworkLink;
import com.sparq.model.Route;

import java.util.*;

/**
 * Shortest path routing over the augmented graph G^a.
 */
public class DijkstraRouter {
    private final NetworkGraph graph;

    public DijkstraRouter(NetworkGraph graph) {
        this.graph = graph;
    }

    public Route findRoute(String commodityId, String sourceNodeId, String destNodeId, RouteMetric metric)
            throws RoutingException {
        if (sourceNodeId.equals(destNodeId)) {
            return new Route(commodityId); // Colocated, empty link list
        }

        Map<String, Double> dist = new HashMap<>();
        Map<String, NetworkLink> prevLink = new HashMap<>();
        PriorityQueue<NodeDist> pq = new PriorityQueue<>(Comparator.comparingDouble(n -> n.dist));

        dist.put(sourceNodeId, 0.0);
        pq.add(new NodeDist(sourceNodeId, 0.0));

        while (!pq.isEmpty()) {
            NodeDist current = pq.poll();
            if (current.dist > dist.getOrDefault(current.nodeId, Double.POSITIVE_INFINITY)) {
                continue;
            }

            if (current.nodeId.equals(destNodeId)) {
                break;
            }

            for (NetworkLink link : graph.getOutgoingLinks(current.nodeId)) {
                double weight = calculateWeight(link, metric);
                double newDist = current.dist + weight;

                if (newDist < dist.getOrDefault(link.getTargetId(), Double.POSITIVE_INFINITY)) {
                    dist.put(link.getTargetId(), newDist);
                    prevLink.put(link.getTargetId(), link);
                    pq.add(new NodeDist(link.getTargetId(), newDist));
                }
            }
        }

        if (!dist.containsKey(destNodeId)) {
            throw new RoutingException("No path found from " + sourceNodeId + " to " + destNodeId);
        }

        Route route = new Route(commodityId);
        String curr = destNodeId;
        List<String> pathLinks = new ArrayList<>();
        while (!curr.equals(sourceNodeId)) {
            NetworkLink link = prevLink.get(curr);
            if (link == null) break;
            pathLinks.add(link.getId());
            curr = link.getSourceId();
        }
        Collections.reverse(pathLinks);
        pathLinks.forEach(route::addLink);

        return route;
    }

    private double calculateWeight(NetworkLink link, RouteMetric metric) {
        switch (metric) {
            case MIN_COST:
                return link.getCostPerUnit() + 0.001;
            case MIN_DELAY:
                return link.getPropagationDelayMs() + (1000.0 / Math.max(link.getBandwidth(), 1.0));
            case BALANCED:
            default:
                return link.getCostPerUnit() * 0.5 + link.getPropagationDelayMs() * 0.5;
        }
    }

    private static class NodeDist {
        final String nodeId;
        final double dist;

        NodeDist(String nodeId, double dist) {
            this.nodeId = nodeId;
            this.dist = dist;
        }
    }
}
