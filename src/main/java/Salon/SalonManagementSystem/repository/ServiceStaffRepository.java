package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.ServiceStaff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceStaffRepository extends JpaRepository<ServiceStaff, Integer> {
    List<ServiceStaff> findByBranchId(Integer branchId);
}
