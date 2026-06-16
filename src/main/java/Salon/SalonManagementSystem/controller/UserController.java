package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.LoginRequest;
import Salon.SalonManagementSystem.Dto.LoginUserDto;
import Salon.SalonManagementSystem.model.Users;
import Salon.SalonManagementSystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginData) {
        if (loginData.getUsername() == null || loginData.getUsername().isBlank()
                || loginData.getPassword() == null || loginData.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required."));
        }

        Users loggedIn = userService.authenticate(
                loginData.getUsername().trim(),
                loginData.getPassword()
        );

        if (loggedIn == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password."));
        }

        LoginUserDto response = userService.toLoginDto(loggedIn);
        return ResponseEntity.ok(wrapLoginResponse(response));
    }

    private Map<String, Object> wrapLoginResponse(LoginUserDto dto) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", dto.getId());
        body.put("username", dto.getUsername());
        body.put("fullName", dto.getFullName() != null ? dto.getFullName() : "");
        body.put("role", Map.of("roleName", dto.getRoleName()));
        if (dto.getBranchId() != null) {
            body.put("branch", Map.of(
                    "id", dto.getBranchId(),
                    "branchName", dto.getBranchName() != null ? dto.getBranchName() : ""
            ));
        }
        return body;
    }
}
