package com.collabboard.dto;
import java.time.Instant;
public record BoardSummary(String roomId,String title,String ownerName,String access,Instant createdAt,Instant updatedAt){}
