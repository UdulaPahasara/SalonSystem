package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.Dto.InventoryViewDTO;
import Salon.SalonManagementSystem.model.BranchInventory;
import Salon.SalonManagementSystem.repository.BranchInventoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    private final BranchInventoryRepository repo;

    public InventoryService(BranchInventoryRepository repo) {
        this.repo = repo;
    }

    /**
     * Get inventory for a product across ALL branches (for Owner/Admin)
     */
    public List<InventoryViewDTO> getByProduct(Integer productId) {
        return repo.findByProduct_ProductId(productId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Get inventory for a product filtered by Product Manager's assigned branches
     */
    public List<InventoryViewDTO> getByProductAndManager(Integer productId, Integer userId) {
        return repo.findByProductAndManager(productId, userId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<InventoryViewDTO> getByBranch(Integer branchId) {
        return repo.findInventoryByBranchId(branchId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Helper method to convert BranchInventory to DTO
     */
    private InventoryViewDTO toDTO(BranchInventory i) {
        InventoryViewDTO dto = new InventoryViewDTO();
        dto.setInventoryId(i.getInventoryId());
        dto.setBranchId(i.getBranch().getId());
        dto.setBranchName(i.getBranch().getBranchName());
        dto.setQuantity(i.getQuantity());

        if (i.getProduct() != null) {
            dto.setProductId(i.getProduct().getProductId());
            dto.setProductName(i.getProduct().getProductName());
            dto.setUnitPrice(i.getProduct().getUnitPrice());
        }
        return dto;
    }
}