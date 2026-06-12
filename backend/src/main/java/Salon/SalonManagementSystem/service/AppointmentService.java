package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.Appointment;
import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.model.Customer;
import Salon.SalonManagementSystem.repository.AppointmentRepository;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private CustomerRepository customerRepository; // Use Repo directly for simple lookups

    @Autowired
    private BranchRepository branchRepository;

    public Appointment createAppointment(Appointment appointment, Integer customerId, Integer branchId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (branchId != null) {
            appointment.setBranch(branchRepository.findById(branchId).orElse(null));
        }

        appointment.setCustomer(customer);
        appointment.setStatus("BOOKED");
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAllAppointments(Integer branchId) {
        if (branchId != null) {
            return appointmentRepository.findByBranch_Id(branchId);
        }
        return appointmentRepository.findAll();
    }

    @org.springframework.transaction.annotation.Transactional
    public Appointment updateAppointment(Integer id, Appointment details) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (details.getAppointmentTime() != null) {
            appt.setAppointmentTime(details.getAppointmentTime());
        }
        if (details.getServiceType() != null) {
            appt.setServiceType(details.getServiceType());
        }

        // Update generic loyalty request flag
        appt.setApplyLoyalty(details.isApplyLoyalty());

        // Update assigned staff if provided
        if (details.getAssignedStaff() != null) {
            appt.setAssignedStaff(details.getAssignedStaff());
        }

        if (details.getStatus() != null) {
            System.out.println("Updating appointment " + id + " status to: " + details.getStatus());
            appt.setStatus(details.getStatus());
        }

        return appointmentRepository.save(appt);
    }

    public void deleteAppointment(Integer id) {
        appointmentRepository.deleteById(id);
    }
}
