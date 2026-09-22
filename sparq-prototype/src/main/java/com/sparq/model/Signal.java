package com.sparq.model;

/**
 * Represents an individual packet or request signal in stochastic discrete-event simulation.
 */
public class Signal {
    private final long id;
    private final String commodityId;
    private final double creationTimeSec;
    private double departureTimeSec;

    public Signal(long id, String commodityId, double creationTimeSec) {
        this.id = id;
        this.commodityId = commodityId;
        this.creationTimeSec = creationTimeSec;
    }

    public void setDepartureTime(double departureTimeSec) {
        this.departureTimeSec = departureTimeSec;
    }

    public long getId() { return id; }
    public String getCommodityId() { return commodityId; }
    public double getCreationTimeSec() { return creationTimeSec; }
    public double getDepartureTimeSec() { return departureTimeSec; }
    public double getSojournTimeMs() { return (departureTimeSec - creationTimeSec) * 1000.0; }
}
