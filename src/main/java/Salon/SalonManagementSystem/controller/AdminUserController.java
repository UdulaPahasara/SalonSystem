package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.CreateUserRequest;
import Salon.SalonManagementSystem.Dto.UserDto;
import Salon.SalonManagementSystem.model.Role;
import Salon.SalonManagementSystem.repository.RoleRepository;
import Salon.SalonManagementSystem.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminUserController {

    @Autowired
    private AdminUserService service;
    @Autowired
    private RoleRepository roleRepository;

    @GetMapping("/users")
    public List<UserDto> getAllUsers() {
        try {
            return service.listAll();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error in getAllUsers controller", e);
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Integer id) {
        UserDto d = service.findById(id);
        if (d == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(d);
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserRequest req) {
        UserDto created = service.create(req);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Integer id, @RequestBody CreateUserRequest req) {
        UserDto updated = service.update(id, req);
        if (updated == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id) {
        try {
            if (service.delete(id)) {
                return ResponseEntity.ok("User deleted successfully");
            } else {
                return ResponseEntity.status(404).body("User not found");
            }
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409)
                    .body("Cannot delete user: They have associated records (Sales, Appointments, etc.).");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting user: " + e.getMessage());
        }
    }

    // Roles list for the frontend select
    @GetMapping("/roles")
    public List<Role> allRoles() {
        try {
            System.out.println("Entering allRoles");
            List<Role> roles = roleRepository.findAll();
            System.out.println("Exiting allRoles with " + roles.size() + " roles");
            return roles;
        } catch (Exception e) {
            System.err.println("Error in allRoles");
            e.printStackTrace();
            throw new RuntimeException("Error fetching roles", e);
        }
    }

    // BRANCH-SPECIFIC USERS (for Branch Managers)
    @GetMapping("/branch/{branchId}/users")
    public List<UserDto> getBranchUsers(@PathVariable Integer branchId) {
        try {
            System.out.println("Entering getBranchUsers for branch " + branchId);
            return service.getUsersByBranch(branchId);
        } catch (Exception e) {
            System.err.println("Error in getBranchUsers");
            e.printStackTrace();
            throw new RuntimeException("Error fetching branch users", e);
        }
    }

    @DeleteMapping("/cleanup-service-users")
    public ResponseEntity<String> cleanupServiceUsers() {
        int count = service.cleanupServiceStaffUsers();
        return ResponseEntity.ok("Deleted " + count + " service staff users.");
    }
}
