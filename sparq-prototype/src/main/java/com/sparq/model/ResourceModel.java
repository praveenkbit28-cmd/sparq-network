package com.sparq.model;

/**
 * Execution resource model from IEEE TNSM paper:
 * - GR: Guaranteed-Resource Model (M/M/1 queue, dedicated resource isolation)
 * - SR: Shared-Resource Model (M/G/1 queue, Pollaczek-Khinchine delay, unpartitioned shared GPU/link)
 */
public enum ResourceModel {
    GR, // Guaranteed-Resource (dedicated)
    SR  // Shared-Resource (contended)
}
