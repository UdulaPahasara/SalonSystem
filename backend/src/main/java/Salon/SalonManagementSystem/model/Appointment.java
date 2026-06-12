package Salon.SalonManagementSystem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import Salon.SalonManagementSystem.model.ServiceStaff;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer appointmentId;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    private String serviceType; // e.g., "Haircut", "Coloring"

    private LocalDateTime appointmentTime;

    private String status; // BOOKED, COMPLETED, CANCELLED

    @Column(columnDefinition = "boolean default false")
    private boolean applyLoyalty; // For "Loyalty Yes/No" selection

    @ManyToOne
    @JoinColumn(name = "assigned_staff_id")
    private ServiceStaff assignedStaff;

    // Getters and Setters

    public Integer getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Integer appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
        this.branch = branch;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public LocalDateTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalDateTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isApplyLoyalty() {
        return applyLoyalty;
    }

    public void setApplyLoyalty(boolean applyLoyalty) {
        this.applyLoyalty = applyLoyalty;
    }

    public ServiceStaff getAssignedStaff() {
        return assignedStaff;
    }

    public void setAssignedStaff(ServiceStaff assignedStaff) {
        this.assignedStaff = assignedStaff;
    }
}
