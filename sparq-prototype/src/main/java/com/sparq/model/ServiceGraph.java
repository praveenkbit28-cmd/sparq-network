package com.sparq.model;

import java.util.*;

/**
 * Represents the service graph DAG phi consisting of interdependent service functions and commodities.
 */
public class ServiceGraph {
    private final String id;
    private final String name;
    private final Map<String, ServiceFunction> functions;
    private final Map<String, Commodity> commodities;

    public ServiceGraph(String id, String name) {
        this.id = id;
        this.name = name;
        this.functions = new HashMap<>();
        this.commodities = new HashMap<>();
    }

    public void addFunction(ServiceFunction fn) { functions.put(fn.getId(), fn); }
    public void addCommodity(Commodity c) { commodities.put(c.getId(), c); }

    public String getId() { return id; }
    public String getName() { return name; }
    public ServiceFunction getFunction(String id) { return functions.get(id); }
    public Commodity getCommodity(String id) { return commodities.get(id); }
    public Collection<ServiceFunction> getFunctions() { return functions.values(); }
    public Collection<Commodity> getCommodities() { return commodities.values(); }
}
