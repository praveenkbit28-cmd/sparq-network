package com.sparq.validation;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates feasibility check results against Problem P constraints (a1)-(e4).
 */
public class FeasibilityResult {
    private final boolean feasible;
    private final List<String> violations;

    public FeasibilityResult(boolean feasible) {
        this.feasible = feasible;
        this.violations = new ArrayList<>();
    }

    public FeasibilityResult(boolean feasible, List<String> violations) {
        this.feasible = feasible;
        this.violations = violations;
    }

    public void addViolation(String violation) {
        violations.add(violation);
    }

    public boolean isFeasible() { return feasible && violations.isEmpty(); }
    public List<String> getViolations() { return violations; }
}
