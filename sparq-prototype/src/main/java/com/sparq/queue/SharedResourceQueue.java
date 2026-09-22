package com.sparq.queue;

import java.util.HashMap;
import java.util.Map;

/**
 * Shared-Resource (SR) Queue Model (Equations 2-11, 14, 18).
 * Represents unpartitioned shared resources (GPUs, PCIe/NVLink, Memory Bus)
 * modeled as an M/G/1 queue with Pollaczek-Khinchine waiting time.
 */
public class SharedResourceQueue implements QueueModel {
    private final Map<String, Double> commodityArrivals; // commodityId -> f_{uv}^k * Lambda^phi(k)
    private final Map<String, Double> commodityWorkloads; // commodityId -> R_{uv}^{k,r}
    private final double serviceRateMu;                 // mu_{uv}^r

    public SharedResourceQueue(double serviceRateMu) {
        this.serviceRateMu = serviceRateMu;
        this.commodityArrivals = new HashMap<>();
        this.commodityWorkloads = new HashMap<>();
    }

    public void addCommodityFlow(String commodityId, double arrivalRate, double workload) {
        commodityArrivals.put(commodityId, arrivalRate);
        commodityWorkloads.put(commodityId, workload);
    }

    /**
     * Aggregate arrival rate Lambda_{uv}^r = sum_k f_{uv}^k * Lambda^{phi(k)} (Equation 2)
     */
    public double getAggregateArrivalRate() {
        return commodityArrivals.values().stream().mapToDouble(Double::doubleValue).sum();
    }

    /**
     * Server utilization rho_{uv}^r = sum_k (lambda_k * R_k) / mu (Equation 9)
     */
    @Override
    public double getUtilization() {
        if (serviceRateMu <= 0) return 1.0;
        double load = 0.0;
        for (Map.Entry<String, Double> entry : commodityArrivals.entrySet()) {
            double lambda = entry.getValue();
            double r = commodityWorkloads.getOrDefault(entry.getKey(), 1.0);
            load += lambda * r;
        }
        return load / serviceRateMu;
    }

    @Override
    public boolean isStable() {
        return getUtilization() < 1.0;
    }

    /**
     * First moment of service time E[X] (Equation 5)
     */
    public double getFirstMomentServiceTimeSec() {
        double aggArrival = getAggregateArrivalRate();
        if (aggArrival <= 0 || serviceRateMu <= 0) return 0.0;
        double sum = 0.0;
        for (Map.Entry<String, Double> entry : commodityArrivals.entrySet()) {
            double lambda = entry.getValue();
            double r = commodityWorkloads.getOrDefault(entry.getKey(), 1.0);
            sum += (lambda / aggArrival) * (r / serviceRateMu);
        }
        return sum;
    }

    /**
     * Second moment of service time E[X^2] for exponential distribution (Equation 7)
     * E[X^2] = sum_k (lambda_k / Lambda) * (2 * R_k^2 / mu^2)
     */
    public double getSecondMomentServiceTimeSec2() {
        double aggArrival = getAggregateArrivalRate();
        if (aggArrival <= 0 || serviceRateMu <= 0) return 0.0;
        double sum = 0.0;
        for (Map.Entry<String, Double> entry : commodityArrivals.entrySet()) {
            double lambda = entry.getValue();
            double r = commodityWorkloads.getOrDefault(entry.getKey(), 1.0);
            sum += (lambda / aggArrival) * (2.0 * r * r / (serviceRateMu * serviceRateMu));
        }
        return sum;
    }

    /**
     * Expected waiting time in queue E[W] via Pollaczek-Khinchine formula (Equation 8)
     * E[W] = (Lambda * E[X^2]) / (2 * (1 - rho))
     */
    public double getExpectedWaitingTimeSec() {
        double rho = getUtilization();
        if (rho >= 1.0) return Double.POSITIVE_INFINITY;
        double aggArrival = getAggregateArrivalRate();
        double secondMoment = getSecondMomentServiceTimeSec2();
        return (aggArrival * secondMoment) / (2.0 * (1.0 - rho));
    }

    /**
     * Expected service time for specific commodity k: E[X_k] = R_k / mu (Equation 10)
     */
    public double getCommodityServiceTimeSec(String commodityId) {
        if (serviceRateMu <= 0) return Double.POSITIVE_INFINITY;
        double r = commodityWorkloads.getOrDefault(commodityId, 1.0);
        return r / serviceRateMu;
    }

    /**
     * Total expected sojourn delay E[D_k] = E[W] + E[X_k] (Equation 11)
     */
    @Override
    public double calculateSojournTimeSec(String commodityId) {
        if (!isStable()) return Double.POSITIVE_INFINITY;
        return getExpectedWaitingTimeSec() + getCommodityServiceTimeSec(commodityId);
    }

    /**
     * Convex epsilon-safety upper bound from Equation (18):
     * E[\bar{D}] = (sum_j lambda_j * R_j^2) / (epsilon * mu^2) + (R_k / mu)
     */
    public double calculateSafetyUpperBoundSec(String commodityId, double epsilon) {
        if (serviceRateMu <= 0 || epsilon <= 0) return Double.POSITIVE_INFINITY;
        double sumVariance = 0.0;
        for (Map.Entry<String, Double> entry : commodityArrivals.entrySet()) {
            double lambda = entry.getValue();
            double r = commodityWorkloads.getOrDefault(entry.getKey(), 1.0);
            sumVariance += lambda * (r * r);
        }
        double waitingBound = sumVariance / (epsilon * serviceRateMu * serviceRateMu);
        double serviceTime = getCommodityServiceTimeSec(commodityId);
        return waitingBound + serviceTime;
    }

    public double getServiceRateMu() { return serviceRateMu; }
}
