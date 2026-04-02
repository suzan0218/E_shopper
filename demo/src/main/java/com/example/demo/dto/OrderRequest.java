package com.example.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record OrderRequest(
    @NotBlank(message = "customerName is required")
    String customerName,
    @NotBlank(message = "email is required")
    @Email(message = "email is invalid")
    String email,
    @NotBlank(message = "phone is required")
    String phone,
    @NotBlank(message = "addressLine is required")
    String addressLine,
    String notes,
    @NotEmpty(message = "items are required")
    List<@Valid OrderItemRequest> items
) {
}
