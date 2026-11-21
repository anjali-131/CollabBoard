package com.collabboard.dto;
import com.fasterxml.jackson.databind.JsonNode;import java.time.Instant;
public record RoomResponse(String roomId,String title,JsonNode elements,long version,Instant createdAt,Instant updatedAt,String ownerName,String ownerId){}
