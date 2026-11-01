package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.SalonService;
import Salon.SalonManagementSystem.repository.SalonServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class SalonServiceController {

    @Autowired
    private SalonServiceRepository salonServiceRepository;

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<SalonService>> getByBranch(@PathVariable Integer branchId) {
        return ResponseEntity.ok(salonServiceRepository.findByBranch_Id(branchId));
    }

    @GetMapping
    public ResponseEntity<List<SalonService>> getAll() {
        return ResponseEntity.ok(salonServiceRepository.findAll());
    }

    private String validate(SalonService s) {
        if (s.getName() == null || s.getName().isBlank()) return "Service name is required";
        if (s.getPrice() == null || s.getPrice().signum() <= 0) return "Price must be greater than zero";
        if (s.getDurationMins() == null || s.getDurationMins() <= 0) return "Duration must be greater than zero";
        if (s.getBranch() == null) return "Branch is required";
        return null;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody SalonService service) {
        String problem = validate(service);
        if (problem != null) return ResponseEntity.badRequest().body(problem);
        return ResponseEntity.ok(salonServiceRepository.save(service));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody SalonService service) {
        String problem = validate(service);
        if (problem != null) return ResponseEntity.badRequest().body(problem);
        return salonServiceRepository.findById(id)
                .<ResponseEntity<?>>map(existing -> {
                    existing.setName(service.getName());
                    existing.setCategory(service.getCategory());
                    existing.setPrice(service.getPrice());
                    existing.setDurationMins(service.getDurationMins());
                    existing.setBranch(service.getBranch());
                    return ResponseEntity.ok(salonServiceRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (!salonServiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            salonServiceRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).body("This service appears in past sales and can't be deleted.");
        }
    }
}
