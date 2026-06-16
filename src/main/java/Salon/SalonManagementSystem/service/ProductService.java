package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.model.BranchInventory;
import Salon.SalonManagementSystem.model.Product;
import Salon.SalonManagementSystem.repository.BranchInventoryRepository;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repo;
    private final BranchRepository branchRepo;
    private final BranchInventoryRepository inventoryRepo;

    public ProductService(ProductRepository repo,
            BranchRepository branchRepo,
            BranchInventoryRepository inventoryRepo) {
        this.repo = repo;
        this.branchRepo = branchRepo;
        this.inventoryRepo = inventoryRepo;
    }

    public List<Product> getAll() {
        return repo.findAll();
    }

    public Product save(Product product) {
        // 1. Save the product first
        Product savedProduct = repo.save(product);

        // 2. Automatically initialize inventory for ALL branches with 0 quantity
        // This ensures the product shows up for Product Managers (who filter by
        // inventory)
        List<Branch> allBranches = branchRepo.findAll();
        for (Branch b : allBranches) {
            // Check if inventory already exists (avoid duplicates if updating)
            if (inventoryRepo.findInventoryByBranchAndProduct(b, savedProduct).isEmpty()) {
                BranchInventory bi = new BranchInventory();
                bi.setBranch(b);
                bi.setProduct(savedProduct);
                bi.setQuantity(0);
                inventoryRepo.save(bi);
            }
        }

        return savedProduct;
    }

    public Product update(Integer id, Product product) {
        product.setProductId(id);
        return repo.save(product);
    }

    @org.springframework.transaction.annotation.Transactional
    public void delete(Integer id) {
        // 1. Delete associated inventory first (Cascade Delete)
        inventoryRepo.deleteByProduct_ProductId(id);

        // 2. Then delete the product
        // If it has Sales or StockRequests, this will still fail (desired behavior)
        repo.deleteById(id);
    }

    /**
     * Get products filtered by Product Manager's assigned branches
     */
    public List<Product> getProductsByManager(Integer userId) {
        return repo.findProductsByManagerBranches(userId);
    }

}
