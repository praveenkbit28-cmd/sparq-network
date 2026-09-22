package com.sparq.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a data stream / commodity k in K in the Cloud Network Flow (CNF) formulation.
 */
public class Commodity {
    private final String id;
    private final String name;
    private final String serviceId; // phi(k)
    private final String functionId; // Associated service function
    private final String sourceNodeId; // s(k)
    private final String destNodeId; // d(k)
    private double arrivalRate; // Lambda^phi(k)
    private final List<String> inputCommodities; // X(k) dependencies
    private final double maxLatencyMs; // L^k maximum allowable latency
    private final boolean isSource;
    private final boolean isDestination;

    public Commodity(String id, String name, String serviceId, String functionId,
                     String sourceNodeId, String destNodeId, double arrivalRate,
                     double maxLatencyMs, boolean isSource, boolean isDestination) {
        this.id = id;
        this.name = name;
        this.serviceId = serviceId;
        this.functionId = functionId;
        this.sourceNodeId = sourceNodeId;
        this.destNodeId = destNodeId;
        this.arrivalRate = arrivalRate;
        this.maxLatencyMs = maxLatencyMs;
        this.isSource = isSource;
        this.isDestination = isDestination;
        this.inputCommodities = new ArrayList<>();
    }

    public void addInputCommodity(String inputId) {
        this.inputCommodities.add(inputId);
    }

    public void setArrivalRate(double rate) { this.arrivalRate = rate; }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getServiceId() { return serviceId; }
    public String getFunctionId() { return functionId; }
    public String getSourceNodeId() { return sourceNodeId; }
    public String getDestNodeId() { return destNodeId; }
    public double getArrivalRate() { return arrivalRate; }
    public List<String> getInputCommodities() { return inputCommodities; }
    public double getMaxLatencyMs() { return maxLatencyMs; }
    public boolean isSource() { return isSource; }
    public boolean isDestination() { return isDestination; }
}
