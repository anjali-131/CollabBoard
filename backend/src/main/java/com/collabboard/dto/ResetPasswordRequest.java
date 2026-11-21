package com.collabboard.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record ResetPasswordRequest(@NotBlank @Size(max = 128) String token,
                                   @NotBlank @Size(min = 10, max = 72) String password,
                                   @NotBlank String confirmPassword) {}
