package com.sparq.simulation;

import com.sparq.model.Signal;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Generates Poisson arrival request streams with exponential inter-arrival times:
 * Delta_t = -ln(U) / Lambda.
 */
public class SignalGenerator {
    private final Random random;

    public SignalGenerator() {
        this.random = new Random(42);
    }

    public List<Signal> generatePoissonStream(String commodityId, double arrivalRateLambda, int count) {
        List<Signal> signals = new ArrayList<>(count);
        double currentTime = 0.0;

        for (int i = 0; i < count; i++) {
            double u = Math.max(1e-10, random.nextDouble());
            double interArrival = -Math.log(u) / arrivalRateLambda;
            currentTime += interArrival;
            signals.add(new Signal(i + 1, commodityId, currentTime));
        }

        return signals;
    }
}
