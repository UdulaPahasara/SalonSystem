package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.BranchInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchInventoryRepository extends JpaRepository<BranchInventory, Integer> {

        List<BranchInventory> findByProduct_ProductId(Integer productId);

        // One atomic statement: takes the stock only if enough is left, so simultaneous sales can't oversell.
        @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("UPDATE BranchInventory b SET b.quantity = b.quantity - :qty WHERE b.branch = :branch AND b.product = :product AND b.quantity >= :qty")
        int deductStock(@Param("branch") Salon.SalonManagementSystem.model.Branch branch,
                        @Param("product") Salon.SalonManagementSystem.model.Product product,
                        @Param("qty") int qty);

        @Query("SELECT bi FROM BranchInventory bi WHERE bi.branch = :branch AND bi.product = :product")
        java.util.Optional<BranchInventory> findInventoryByBranchAndProduct(
                        @Param("branch") Salon.SalonManagementSystem.model.Branch branch,
                        @Param("product") Salon.SalonManagementSystem.model.Product product);

        @Query("SELECT bi FROM BranchInventory bi WHERE bi.branch.id = :branchId")
        List<BranchInventory> findInventoryByBranchId(@Param("branchId") Integer branchId);

        void deleteByProduct_ProductId(Integer productId);
}
