package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Query(value = "SELECT DISTINCT p.* FROM products p " +
            "INNER JOIN branch_inventory bi ON p.product_id = bi.product_id " +
            "INNER JOIN product_manager_branches pmb ON bi.branch_id = pmb.branch_id " +
            "WHERE pmb.user_id = :userId",
            nativeQuery = true)
    List<Product> findProductsByManagerBranches(@Param("userId") Integer userId);



}
