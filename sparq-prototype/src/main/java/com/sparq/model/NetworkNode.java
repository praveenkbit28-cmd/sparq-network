package com.sparq.model;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Represents a physical or augmented computational node u in V.
 */
public class NetworkNode {
    private final String id;
    private final String name;
    private final NodeType type;
    private final boolean isCompute;
    private final Map<String, Double> capacities;    // M_u^r
    private final Map<String, Double> costPerUnits;  // c_u^r

    public NetworkNode(String id, String name, NodeType type, boolean isCompute) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.isCompute = isCompute;
        this.capacities = new HashMap<>();
        this.costPerUnits = new HashMap<>();
    }

    public void addResource(String resourceType, double capacity, double costPerUnit) {
        this.capacities.put(resourceType, capacity);
        this.costPerUnits.put(resourceType, costPerUnit);
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public NodeType getType() { return type; }
    public boolean isCompute() { return isCompute; }
    public double getCapacity(String resourceType) { return capacities.getOrDefault(resourceType, 0.0); }
    public double getCostPerUnit(String resourceType) { return costPerUnits.getOrDefault(resourceType, 0.0); }
    public Map<String, Double> getCapacities() { return capacities; }
    public Map<String, Double> getCostPerUnits() { return costPerUnits; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        NetworkNode that = (NetworkNode) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "NetworkNode{" + "id='" + id + '\'' + ", name='" + name + '\'' + ", type=" + type + '}';
    }
}
