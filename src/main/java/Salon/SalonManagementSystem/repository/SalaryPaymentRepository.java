package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.SalaryPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalaryPaymentRepository extends JpaRepository<SalaryPayment, Integer> {
    List<SalaryPayment> findByPaymentMonth(String paymentMonth);

    List<SalaryPayment> findByUser_Id(Integer userId);

    List<SalaryPayment> findByServiceStaff_Id(Integer serviceStaffId);
}
