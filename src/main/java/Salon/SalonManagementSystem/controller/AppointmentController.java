package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Appointment;
import Salon.SalonManagementSystem.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:3000")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload) {
        try {
            Integer customerId = ((Number) payload.get("customerId")).intValue();
            String serviceType = (String) payload.get("serviceType");
            String isoDate = (String) payload.get("appointmentTime");

            Integer branchId = null;
            if (payload.get("branchId") != null) {
                branchId = ((Number) payload.get("branchId")).intValue();
            }

            // Extract logic
            boolean applyLoyalty = false;
            if (payload.get("applyLoyalty") != null) {
                applyLoyalty = (Boolean) payload.get("applyLoyalty");
            }

            Appointment appt = new Appointment();
            appt.setServiceType(serviceType);
            appt.setAppointmentTime(LocalDateTime.parse(isoDate));
            appt.setApplyLoyalty(applyLoyalty);

            return ResponseEntity.ok(appointmentService.createAppointment(appt, customerId, branchId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating appointment: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Appointment> getAllAppointments(@RequestParam(required = false) Integer branchId) {
        return appointmentService.getAllAppointments(branchId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(@PathVariable Integer id, @RequestBody Appointment details) {
        try {
            return ResponseEntity.ok(appointmentService.updateAppointment(id, details));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable Integer id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok().build();
    }
}
