package com.collabboard.dto;
import jakarta.validation.constraints.*;
public record CreateRoomRequest(@Size(max=120) String title) {}
