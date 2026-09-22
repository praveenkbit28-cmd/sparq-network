package com.sparq.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Service function in an AI service graph (e.g. LLM, Speech-to-Text, 3D Pose Estimation).
 */
public class ServiceFunction {
    private final String id;
    private final String name;
    private final String serviceId;
    private final ResourceModel defaultResourceModel;
    private final Map<String, Double> resourceRequirements; // R_uv^{k,r}

    public ServiceFunction(String id, String name, String serviceId, ResourceModel defaultResourceModel) {
        this.id = id;
        this.name = name;
        this.serviceId = serviceId;
        this.defaultResourceModel = defaultResourceModel;
        this.resourceRequirements = new HashMap<>();
    }

    public void setRequirement(String resourceType, double requirement) {
        resourceRequirements.put(resourceType, requirement);
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getServiceId() { return serviceId; }
    public ResourceModel getDefaultResourceModel() { return defaultResourceModel; }
    public double getRequirement(String resourceType) { return resourceRequirements.getOrDefault(resourceType, 1.0); }
    public Map<String, Double> getResourceRequirements() { return resourceRequirements; }
}
