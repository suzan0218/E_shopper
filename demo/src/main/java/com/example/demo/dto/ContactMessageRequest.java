package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ContactMessageRequest(
    @NotBlank(message = "Name is required")
    String name,
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    String email,
    @NotBlank(message = "Subject is required")
    String subject,
    @NotBlank(message = "Message is required")
    String message
) {
}
