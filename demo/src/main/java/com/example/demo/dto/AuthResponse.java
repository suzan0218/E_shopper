package com.example.demo.dto;

public record AuthResponse(
    String message,
    String token,
    AuthUserResponse user
) {
}
