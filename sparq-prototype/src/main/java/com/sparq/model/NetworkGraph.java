package com.sparq.model;

import java.util.*;

/**
 * Represents the augmented edge-cloud graph G^a = (V^a, E^a).
 */
public class NetworkGraph {
    private final Map<String, NetworkNode> nodes;
    private final Map<String, NetworkLink> links;
    private final Map<String, List<NetworkLink>> outgoingLinks;

    public NetworkGraph() {
        this.nodes = new HashMap<>();
        this.links = new HashMap<>();
        this.outgoingLinks = new HashMap<>();
    }

    public void addNode(NetworkNode node) {
        nodes.put(node.getId(), node);
        outgoingLinks.putIfAbsent(node.getId(), new ArrayList<>());
    }

    public void addLink(NetworkLink link) {
        links.put(link.getId(), link);
        outgoingLinks.computeIfAbsent(link.getSourceId(), k -> new ArrayList<>()).add(link);
    }

    public NetworkNode getNode(String id) { return nodes.get(id); }
    public NetworkLink getLink(String id) { return links.get(id); }
    public Collection<NetworkNode> getNodes() { return nodes.values(); }
    public Collection<NetworkLink> getLinks() { return links.values(); }
    public List<NetworkLink> getOutgoingLinks(String nodeId) {
        return outgoingLinks.getOrDefault(nodeId, Collections.emptyList());
    }
}
