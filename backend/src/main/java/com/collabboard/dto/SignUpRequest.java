package com.collabboard.dto;
import jakarta.validation.constraints.*;
public record SignUpRequest(@NotBlank @Size(max=80) String name,@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(min=10,max=72) String password,@NotBlank String confirmPassword){}
