package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.model.ServiceStaff;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.ServiceStaffRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Stylists, barbers and therapists who perform services (they don't log in).
@RestController
@RequestMapping("/api/staff")
public class ServiceStaffController {

    private final ServiceStaffRepository staffRepo;
    private final BranchRepository branchRepo;

    public ServiceStaffController(ServiceStaffRepository staffRepo, BranchRepository branchRepo) {
        this.staffRepo = staffRepo;
        this.branchRepo = branchRepo;
    }

    @GetMapping
    public List<ServiceStaff> list(@RequestParam(required = false) Integer branchId) {
        return branchId != null ? staffRepo.findByBranchId(branchId) : staffRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            ServiceStaff s = new ServiceStaff();
            apply(s, body, true);
            return ResponseEntity.ok(staffRepo.save(s));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            ServiceStaff s = staffRepo.findById(id).orElseThrow(() -> new RuntimeException("Staff member not found"));
            apply(s, body, false);
            return ResponseEntity.ok(staffRepo.save(s));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            staffRepo.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                    .body("This person has appointments or salary payments on record and can't be removed.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Staff member not found");
        }
    }

    private void apply(ServiceStaff s, Map<String, Object> body, boolean creating) {
        String name = body.get("fullName") == null ? "" : body.get("fullName").toString().trim();
        String role = body.get("role") == null ? "" : body.get("role").toString().trim();
        if (name.isEmpty()) {
            throw new RuntimeException("Name is required");
        }
        if (role.isEmpty()) {
            throw new RuntimeException("Role is required");
        }
        s.setFullName(name);
        s.setRole(role);
        // Salary is managed by the owner, so only the owner's screens send baseSalary.
        if (body.get("baseSalary") != null) {
            s.setBaseSalary(((Number) body.get("baseSalary")).doubleValue());
        } else if (creating && s.getBaseSalary() == null) {
            s.setBaseSalary(0.0);
        }
        if (body.get("branchId") != null) {
            Integer branchId = ((Number) body.get("branchId")).intValue();
            Branch branch = branchRepo.findById(branchId).orElseThrow(() -> new RuntimeException("Branch not found"));
            s.setBranch(branch);
        } else if (creating) {
            throw new RuntimeException("Branch is required");
        }
    }
}
