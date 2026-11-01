package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.CreateUserRequest;
import Salon.SalonManagementSystem.Dto.UserDto;
import Salon.SalonManagementSystem.model.Role;
import Salon.SalonManagementSystem.repository.RoleRepository;
import Salon.SalonManagementSystem.security.AuthContext;
import Salon.SalonManagementSystem.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    @Autowired
    private AdminUserService service;
    @Autowired
    private RoleRepository roleRepository;

    @GetMapping("/users")
    public List<UserDto> getAllUsers() {
        return service.listAll();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Integer id) {
        UserDto d = service.findById(id);
        return d == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(d);
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Integer id, @RequestBody CreateUserRequest req) {
        UserDto updated = service.update(id, req);
        return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id) {
        return service.delete(id) ? ResponseEntity.ok("User deleted successfully") : ResponseEntity.status(404).body("User not found");
    }

    @GetMapping("/roles")
    public List<Role> allRoles() {
        return roleRepository.findAll();
    }

    // The Owner can see any branch; a Branch Manager only their own (checked by the access rules)
    @GetMapping("/branch/{branchId}/users")
    public List<UserDto> getBranchUsers(@PathVariable Integer branchId) {
        AuthContext.requireBranch(branchId);
        return service.getUsersByBranch(branchId);
    }
}
