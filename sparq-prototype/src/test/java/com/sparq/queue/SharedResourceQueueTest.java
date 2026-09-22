package com.sparq.queue;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SharedResourceQueueTest {

    @Test
    public void testSharedResourcePollaczekKhinchine() {
        // Multi-tenant queue with two commodities
        SharedResourceQueue srQueue = new SharedResourceQueue(100.0);
        srQueue.addCommodityFlow("k1", 30.0, 1.0);
        srQueue.addCommodityFlow("k2", 35.0, 1.0);

        // Aggregate arrival = 65, mu = 100 -> rho = 0.65
        assertTrue(srQueue.isStable());
        assertEquals(0.65, srQueue.getUtilization(), 1e-4);

        // E[X] = 1/100 = 0.01s (10ms)
        assertEquals(10.0, srQueue.getCommodityServiceTimeSec("k1") * 1000.0, 1e-4);

        // Sojourn delay should be positive and finite
        double sojournMs = srQueue.calculateSojournTimeMs("k1");
        assertTrue(sojournMs > 10.0);
        assertTrue(sojournMs < 50.0);
    }

    @Test
    public void testSafetyFactorUpperBound() {
        SharedResourceQueue srQueue = new SharedResourceQueue(100.0);
        srQueue.addCommodityFlow("k1", 40.0, 1.0);

        double exactDelay = srQueue.calculateSojournTimeSec("k1");
        // Epsilon = 1 - rho = 1 - 0.4 = 0.6
        double upperBound = srQueue.calculateSafetyUpperBoundSec("k1", 0.6);

        assertTrue(upperBound >= exactDelay - 1e-6);
    }
}
