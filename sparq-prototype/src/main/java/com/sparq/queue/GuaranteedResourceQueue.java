package com.sparq.queue;

/**
 * Guaranteed-Resource (GR) Queue Model (Equation 1, 12, 13).
 * Represents dedicated resource slices modeled as an M/M/1 queue with:
 * E[D_{uv}^{k,r}] = R_{uv}^{k,r} / (mu_{uv}^{k,r} - f_{uv}^k * Lambda^{phi(k)} * R_{uv}^{k,r})
 */
public class GuaranteedResourceQueue implements QueueModel {
    private final double arrivalRateLambda;      // f_{uv}^k * Lambda^{phi(k)}
    private final double workloadRequirementR;   // R_{uv}^{k,r}
    private final double serviceRateMu;          // mu_{uv}^{k,r}

    public GuaranteedResourceQueue(double arrivalRateLambda, double workloadRequirementR, double serviceRateMu) {
        this.arrivalRateLambda = arrivalRateLambda;
        this.workloadRequirementR = workloadRequirementR;
        this.serviceRateMu = serviceRateMu;
    }

    @Override
    public double calculateSojournTimeSec(String commodityId) {
        double effectiveArrival = arrivalRateLambda * workloadRequirementR;
        if (serviceRateMu <= effectiveArrival) {
            return Double.POSITIVE_INFINITY; // Queue is unstable / overloaded
        }
        // Equation (1) & (13):
        return workloadRequirementR / (serviceRateMu - effectiveArrival);
    }

    @Override
    public double getUtilization() {
        if (serviceRateMu <= 0) return 1.0;
        return (arrivalRateLambda * workloadRequirementR) / serviceRateMu;
    }

    @Override
    public boolean isStable() {
        return getUtilization() < 1.0;
    }

    public double getArrivalRateLambda() { return arrivalRateLambda; }
    public double getWorkloadRequirementR() { return workloadRequirementR; }
    public double getServiceRateMu() { return serviceRateMu; }
}
