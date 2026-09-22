package com.sparq.optimization;

import com.sparq.model.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SparqOptimizationEngineTest {

    @Test
    public void testOptimizerConvergence() {
        NetworkGraph g = new NetworkGraph();
        NetworkNode u = new NetworkNode("u", "User", NodeType.USER, false);
        NetworkNode edge = new NetworkNode("edge", "Edge", NodeType.EDGE, true);
        edge.addResource("compute", 500.0, 3.0);
        g.addNode(u);
        g.addNode(edge);
        g.addLink(new NetworkLink("l1", "u", "edge", ResourceModel.SR, 1000.0, 2.0, 0.01));

        ServiceGraph sg = new ServiceGraph("sg1", "Test SFC");
        ServiceFunction fn = new ServiceFunction("fn1", "AI Service", "sg1", ResourceModel.SR);
        sg.addFunction(fn);
        sg.addCommodity(new Commodity("k1", "Stream 1", "sg1", "fn1", "u", "edge", 50.0, 80.0, true, true));

        SparqOptimizationEngine engine = new SparqOptimizationEngine(g, sg);
        OptimizationResult result = engine.optimize(5, 0.01);

        assertNotNull(result);
        assertEquals(5, result.getTotalIterations());
        assertNotNull(result.getBestSolution());
        assertTrue(result.getBestSolution().getTotalCost() > 0);
    }
}
