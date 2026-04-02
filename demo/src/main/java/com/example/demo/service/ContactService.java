package com.example.demo.service;

import com.example.demo.dto.ContactMessageRequest;
import com.example.demo.model.ContactMessage;
import com.example.demo.repository.ContactMessageRepository;
import org.springframework.stereotype.Service;

@Service
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;

    public ContactService(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    public ContactMessage save(ContactMessageRequest request) {
        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setName(request.name());
        contactMessage.setEmail(request.email());
        contactMessage.setSubject(request.subject());
        contactMessage.setMessage(request.message());
        return contactMessageRepository.save(contactMessage);
    }
}
