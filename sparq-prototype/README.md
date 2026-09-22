# SPARQ: Optimization Framework for AI-Intensive Workloads (Java Implementation)

Official Java reference implementation of the SPARQ framework from:
> **"SPARQ: An Optimization Framework for the Distribution of AI-Intensive Applications Under Non-Linear Delay Constraints"**
> *IEEE Transactions on Network and Service Management (TNSM 2026)*
> Authors: Paolo Spadaccino, Paolo Di Lorenzo, Sergio Barbarossa, Antonia M. Tulino, Jaime Llorca.

---

## 🚀 Quick Start (Maven)

### Prerequisites
- **JDK 17** or higher
- **Apache Maven 3.8+**

### 1. Compile Codebase
```bash
cd sparq-prototype
mvn clean compile
```

### 2. Run All Unit Tests
```bash
mvn test
```

### 3. Run Experiment A, Experiment B & Stochastic Simulation Demo
```bash
mvn exec:java
```

---

## 📦 Project Architecture & Package Structure

```
sparq-prototype/
├── pom.xml
├── README.md
└── src/
    ├── main/java/com/sparq/
    │   ├── model/           # G^a graph, nodes, links, commodities, SFC DAGs, placements, routes
    │   │   ├── NodeType.java
    │   │   ├── ResourceModel.java (GR, SR)
    │   │   ├── NetworkNode.java
    │   │   ├── NetworkLink.java
    │   │   ├── NetworkGraph.java
    │   │   ├── ServiceFunction.java
    │   │   ├── Commodity.java
    │   │   ├── ServiceGraph.java
    │   │   ├── Placement.java
    │   │   ├── Route.java
    │   │   ├── Signal.java
    │   │   └── ResourceAllocation.java
    │   ├── queue/           # M/M/1 (GR) & M/G/1 Pollaczek-Khinchine (SR) mathematical delay queues
    │   │   ├── QueueModel.java
    │   │   ├── GuaranteedResourceQueue.java  # Equations (1), (12), (13)
    │   │   └── SharedResourceQueue.java      # Equations (2)-(11), (14), (18)
    │   ├── delay/           # DAG cumulative non-linear delay calculator
    │   │   ├── CommodityDelayResult.java
    │   │   ├── ApplicationDelayResult.java
    │   │   └── DelayCalculator.java          # Constraints (b1)-(b5)
    │   ├── routing/         # Dijkstra and multi-commodity flow routing
    │   │   ├── RouteMetric.java
    │   │   ├── RoutingException.java
    │   │   ├── DijkstraRouter.java
    │   │   └── RoutingEngine.java
    │   ├── placement/       # Edge, Cloud, UE service function placement
    │   │   ├── PlacementException.java
    │   │   └── PlacementEngine.java
    │   ├── resource/        # Subproblem P2 convex resource rate allocation
    │   │   ├── ResourceAllocationException.java
    │   │   └── ResourceAllocator.java
    │   ├── cost/            # Operational deployment cost calculator
    │   │   ├── CostBreakdown.java
    │   │   └── CostCalculator.java           # Problem P objective function
    │   ├── validation/      # Feasibility validation against constraints (a1)-(e4)
    │   │   ├── FeasibilityResult.java
    │   │   └── ConstraintValidator.java
    │   ├── optimization/    # SPARQ Algorithm 1 biconvex alternating minimization
    │   │   ├── CandidateSolution.java
    │   │   ├── OptimizationResult.java
    │   │   └── SparqOptimizationEngine.java  # Algorithm 1
    │   ├── simulation/      # Monte Carlo stochastic discrete-event packet simulation
    │   │   ├── SignalResult.java
    │   │   ├── SignalGenerator.java          # Poisson request streams
    │   │   └── SignalProcessor.java          # Discrete-event processing
    │   └── demo/
    │       └── Main.java                     # Replicates Experiments A, B & Sim
    └── test/java/com/sparq/
        ├── queue/
        │   ├── GuaranteedResourceQueueTest.java
        │   └── SharedResourceQueueTest.java
        └── optimization/
            └── SparqOptimizationEngineTest.java
```

---

## 📐 Mathematical Equations Implemented

1. **Guaranteed-Resource (GR) M/M/1 Model** (`GuaranteedResourceQueue.java`):
   $$E[D_{uv}^{k,r}] = \frac{R_{uv}^{k,r}}{\mu_{uv}^{k,r} - f_{uv}^k \Lambda^{\phi(k)} R_{uv}^{k,r}}$$

2. **Shared-Resource (SR) M/G/1 Pollaczek-Khinchine Model** (`SharedResourceQueue.java`):
   $$E[W_{uv}^r] = \frac{\Lambda_{uv}^r E[(X_{uv}^r)^2]}{2(1 - \rho_{uv}^r)}$$
   $$E[(X_{uv}^r)^2] = \sum_j \frac{f_{uv}^j \Lambda^{\phi(j)}}{\Lambda_{uv}^r} \frac{2 (R_{uv}^{j,r})^2}{(\mu_{uv}^r)^2}$$
   $$E[D_{uv}^{k,r}] = E[W_{uv}^r] + \frac{R_{uv}^{k,r}}{\mu_{uv}^r}$$

3. **$\epsilon$-Safety Convexification** (`SharedResourceQueue.java`):
   $$E[\bar{D}_{uv}^{k,r}(f, \mu, \epsilon)] = \frac{\sum_j f_{uv}^j \Lambda^{\phi(j)} (R_{uv}^{j,r})^2}{\epsilon_{uv}^r (\mu_{uv}^r)^2} + \frac{R_{uv}^{k,r}}{\mu_{uv}^r}$$

4. **SPARQ Algorithm 1 Step Size Sequence**:
   $$\gamma_i = \frac{1}{(1 + 0.15 \cdot i)^{0.65}}$$
