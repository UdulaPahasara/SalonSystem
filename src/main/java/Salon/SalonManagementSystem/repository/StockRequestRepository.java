package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.StockRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockRequestRepository extends JpaRepository<StockRequest, Integer> {

    List<StockRequest> findByBranch_Id(Integer id);
}
