package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.StockRequestCreateDTO;
import Salon.SalonManagementSystem.model.StockRequest;
import Salon.SalonManagementSystem.service.StockRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-requests")
@CrossOrigin
public class StockRequestController {

    private final StockRequestService service;

    public StockRequestController(StockRequestService service) {
        this.service = service;
    }

    @GetMapping("/branch/{branchId}")
    public List<StockRequest> getByBranch(@PathVariable Integer branchId) {
        return service.getByBranch(branchId);
    }

    @GetMapping
    public List<StockRequest> getAll() {
        return service.getAll();
    }

    @PostMapping
    public StockRequest create(@RequestBody StockRequestCreateDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(service.approve(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(service.reject(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
