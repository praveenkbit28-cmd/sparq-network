package com.sparq.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Path of network links traversed by a commodity k.
 */
public class Route {
    private final String commodityId;
    private final List<String> linkIds;

    public Route(String commodityId) {
        this.commodityId = commodityId;
        this.linkIds = new ArrayList<>();
    }

    public void addLink(String linkId) { linkIds.add(linkId); }
    public String getCommodityId() { return commodityId; }
    public List<String> getLinkIds() { return linkIds; }
}
