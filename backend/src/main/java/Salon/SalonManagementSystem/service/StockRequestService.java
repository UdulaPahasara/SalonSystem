package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.Dto.StockRequestCreateDTO;
import Salon.SalonManagementSystem.model.*;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.ProductRepository;
import Salon.SalonManagementSystem.repository.StockRequestRepository;
import Salon.SalonManagementSystem.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockRequestService {

    private final StockRequestRepository repo;
    private final ProductRepository productRepo;
    private final BranchRepository branchRepo;
    private final UsersRepository usersRepo;
    private final Salon.SalonManagementSystem.repository.BranchInventoryRepository inventoryRepo;

    public StockRequestService(
            StockRequestRepository repo,
            ProductRepository productRepo,
            BranchRepository branchRepo,
            UsersRepository usersRepo,
            Salon.SalonManagementSystem.repository.BranchInventoryRepository inventoryRepo) {
        this.repo = repo;
        this.productRepo = productRepo;
        this.branchRepo = branchRepo;
        this.usersRepo = usersRepo;
        this.inventoryRepo = inventoryRepo;
    }

    public StockRequest create(StockRequestCreateDTO dto) {
        StockRequest request = new StockRequest();

        request.setProduct(productRepo.findById(dto.getProductId()).orElseThrow());
        request.setBranch(branchRepo.findById(dto.getBranchId()).orElseThrow());
        request.setRequestedBy(usersRepo.findById(dto.getRequestedBy()).orElseThrow());

        request.setRequestedQuantity(dto.getRequestedQuantity());
        request.setStatus("PENDING");

        return repo.save(request);
    }

    public List<StockRequest> getByBranch(Integer id) {
        return repo.findByBranch_Id(id);
    }

    public StockRequest approve(Integer id) {
        StockRequest request = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock request not found"));

        System.out.println("Approving Stock Request ID: " + id + " for Product: "
                + request.getProduct().getProductName() + " Branch: " + request.getBranch().getBranchName());

        // Update Inventory
        Salon.SalonManagementSystem.model.BranchInventory inventory = inventoryRepo
                .findInventoryByBranchAndProduct(request.getBranch(), request.getProduct())
                .orElse(null);

        if (inventory == null) {
            System.out.println("Inventory not found. Creating new record.");
            // Create new inventory record if it doesn't exist
            inventory = new Salon.SalonManagementSystem.model.BranchInventory();
            inventory.setBranch(request.getBranch());
            inventory.setProduct(request.getProduct());
            inventory.setQuantity(request.getRequestedQuantity());
            // Default low stock limit from product if available or default 10
            inventory.setLowStockLimit(
                    request.getProduct().getLowStockLimit() != null ? request.getProduct().getLowStockLimit() : 10);
        } else {
            System.out.println("Inventory found. Current Qty: " + inventory.getQuantity() + ". Adding: "
                    + request.getRequestedQuantity());
            // Update existing
            inventory.setQuantity(inventory.getQuantity() + request.getRequestedQuantity());
        }
        Salon.SalonManagementSystem.model.BranchInventory saved = inventoryRepo.save(inventory);
        System.out.println("Inventory saved. New Qty: " + saved.getQuantity());

        request.setStatus("APPROVED");
        return repo.save(request);
    }

    public StockRequest reject(Integer id) {
        StockRequest request = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock request not found"));

        request.setStatus("REJECTED");
        return repo.save(request);
    }

    public List<StockRequest> getAll() {
        return repo.findAll();
    }
}
