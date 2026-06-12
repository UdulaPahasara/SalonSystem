package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByCustomer_CustomerId(Integer customerId);

    List<Appointment> findByBranch_Id(Integer branchId);
}
