package com.example.demo.dto;

public record AuthUserResponse(
    Long id,
    String name,
    String email,
    String role
) {
}
