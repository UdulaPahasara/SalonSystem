package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.ContactMessage;
import Salon.SalonManagementSystem.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contact-messages")
public class ContactMessageController {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Map<String, String> body) {
        String fullName = trim(body.get("fullName"));
        String email = trim(body.get("email"));
        String message = trim(body.get("message"));

        if (fullName == null || fullName.isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required.");
        }
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }
        if (message == null || message.isEmpty()) {
            return ResponseEntity.badRequest().body("Message is required.");
        }

        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setFullName(fullName);
        contactMessage.setEmail(email);
        contactMessage.setPhone(trim(body.get("phone")));
        contactMessage.setMessage(message);

        return ResponseEntity.status(HttpStatus.CREATED).body(contactMessageRepository.save(contactMessage));
    }

    @GetMapping
    public ResponseEntity<List<ContactMessage>> listAll() {
        return ResponseEntity.ok(contactMessageRepository.findAllByOrderByCreatedAtDesc());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!contactMessageRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        contactMessageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
