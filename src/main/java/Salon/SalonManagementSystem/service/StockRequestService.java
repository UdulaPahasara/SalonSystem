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
        Integer qty = dto.getRequestedQuantity();
        if (qty == null || qty < 1 || qty > 100000) throw new IllegalArgumentException("Quantity must be between 1 and 100,000.");
        if (dto.getProductId() == null || dto.getBranchId() == null) throw new IllegalArgumentException("Choose a product and a branch.");

        request.setProduct(productRepo.findById(dto.getProductId()).orElseThrow(() -> new IllegalArgumentException("Product not found.")));
        request.setBranch(branchRepo.findById(dto.getBranchId()).orElseThrow(() -> new IllegalArgumentException("Branch not found.")));
        // the requester is whoever is signed in, not whatever the client says
        Salon.SalonManagementSystem.security.AuthUser me = Salon.SalonManagementSystem.security.AuthContext.current();
        Integer by = me != null ? Integer.valueOf(me.id()) : dto.getRequestedBy();
        request.setRequestedBy(usersRepo.findById(by).orElseThrow(() -> new IllegalArgumentException("Requesting user not found.")));

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
        Salon.SalonManagementSystem.security.AuthContext.requireBranch(request.getBranch().getId());
        requirePending(request);


        // Update Inventory
        Salon.SalonManagementSystem.model.BranchInventory inventory = inventoryRepo
                .findInventoryByBranchAndProduct(request.getBranch(), request.getProduct())
                .orElse(null);

        if (inventory == null) {
            // Create new inventory record if it doesn't exist
            inventory = new Salon.SalonManagementSystem.model.BranchInventory();
            inventory.setBranch(request.getBranch());
            inventory.setProduct(request.getProduct());
            inventory.setQuantity(request.getRequestedQuantity());
            // Default low stock limit from product if available or default 10
            inventory.setLowStockLimit(
                    request.getProduct().getLowStockLimit() != null ? request.getProduct().getLowStockLimit() : 10);
        } else {
            // Update existing
            inventory.setQuantity(inventory.getQuantity() + request.getRequestedQuantity());
        }
        Salon.SalonManagementSystem.model.BranchInventory saved = inventoryRepo.save(inventory);

        request.setStatus("APPROVED");
        return repo.save(request);
    }

    public StockRequest reject(Integer id) {
        StockRequest request = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock request not found"));
        Salon.SalonManagementSystem.security.AuthContext.requireBranch(request.getBranch().getId());
        requirePending(request);

        request.setStatus("REJECTED");
        return repo.save(request);
    }

    // A request can only be decided once; approving twice would add the stock twice.
    private void requirePending(StockRequest request) {
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("This request was already " + request.getStatus().toLowerCase());
        }
    }

    public List<StockRequest> getAll() {
        return repo.findAll();
    }
}
