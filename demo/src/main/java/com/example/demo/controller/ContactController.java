package com.example.demo.controller;

import com.example.demo.dto.ContactMessageRequest;
import com.example.demo.model.ContactMessage;
import com.example.demo.service.ContactService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createMessage(@Valid @RequestBody ContactMessageRequest request) {
        ContactMessage saved = contactService.save(request);
        return Map.of(
            "id", saved.getId(),
            "message", "Contact message saved successfully"
        );
    }
}
