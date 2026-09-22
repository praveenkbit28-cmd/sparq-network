package com.sparq.queue;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class GuaranteedResourceQueueTest {

    @Test
    public void testSojournDelayCalculation() {
        // Lambda = 50, R = 1.0, Mu = 100
        // E[D] = R / (mu - Lambda * R) = 1.0 / (100 - 50) = 1.0 / 50 = 0.02s = 20ms
        GuaranteedResourceQueue queue = new GuaranteedResourceQueue(50.0, 1.0, 100.0);
        assertTrue(queue.isStable());
        assertEquals(0.5, queue.getUtilization(), 1e-5);
        assertEquals(20.0, queue.calculateSojournTimeMs("k1"), 1e-5);
    }

    @Test
    public void testOverloadedQueueReturnsInfinity() {
        GuaranteedResourceQueue queue = new GuaranteedResourceQueue(110.0, 1.0, 100.0);
        assertFalse(queue.isStable());
        assertEquals(Double.POSITIVE_INFINITY, queue.calculateSojournTimeSec("k1"));
    }
}
