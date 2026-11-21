package com.collabboard.dto;

import java.time.Instant;

public record ChatMessageResponse(String id, String roomId, String senderId, String senderName, String content, Instant createdAt) { }
