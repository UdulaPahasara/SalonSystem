package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.SalonService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalonServiceRepository extends JpaRepository<SalonService, Integer> {
    List<SalonService> findByBranch_Id(Integer branchId);
}
