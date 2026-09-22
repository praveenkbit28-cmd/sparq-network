package com.sparq.simulation;

import com.sparq.model.Signal;

import java.util.*;

/**
 * Simulates discrete-event queue processing over generated signals.
 */
public class SignalProcessor {
    private final Random random;

    public SignalProcessor() {
        this.random = new Random(101);
    }

    public SignalResult processQueue(List<Signal> signals, double serviceRateMu, double workloadR, double theoreticalDelayMs) {
        if (signals.isEmpty()) {
            return new SignalResult(0, 0, theoreticalDelayMs, 0, 0);
        }

        List<Double> sojournDelaysMs = new ArrayList<>(signals.size());
        double serverAvailableTime = 0.0;

        for (Signal s : signals) {
            double arrivalTime = s.getCreationTimeSec();
            double startTime = Math.max(arrivalTime, serverAvailableTime);

            // Exponential service time
            double u = Math.max(1e-10, random.nextDouble());
            double meanService = workloadR / serviceRateMu;
            double serviceDuration = -Math.log(u) * meanService;

            double departureTime = startTime + serviceDuration;
            s.setDepartureTime(departureTime);
            serverAvailableTime = departureTime;

            sojournDelaysMs.add(s.getSojournTimeMs());
        }

        Collections.sort(sojournDelaysMs);
        double meanDelay = sojournDelaysMs.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        int p95Idx = (int) (sojournDelaysMs.size() * 0.95);
        int p99Idx = (int) (sojournDelaysMs.size() * 0.99);

        double p95 = sojournDelaysMs.get(Math.min(p95Idx, sojournDelaysMs.size() - 1));
        double p99 = sojournDelaysMs.get(Math.min(p99Idx, sojournDelaysMs.size() - 1));

        return new SignalResult(signals.size(), meanDelay, theoreticalDelayMs, p95, p99);
    }
}
