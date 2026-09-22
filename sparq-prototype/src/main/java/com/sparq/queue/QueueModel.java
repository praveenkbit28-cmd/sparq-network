package com.sparq.queue;

/**
 * Interface defining queue delay models in SPARQ.
 */
public interface QueueModel {
    /**
     * Calculates expected sojourn time in seconds for a target commodity.
     */
    double calculateSojournTimeSec(String commodityId);

    /**
     * Returns expected sojourn time in milliseconds.
     */
    default double calculateSojournTimeMs(String commodityId) {
        return calculateSojournTimeSec(commodityId) * 1000.0;
    }

    /**
     * Returns server utilization factor rho in [0, 1].
     */
    double getUtilization();

    /**
     * Checks if the queue satisfies stability conditions (rho < 1.0).
     */
    boolean isStable();
}
