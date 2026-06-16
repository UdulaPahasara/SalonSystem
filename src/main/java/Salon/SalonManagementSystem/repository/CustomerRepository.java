package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByPhone(String phone);

    List<Customer> findByBranch_Id(Integer branchId);
}
