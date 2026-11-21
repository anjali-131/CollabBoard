package com.collabboard.dto;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record BoardEvent(String type, String clientId, Long baseVersion, JsonNode elements,
                         String title, Double x, Double y, String color, String label,
                         JsonNode upserts, List<String> removedIds) {
    public BoardEvent(String type, String clientId, Long baseVersion, JsonNode elements,
                      String title, Double x, Double y, String color, String label) {
        this(type, clientId, baseVersion, elements, title, x, y, color, label, null, null);
    }
}
