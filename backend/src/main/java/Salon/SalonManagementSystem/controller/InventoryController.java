package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.InventoryViewDTO;
import Salon.SalonManagementSystem.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping("/product/{productId}")
    public List<InventoryViewDTO> byProduct(@PathVariable Integer productId) {
        return service.getByProduct(productId);
    }

    /**
     * Get inventory for a product filtered by Product Manager's assigned branches
     */
    @GetMapping("/product/{productId}/manager/{userId}")
    public List<InventoryViewDTO> byProductAndManager(
            @PathVariable Integer productId,
            @PathVariable Integer userId) {
        return service.getByProductAndManager(productId, userId);
    }

    @GetMapping("/branch/{branchId}")
    public List<InventoryViewDTO> byBranch(@PathVariable Integer branchId) {
        return service.getByBranch(branchId);
    }
}
