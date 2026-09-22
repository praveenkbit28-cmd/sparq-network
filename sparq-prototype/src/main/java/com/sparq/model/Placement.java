package com.sparq.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Mapping of service functions to physical/augmented computation nodes.
 */
public class Placement {
    private final Map<String, String> functionNodeMap; // functionId -> nodeId

    public Placement() {
        this.functionNodeMap = new HashMap<>();
    }

    public void assign(String functionId, String nodeId) {
        functionNodeMap.put(functionId, nodeId);
    }

    public String getNode(String functionId) {
        return functionNodeMap.get(functionId);
    }

    public Map<String, String> getAssignments() {
        return functionNodeMap;
    }
}
