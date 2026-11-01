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

    // simple in-memory limit: 5 messages per address per hour
    private final java.util.Map<String, java.util.Deque<Long>> recent = new java.util.concurrent.ConcurrentHashMap<>();

    private boolean tooManyFrom(String ip) {
        long now = System.currentTimeMillis();
        java.util.Deque<Long> times = recent.computeIfAbsent(ip, k -> new java.util.concurrent.ConcurrentLinkedDeque<>());
        times.removeIf(t -> now - t > 3_600_000L);
        if (times.size() >= 5) return true;
        times.add(now);
        return false;
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Map<String, String> body, jakarta.servlet.http.HttpServletRequest request) {
        if (tooManyFrom(request.getRemoteAddr())) {
            return ResponseEntity.status(429).body("Too many messages from your connection. Please try again later or call us.");
        }
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

        if (fullName.length() > 100 || email.length() > 150 || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return ResponseEntity.badRequest().body("Enter a valid name and email address.");
        }
        if (message.length() > 2000) {
            return ResponseEntity.badRequest().body("Message is too long (2,000 characters at most).");
        }
        String phone = trim(body.get("phone"));
        if (phone != null && phone.length() > 30) {
            return ResponseEntity.badRequest().body("Phone number is too long.");
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
