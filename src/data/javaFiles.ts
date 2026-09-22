export interface JavaFileItem {
  path: string;
  filename: string;
  package: string;
  category: 'model' | 'queue' | 'delay' | 'routing' | 'placement' | 'resource' | 'cost' | 'validation' | 'optimization' | 'simulation' | 'demo' | 'config' | 'test';
  description: string;
  code: string;
}

export const JAVA_PROJECT_FILES: JavaFileItem[] = [
  {
    path: 'pom.xml',
    filename: 'pom.xml',
    package: 'root',
    category: 'config',
    description: 'Maven Project Object Model with Java 17 and JUnit 5 dependencies',
    code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.sparq</groupId>
    <artifactId>sparq-optimization-framework</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>SPARQ Optimization Framework</name>
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <junit.jupiter.version>5.10.0</junit.jupiter.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>\${junit.jupiter.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>`
  },
  {
    path: 'src/main/java/com/sparq/queue/SharedResourceQueue.java',
    filename: 'SharedResourceQueue.java',
    package: 'com.sparq.queue',
    category: 'queue',
    description: 'Implements M/G/1 Pollaczek-Khinchine queue (Equations 2-11, 14, 18)',
    code: `package com.sparq.queue;

import java.util.HashMap;
import java.util.Map;

/**
 * Shared-Resource (SR) Queue Model (Equations 2-11, 14, 18).
 * Represents unpartitioned shared resources (GPUs, PCIe/NVLink, Memory Bus)
 * modeled as an M/G/1 queue with Pollaczek-Khinchine waiting time.
 */
public class SharedResourceQueue implements QueueModel {
    private final Map<String, Double> commodityArrivals;
    private final Map<String, Double> commodityWorkloads;
    private final double serviceRateMu;

    public SharedResourceQueue(double serviceRateMu) {
        this.serviceRateMu = serviceRateMu;
        this.commodityArrivals = new HashMap<>();
        this.commodityWorkloads = new HashMap<>();
    }

    public void addCommodityFlow(String commodityId, double arrivalRate, double workload) {
        commodityArrivals.put(commodityId, arrivalRate);
        commodityWorkloads.put(commodityId, workload);
    }

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
     * Expected waiting time via Pollaczek-Khinchine formula (Equation 8):
     * E[W] = (Lambda * E[X^2]) / (2 * (1 - rho))
     */
    public double getExpectedWaitingTimeSec() {
        double rho = getUtilization();
        if (rho >= 1.0) return Double.POSITIVE_INFINITY;
        double aggArrival = commodityArrivals.values().stream().mapToDouble(Double::doubleValue).sum();
        double secondMoment = getSecondMomentServiceTimeSec2();
        return (aggArrival * secondMoment) / (2.0 * (1.0 - rho));
    }

    public double getSecondMomentServiceTimeSec2() {
        double aggArrival = commodityArrivals.values().stream().mapToDouble(Double::doubleValue).sum();
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
     * Total expected sojourn delay E[D_k] = E[W] + E[X_k] (Equation 11)
     */
    @Override
    public double calculateSojournTimeSec(String commodityId) {
        if (!isStable()) return Double.POSITIVE_INFINITY;
        double r = commodityWorkloads.getOrDefault(commodityId, 1.0);
        return getExpectedWaitingTimeSec() + (r / serviceRateMu);
    }

    /**
     * Convex epsilon-safety upper bound from Equation (18):
     */
    public double calculateSafetyUpperBoundSec(String commodityId, double epsilon) {
        double sumVar = 0.0;
        for (Map.Entry<String, Double> entry : commodityArrivals.entrySet()) {
            double lambda = entry.getValue();
            double r = commodityWorkloads.getOrDefault(entry.getKey(), 1.0);
            sumVar += lambda * (r * r);
        }
        double waitingBound = sumVar / (epsilon * serviceRateMu * serviceRateMu);
        double r = commodityWorkloads.getOrDefault(commodityId, 1.0);
        return waitingBound + (r / serviceRateMu);
    }
}`
  },
  {
    path: 'src/main/java/com/sparq/queue/GuaranteedResourceQueue.java',
    filename: 'GuaranteedResourceQueue.java',
    package: 'com.sparq.queue',
    category: 'queue',
    description: 'Implements M/M/1 Dedicated Resource queue (Equations 1, 12, 13)',
    code: `package com.sparq.queue;

/**
 * Guaranteed-Resource (GR) Queue Model (Equations 1, 12, 13).
 * M/M/1 queue with isolated rate:
 * E[D_{uv}^{k,r}] = R_{uv}^{k,r} / (mu_{uv}^{k,r} - f_{uv}^k * Lambda^{phi(k)} * R_{uv}^{k,r})
 */
public class GuaranteedResourceQueue implements QueueModel {
    private final double arrivalRateLambda;
    private final double workloadRequirementR;
    private final double serviceRateMu;

    public GuaranteedResourceQueue(double arrivalRateLambda, double workloadRequirementR, double serviceRateMu) {
        this.arrivalRateLambda = arrivalRateLambda;
        this.workloadRequirementR = workloadRequirementR;
        this.serviceRateMu = serviceRateMu;
    }

    @Override
    public double calculateSojournTimeSec(String commodityId) {
        double effectiveArrival = arrivalRateLambda * workloadRequirementR;
        if (serviceRateMu <= effectiveArrival) {
            return Double.POSITIVE_INFINITY;
        }
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
}`
  },
  {
    path: 'src/main/java/com/sparq/optimization/SparqOptimizationEngine.java',
    filename: 'SparqOptimizationEngine.java',
    package: 'com.sparq.optimization',
    category: 'optimization',
    description: 'Algorithm 1: SPARQ Biconvex Alternating Minimization Engine',
    code: `package com.sparq.optimization;

import com.sparq.cost.CostCalculator;
import com.sparq.delay.DelayCalculator;
import com.sparq.model.*;
import com.sparq.placement.PlacementEngine;
import com.sparq.resource.ResourceAllocator;
import com.sparq.routing.RouteMetric;
import com.sparq.routing.RoutingEngine;
import com.sparq.validation.ConstraintValidator;
import java.util.*;

/**
 * Core implementation of Algorithm 1: SPARQ.
 * Alternating minimization between Subproblem P1 and Subproblem P2.
 */
public class SparqOptimizationEngine {
    private final NetworkGraph networkGraph;
    private final ServiceGraph serviceGraph;
    private final PlacementEngine placementEngine;
    private final RoutingEngine routingEngine;
    private final ResourceAllocator resourceAllocator;
    private final DelayCalculator delayCalculator;
    private final CostCalculator costCalculator;
    private final ConstraintValidator validator;

    public SparqOptimizationEngine(NetworkGraph networkGraph, ServiceGraph serviceGraph) {
        this.networkGraph = networkGraph;
        this.serviceGraph = serviceGraph;
        this.placementEngine = new PlacementEngine(networkGraph);
        this.routingEngine = new RoutingEngine(networkGraph);
        this.resourceAllocator = new ResourceAllocator(networkGraph);
        this.delayCalculator = new DelayCalculator(networkGraph, serviceGraph);
        this.costCalculator = new CostCalculator(networkGraph);
        this.validator = new ConstraintValidator(networkGraph, serviceGraph);
    }

    public OptimizationResult optimize(int maxIterations, double targetCostTol) {
        long startTime = System.currentTimeMillis();
        List<OptimizationResult.IterationRecord> history = new ArrayList<>();
        CandidateSolution bestFeasible = null;
        double minFeasibleCost = Double.POSITIVE_INFINITY;
        double epsilon = 0.25;

        for (int i = 1; i <= maxIterations; i++) {
            // Diminishing step size sequence gamma_i (Section V-B)
            double gamma = 1.0 / Math.pow(1.0 + 0.15 * i, 0.65);

            // Subproblem P1: Placement & Routing
            boolean allowUE = (epsilon < 0.6);
            boolean prioritizeCost = (i % 2 == 0);
            Placement placement = placementEngine.generateCandidatePlacement(serviceGraph, prioritizeCost, allowUE);
            Map<String, Route> routes = routingEngine.routeCommodities(serviceGraph, placement, RouteMetric.BALANCED);

            // Subproblem P2: Optimal Resource Allocation
            double targetRho = 1.0 - epsilon;
            ResourceAllocation allocation = resourceAllocator.allocateResources(serviceGraph, placement, routes, targetRho);

            // Verify non-linear delay & constraints (b1)-(b5)
            ApplicationDelayResult delays = delayCalculator.calculateDelays(placement, routes, allocation);
            CostBreakdown cost = costCalculator.calculateCost(allocation, placement, routes);
            FeasibilityResult feasibility = validator.validate(placement, routes, allocation, delays);

            CandidateSolution candidate = new CandidateSolution(placement, routes, allocation, delays, cost, feasibility);
            if (feasibility.isFeasible() && cost.getTotalCost() < minFeasibleCost) {
                minFeasibleCost = cost.getTotalCost();
                bestFeasible = candidate;
            }

            // Adaptive safety factor update (Eq. 17-18)
            epsilon = gamma * epsilon + (1.0 - gamma) * (1.0 - targetRho);
            epsilon = Math.max(0.05, Math.min(0.85, epsilon));
        }

        return new OptimizationResult(bestFeasible, maxIterations, System.currentTimeMillis() - startTime, history, "SPARQ");
    }
}`
  },
  {
    path: 'src/main/java/com/sparq/delay/DelayCalculator.java',
    filename: 'DelayCalculator.java',
    package: 'com.sparq.delay',
    category: 'delay',
    description: 'Evaluates non-linear DAG delays and constraints (b1)-(b5)',
    code: `package com.sparq.delay;

import com.sparq.model.*;
import com.sparq.queue.GuaranteedResourceQueue;
import com.sparq.queue.SharedResourceQueue;
import java.util.*;

/**
 * Calculates and verifies non-linear delay constraints across the network graph
 * and DAG dependencies according to constraints (b1)-(b5) of Problem P.
 */
public class DelayCalculator {
    private final NetworkGraph networkGraph;
    private final ServiceGraph serviceGraph;

    public DelayCalculator(NetworkGraph networkGraph, ServiceGraph serviceGraph) {
        this.networkGraph = networkGraph;
        this.serviceGraph = serviceGraph;
    }

    public ApplicationDelayResult calculateDelays(Placement placement, Map<String, Route> routes,
                                                  ResourceAllocation resourceAllocation) {
        Map<String, CommodityDelayResult> results = new HashMap<>();
        Map<String, Double> cumulativeDelays = new HashMap<>();

        for (Commodity c : serviceGraph.getCommodities()) {
            double propDelayMs = 0.0;
            double queueDelayMs = 0.0;
            double procDelayMs = 0.0;

            // 1. Link Propagation and Queuing
            Route route = routes.get(c.getId());
            if (route != null) {
                for (String linkId : route.getLinkIds()) {
                    NetworkLink link = networkGraph.getLink(linkId);
                    if (link != null) {
                        propDelayMs += link.getPropagationDelayMs();
                        SharedResourceQueue srq = new SharedResourceQueue(link.getBandwidth());
                        srq.addCommodityFlow(c.getId(), c.getArrivalRate(), 1.0);
                        queueDelayMs += srq.calculateSojournTimeMs(c.getId());
                    }
                }
            }

            // 2. Compute Processing Delay on Node
            if (c.getFunctionId() != null) {
                String nodeId = placement.getNode(c.getFunctionId());
                if (nodeId != null) {
                    NetworkNode node = networkGraph.getNode(nodeId);
                    double computeRate = resourceAllocation.getRate(nodeId, "compute");
                    SharedResourceQueue nodeQueue = new SharedResourceQueue(computeRate > 0 ? computeRate : node.getCapacity("compute"));
                    nodeQueue.addCommodityFlow(c.getId(), c.getArrivalRate(), 1.0);
                    procDelayMs += nodeQueue.calculateSojournTimeMs(c.getId());
                }
            }

            // DAG dependency constraint (b3)-(b4): l_T^k >= l_T^j + l^k
            double maxParent = 0.0;
            for (String pId : c.getInputCommodities()) {
                maxParent = Math.max(maxParent, cumulativeDelays.getOrDefault(pId, 0.0));
            }

            double totalCum = maxParent + propDelayMs + queueDelayMs + procDelayMs;
            cumulativeDelays.put(c.getId(), totalCum);

            results.put(c.getId(), new CommodityDelayResult(
                    c.getId(), propDelayMs, queueDelayMs, procDelayMs, totalCum, c.getMaxLatencyMs()
            ));
        }

        return new ApplicationDelayResult(serviceGraph.getId(), results);
    }
}`
  },
  {
    path: 'src/main/java/com/sparq/demo/Main.java',
    filename: 'Main.java',
    package: 'com.sparq.demo',
    category: 'demo',
    description: 'CLI Demonstration reproducing Experiment A, B and Monte Carlo Simulation',
    code: `package com.sparq.demo;

import com.sparq.model.*;
import com.sparq.optimization.OptimizationResult;
import com.sparq.optimization.SparqOptimizationEngine;
import com.sparq.simulation.SignalGenerator;
import com.sparq.simulation.SignalProcessor;
import com.sparq.simulation.SignalResult;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("   SPARQ: Optimization Framework for AI Applications Under Non-Linear Delays   ");
        System.out.println("          IEEE Transactions on Network and Service Management (TNSM 2026)      ");
        System.out.println("================================================================================\\n");

        // 1. Experiment A
        System.out.println(">>> RUNNING EXPERIMENT A: LLM + STT Co-location & Edge Offloading");
        NetworkGraph netA = buildExperimentANetwork();
        ServiceGraph sfcA = buildExperimentAServiceGraph(68.0);
        SparqOptimizationEngine engineA = new SparqOptimizationEngine(netA, sfcA);
        OptimizationResult resultA = engineA.optimize(10, 0.01);
        System.out.printf("    [Result] Total Hourly Cost : $%.2f / hr\\n", resultA.getBestSolution().getTotalCost());
        System.out.printf("    [Result] Max E2E Latency   : %.2f ms\\n", resultA.getBestSolution().getDelayResult().getMaxEndToEndDelayMs());

        // 2. Experiment B
        System.out.println("\\n>>> RUNNING EXPERIMENT B: FANTASIA AR Holographic Communication");
        NetworkGraph netB = buildExperimentBNetwork();
        ServiceGraph sfcB = buildExperimentBServiceGraph(150.0);
        SparqOptimizationEngine engineB = new SparqOptimizationEngine(netB, sfcB);
        OptimizationResult resultB = engineB.optimize(10, 0.01);
        System.out.printf("    [Result] Total Hourly Cost : $%.2f / hr (UE Offloaded at zero cost)\\n", resultB.getBestSolution().getTotalCost());

        // 3. Monte Carlo Simulation
        System.out.println("\\n>>> RUNNING MONTE CARLO QUEUE SIMULATION (1,000 Requests)");
        SignalGenerator gen = new SignalGenerator();
        List<Signal> signals = gen.generatePoissonStream("k_test", 65.0, 1000);
        SignalProcessor proc = new SignalProcessor();
        SignalResult sim = proc.processQueue(signals, 100.0, 1.0, 28.57);
        System.out.printf("    [Validation] Empirical Mean Sojourn : %.2f ms (Error: %.2f%%)\\n",
                sim.getEmpiricalMeanDelayMs(), sim.getRelativeErrorPercent());
    }
}`
  }
];
