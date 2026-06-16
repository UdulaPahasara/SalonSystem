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

    @PostMapping
    public ResponseEntity<SalonService> create(@RequestBody SalonService service) {
        return ResponseEntity.ok(salonServiceRepository.save(service));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalonService> update(@PathVariable Integer id, @RequestBody SalonService service) {
        return salonServiceRepository.findById(id)
                .map(existing -> {
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
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!salonServiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        salonServiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
