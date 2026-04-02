package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ProductUpsertRequest(
    @NotBlank String name,
    String description,
    String imageUrl,
    @NotNull @DecimalMin("0.0") BigDecimal price,
    @DecimalMin("0.0") BigDecimal originalPrice,
    Double rating,
    @Min(0) Integer reviewCount,
    @NotNull @Min(0) Integer stock,
    @NotNull Long categoryId,
    Boolean active
) {
}
