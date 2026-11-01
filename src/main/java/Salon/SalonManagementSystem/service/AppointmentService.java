package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.*;
import Salon.SalonManagementSystem.repository.*;
import Salon.SalonManagementSystem.security.AuthContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AppointmentService {

    private static final int DEFAULT_MINUTES = 60;

    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private SalonServiceRepository serviceRepository;
    @Autowired
    private ServiceStaffRepository staffRepository;

    @Transactional
    public Appointment createAppointment(Appointment appointment, Integer customerId, Integer branchId) {
        if (branchId == null) throw bad("Branch is required.");
        AuthContext.requireBranch(branchId);
        Branch branch = branchRepository.findById(branchId).orElseThrow(() -> bad("Branch not found."));
        Customer customer = customerRepository.findById(customerId).orElseThrow(() -> bad("Customer not found."));
        if (customer.getBranch() != null && !customer.getBranch().getId().equals(branchId)) {
            throw bad("This customer is registered at a different branch.");
        }
        ServiceStaff staff = resolveStaff(appointment.getAssignedStaff(), branchId);
        validate(appointment.getServiceType(), appointment.getAppointmentTime(), branchId, staff, null);

        appointment.setBranch(branch);
        appointment.setCustomer(customer);
        appointment.setAssignedStaff(staff);
        appointment.setStatus("BOOKED");
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAllAppointments(Integer branchId) {
        return branchId != null ? appointmentRepository.findByBranch_Id(branchId) : appointmentRepository.findAll();
    }

    @Transactional
    public Appointment updateAppointment(Integer id, Appointment details) {
        Appointment appt = find(id);
        if (!"BOOKED".equals(status(appt))) throw conflict("Only booked appointments can be rescheduled.");

        String service = details.getServiceType() != null ? details.getServiceType() : appt.getServiceType();
        LocalDateTime time = details.getAppointmentTime() != null ? details.getAppointmentTime() : appt.getAppointmentTime();
        ServiceStaff staff = details.getAssignedStaff() != null
                ? resolveStaff(details.getAssignedStaff(), appt.getBranch().getId())
                : appt.getAssignedStaff();
        validate(service, time, appt.getBranch().getId(), staff, id);

        appt.setServiceType(service);
        appt.setAppointmentTime(time);
        appt.setAssignedStaff(staff);
        appt.setApplyLoyalty(details.isApplyLoyalty());
        return appointmentRepository.save(appt);
    }

    // BOOKED -> COMPLETED or CANCELLED. Finished visits keep their history instead of being deleted.
    @Transactional
    public Appointment changeStatus(Integer id, String status) {
        Appointment appt = find(id);
        String next = status == null ? "" : status.toUpperCase();
        if (!next.equals("COMPLETED") && !next.equals("CANCELLED")) throw bad("Status must be COMPLETED or CANCELLED.");
        if (!"BOOKED".equals(status(appt))) throw conflict("This appointment is already " + status(appt).toLowerCase() + ".");
        appt.setStatus(next);
        return appointmentRepository.save(appt);
    }

    @Transactional
    public void deleteAppointment(Integer id) {
        Appointment appt = find(id);
        appointmentRepository.delete(appt);
    }

    // ---- rules
    private void validate(String serviceName, LocalDateTime time, Integer branchId, ServiceStaff staff, Integer ignoreId) {
        if (serviceName == null || serviceName.isBlank()) throw bad("Choose a service.");
        if (time == null) throw bad("Choose a date and time.");
        if (time.isBefore(LocalDateTime.now().minusMinutes(5))) throw bad("Appointments can't be booked in the past.");
        int minutes = minutesFor(serviceName, branchId, true);
        if (staff == null) return;
        LocalDateTime end = time.plusMinutes(minutes);
        for (Appointment other : appointmentRepository.findByAssignedStaff_IdAndStatus(staff.getId(), "BOOKED")) {
            if (ignoreId != null && ignoreId.equals(other.getAppointmentId())) continue;
            LocalDateTime os = other.getAppointmentTime();
            LocalDateTime oe = os.plusMinutes(minutesFor(other.getServiceType(), other.getBranch().getId(), false));
            if (time.isBefore(oe) && os.isBefore(end)) {
                throw conflict(staff.getFullName() + " already has " + other.getServiceType() + " at "
                        + os.format(DateTimeFormatter.ofPattern("d MMM, HH:mm")) + ". Choose another time or stylist.");
            }
        }
    }

    // strict = the service must be on this branch's menu
    private int minutesFor(String serviceName, Integer branchId, boolean strict) {
        SalonService s = serviceRepository.findByBranch_Id(branchId).stream()
                .filter(x -> x.getName().equalsIgnoreCase(serviceName)).findFirst().orElse(null);
        if (s == null) {
            if (strict) throw bad("\"" + serviceName + "\" isn't on this branch's service menu.");
            return DEFAULT_MINUTES;
        }
        return s.getDurationMins() == null ? DEFAULT_MINUTES : s.getDurationMins();
    }

    private ServiceStaff resolveStaff(ServiceStaff given, Integer branchId) {
        if (given == null || given.getId() == null) return null;
        ServiceStaff s = staffRepository.findById(given.getId()).orElseThrow(() -> bad("Staff member not found."));
        if (s.getBranch() == null || !s.getBranch().getId().equals(branchId)) throw bad("That staff member works at a different branch.");
        return s;
    }

    private Appointment find(Integer id) {
        Appointment a = appointmentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found."));
        AuthContext.requireBranch(a.getBranch() == null ? null : a.getBranch().getId());
        return a;
    }

    private String status(Appointment a) {
        return a.getStatus() == null ? "BOOKED" : a.getStatus().toUpperCase();
    }

    private ResponseStatusException bad(String m) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, m);
    }

    private ResponseStatusException conflict(String m) {
        return new ResponseStatusException(HttpStatus.CONFLICT, m);
    }
}
