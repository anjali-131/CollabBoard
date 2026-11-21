package com.collabboard.dto;
import jakarta.validation.constraints.*;
public record RenameBoardRequest(@NotBlank @Size(max=120)String title){}
