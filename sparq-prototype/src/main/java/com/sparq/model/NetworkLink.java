package com.sparq.model;

import java.util.Objects;

/**
 * Represents a physical or augmented network link (u, v) in E^a.
 */
public class NetworkLink {
    private final String id;
    private final String sourceId;
    private final String targetId;
    private final ResourceModel resourceModel;
    private final double bandwidth; // bits/s or units/s (M_uv)
    private final double propagationDelaySec;
    private final double costPerUnit; // c_uv

    public NetworkLink(String id, String sourceId, String targetId, ResourceModel resourceModel,
                       double bandwidth, double propagationDelayMs, double costPerUnit) {
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.resourceModel = resourceModel;
        this.bandwidth = bandwidth;
        this.propagationDelaySec = propagationDelayMs / 1000.0;
        this.costPerUnit = costPerUnit;
    }

    public String getId() { return id; }
    public String getSourceId() { return sourceId; }
    public String getTargetId() { return targetId; }
    public ResourceModel getResourceModel() { return resourceModel; }
    public double getBandwidth() { return bandwidth; }
    public double getPropagationDelaySec() { return propagationDelaySec; }
    public double getPropagationDelayMs() { return propagationDelaySec * 1000.0; }
    public double getCostPerUnit() { return costPerUnit; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        NetworkLink that = (NetworkLink) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
