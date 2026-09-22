package com.sparq.placement;

import com.sparq.model.*;

import java.util.*;

/**
 * Service function placement engine selecting optimal compute nodes (Cloud, Edge, UE).
 */
public class PlacementEngine {
    private final NetworkGraph networkGraph;

    public PlacementEngine(NetworkGraph networkGraph) {
        this.networkGraph = networkGraph;
    }

    public Placement generateCandidatePlacement(ServiceGraph serviceGraph, boolean prioritizeLowCost, boolean allowUE)
            throws PlacementException {
        Placement placement = new Placement();

        // Get available compute nodes
        List<NetworkNode> computeNodes = new ArrayList<>();
        for (NetworkNode node : networkGraph.getNodes()) {
            if (node.isCompute()) {
                if (node.getType() == NodeType.UE && !allowUE) {
                    continue;
                }
                computeNodes.add(node);
            }
        }

        if (computeNodes.isEmpty()) {
            throw new PlacementException("No suitable compute nodes found in network graph.");
        }

        // Sort by cost or latency
        if (prioritizeLowCost) {
            computeNodes.sort(Comparator.comparingDouble(n -> n.getCostPerUnit("compute")));
        } else {
            // Edge nodes first for lower delay
            computeNodes.sort((n1, n2) -> {
                if (n1.getType() == NodeType.EDGE && n2.getType() != NodeType.EDGE) return -1;
                if (n2.getType() == NodeType.EDGE && n1.getType() != NodeType.EDGE) return 1;
                return Double.compare(n1.getCostPerUnit("compute"), n2.getCostPerUnit("compute"));
            });
        }

        for (ServiceFunction fn : serviceGraph.getFunctions()) {
            // Assign best compute node
            NetworkNode targetNode = computeNodes.get(0);
            placement.assign(fn.getId(), targetNode.getId());
        }

        return placement;
    }
}
