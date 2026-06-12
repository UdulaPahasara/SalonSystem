package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.StockRequestCreateDTO;
import Salon.SalonManagementSystem.model.StockRequest;
import Salon.SalonManagementSystem.service.StockRequestService;
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
    public StockRequest approve(@PathVariable Integer id) {
        return service.approve(id);
    }

    @PutMapping("/{id}/reject")
    public StockRequest reject(@PathVariable Integer id) {
        return service.reject(id);
    }
}
