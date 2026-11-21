package com.collabboard.dto;
import jakarta.validation.constraints.*;
public record InviteRequest(@Min(1) @Max(168)long expiresHours){}
