package com.sparq.demo;

import com.sparq.model.*;
import com.sparq.optimization.OptimizationResult;
import com.sparq.optimization.SparqOptimizationEngine;
import com.sparq.simulation.SignalGenerator;
import com.sparq.simulation.SignalProcessor;
import com.sparq.simulation.SignalResult;

import java.util.List;

/**
 * Main command-line demonstration for the SPARQ Optimization Framework.
 * Replicates Experiment A (Section VI-A) and Experiment B (Section VI-B) from the IEEE TNSM paper.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("   SPARQ: Optimization Framework for AI Applications Under Non-Linear Delays   ");
        System.out.println("          IEEE Transactions on Network and Service Management (TNSM 2026)      ");
        System.out.println("================================================================================\n");

        // ---------------------------------------------------------------------
        // 1. Run Experiment A (LLM + Speech-to-Text Co-Location)
        // ---------------------------------------------------------------------
        System.out.println(">>> RUNNING EXPERIMENT A: LLM + STT Co-location & Edge Offloading");
        System.out.println("    LLM Lambda = 70 req/s, STT Lambda = 68 req/s (Edge Activation Threshold)");

        NetworkGraph netA = buildExperimentANetwork();
        ServiceGraph sfcA = buildExperimentAServiceGraph(68.0);

        SparqOptimizationEngine engineA = new SparqOptimizationEngine(netA, sfcA);
        OptimizationResult resultA = engineA.optimize(10, 0.01);

        System.out.printf("    [Result] Total Iterations : %d\n", resultA.getTotalIterations());
        System.out.printf("    [Result] Solver Execution  : %.1f ms\n", resultA.getExecutionTimeMs());
        if (resultA.getBestSolution() != null) {
            System.out.printf("    [Result] Total Hourly Cost : $%.2f / hr\n", resultA.getBestSolution().getTotalCost());
            System.out.printf("    [Result] Compute Cost      : $%.2f / hr\n", resultA.getBestSolution().getCostBreakdown().getComputeCost());
            System.out.printf("    [Result] Network Cost      : $%.2f / hr\n", resultA.getBestSolution().getCostBreakdown().getNetworkCost());
            System.out.printf("    [Result] Max E2E Latency   : %.2f ms\n", resultA.getBestSolution().getDelayResult().getMaxEndToEndDelayMs());
            System.out.printf("    [Result] Feasibility       : %s\n", resultA.getBestSolution().isFeasible() ? "FEASIBLE (Within Deadlines)" : "VIOLATION");
        }
        System.out.println();

        // ---------------------------------------------------------------------
        // 2. Run Experiment B (FANTASIA Augmented Reality Holographic App)
        // ---------------------------------------------------------------------
        System.out.println(">>> RUNNING EXPERIMENT B: FANTASIA AR Holographic Communication");
        System.out.println("    Testing Latency Bound L^k8 = 150 ms (> 140 ms threshold -> UE Offloading Active)");

        NetworkGraph netB = buildExperimentBNetwork();
        ServiceGraph sfcB = buildExperimentBServiceGraph(150.0);

        SparqOptimizationEngine engineB = new SparqOptimizationEngine(netB, sfcB);
        OptimizationResult resultB = engineB.optimize(10, 0.01);

        if (resultB.getBestSolution() != null) {
            System.out.printf("    [Result] Total Hourly Cost : $%.2f / hr (Reduced by zero-cost UE offload)\n",
                    resultB.getBestSolution().getTotalCost());
            System.out.printf("    [Result] Max E2E Latency   : %.2f ms (Target <= 150 ms)\n",
                    resultB.getBestSolution().getDelayResult().getMaxEndToEndDelayMs());
            System.out.printf("    [Result] Feasibility       : %s\n",
                    resultB.getBestSolution().isFeasible() ? "FEASIBLE" : "VIOLATION");
        }
        System.out.println();

        // ---------------------------------------------------------------------
        // 3. Run Monte Carlo Stochastic Queue Simulation
        // ---------------------------------------------------------------------
        System.out.println(">>> RUNNING STOCHASTIC MONTE CARLO QUEUE SIMULATION (1,000 Requests)");
        SignalGenerator generator = new SignalGenerator();
        List<Signal> signals = generator.generatePoissonStream("k_test", 65.0, 1000);

        SignalProcessor processor = new SignalProcessor();
        double theoreticalDelayMs = 28.57; // from M/M/1 formula at lambda=65, mu=100
        SignalResult simResult = processor.processQueue(signals, 100.0, 1.0, theoreticalDelayMs);

        System.out.printf("    [Validation] Theoretical Expected Delay : %.2f ms\n", simResult.getTheoreticalDelayMs());
        System.out.printf("    [Validation] Empirical Mean Sojourn      : %.2f ms\n", simResult.getEmpiricalMeanDelayMs());
        System.out.printf("    [Validation] Relative Error              : %.2f %%\n", simResult.getRelativeErrorPercent());
        System.out.printf("    [Validation] 95th Percentile Delay       : %.2f ms\n", simResult.getPercentile95Ms());
        System.out.printf("    [Validation] 99th Percentile Delay       : %.2f ms\n", simResult.getPercentile99Ms());

        System.out.println("\n================================================================================");
        System.out.println("   SPARQ Framework execution completed successfully!                            ");
        System.out.println("================================================================================");
    }

    private static NetworkGraph buildExperimentANetwork() {
        NetworkGraph g = new NetworkGraph();

        NetworkNode user = new NetworkNode("u_user", "User Domain", NodeType.USER, false);
        NetworkNode edge = new NetworkNode("v_edge", "Metro Edge Node", NodeType.EDGE, true);
        edge.addResource("compute", 250.0, 4.2);

        NetworkNode cloud = new NetworkNode("w_cloud", "Core Cloud DC", NodeType.CLOUD, true);
        cloud.addResource("compute", 1000.0, 1.8);

        g.addNode(user);
        g.addNode(edge);
        g.addNode(cloud);

        g.addLink(new NetworkLink("l_ue", "u_user", "v_edge", ResourceModel.SR, 1000.0, 5.0, 0.05));
        g.addLink(new NetworkLink("l_ec", "v_edge", "w_cloud", ResourceModel.SR, 1000.0, 25.0, 0.12));
        g.addLink(new NetworkLink("l_uc", "u_user", "w_cloud", ResourceModel.SR, 1000.0, 30.0, 0.15));

        return g;
    }

    private static ServiceGraph buildExperimentAServiceGraph(double sttArrivalRate) {
        ServiceGraph sg = new ServiceGraph("sfc_exp_a", "LLM + Speech-to-Text Multi-Tenant AI Service");

        ServiceFunction fnLLM = new ServiceFunction("fn_llm", "Large Language Model", "sfc_exp_a", ResourceModel.SR);
        fnLLM.setRequirement("compute", 1.0);

        ServiceFunction fnSTT = new ServiceFunction("fn_stt", "Speech to Text", "sfc_exp_a", ResourceModel.SR);
        fnSTT.setRequirement("compute", 1.0);

        sg.addFunction(fnLLM);
        sg.addFunction(fnSTT);

        Commodity cLLM = new Commodity("k_llm", "LLM Stream", "sfc_exp_a", "fn_llm",
                "u_user", "u_user", 70.0, 100.0, true, true);

        Commodity cSTT = new Commodity("k_stt", "STT Stream", "sfc_exp_a", "fn_stt",
                "u_user", "u_user", sttArrivalRate, 100.0, true, true);

        sg.addCommodity(cLLM);
        sg.addCommodity(cSTT);

        return sg;
    }

    private static NetworkGraph buildExperimentBNetwork() {
        NetworkGraph g = new NetworkGraph();

        NetworkNode user = new NetworkNode("u_user", "AR Headset User", NodeType.USER, false);

        NetworkNode ue = new NetworkNode("v_ue", "User Equipment (UE)", NodeType.UE, true);
        ue.addResource("compute", 50.0, 0.0); // Zero operational cost!

        NetworkNode edge = new NetworkNode("v_edge", "Edge 5G UPF Server", NodeType.EDGE, true);
        edge.addResource("compute", 300.0, 4.5);

        NetworkNode cloud = new NetworkNode("w_cloud", "Hyperscale Cloud", NodeType.CLOUD, true);
        cloud.addResource("compute", 1200.0, 1.8);

        g.addNode(user);
        g.addNode(ue);
        g.addNode(edge);
        g.addNode(cloud);

        g.addLink(new NetworkLink("l_u_ue", "u_user", "v_ue", ResourceModel.SR, 1000.0, 1.0, 0.0));
        g.addLink(new NetworkLink("l_ue_edge", "v_ue", "v_edge", ResourceModel.SR, 1000.0, 4.0, 0.04));
        g.addLink(new NetworkLink("l_edge_cloud", "v_edge", "w_cloud", ResourceModel.SR, 1000.0, 20.0, 0.10));

        return g;
    }

    private static ServiceGraph buildExperimentBServiceGraph(double maxLatencyK8) {
        ServiceGraph sg = new ServiceGraph("sfc_fantasia", "FANTASIA AR Holographic Pipeline");

        ServiceFunction fnPose = new ServiceFunction("fn_pose", "3D Pose Estimator", "sfc_fantasia", ResourceModel.SR);
        ServiceFunction fnRender = new ServiceFunction("fn_render", "Neural Radiance Renderer", "sfc_fantasia", ResourceModel.SR);

        sg.addFunction(fnPose);
        sg.addFunction(fnRender);

        Commodity k1 = new Commodity("k1", "Camera RGB Video", "sfc_fantasia", null,
                "u_user", "v_ue", 60.0, 40.0, true, false);

        Commodity k7 = new Commodity("k7", "Pose Intermediate", "sfc_fantasia", "fn_pose",
                "v_ue", "v_edge", 60.0, 80.0, false, false);
        k7.addInputCommodity("k1");

        Commodity k8 = new Commodity("k8", "Rendered Hologram Output", "sfc_fantasia", "fn_render",
                "v_edge", "u_user", 60.0, maxLatencyK8, false, true);
        k8.addInputCommodity("k7");

        sg.addCommodity(k1);
        sg.addCommodity(k7);
        sg.addCommodity(k8);

        return sg;
    }
}
