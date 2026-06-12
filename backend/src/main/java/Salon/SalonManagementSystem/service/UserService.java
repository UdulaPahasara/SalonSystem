package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.Users;
import Salon.SalonManagementSystem.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Users authenticate(String username, String rawPassword, String roleName) {
        Users u = usersRepository.findByUsername(username);
        if (u == null) {
            System.out.println("User not found: " + username);
            return null;
        }

        boolean ok = passwordEncoder.matches(rawPassword, u.getPassword());
        System.out.println("Password match for " + username + " = " + ok);
        if (!ok) return null;

        System.out.println("DB role = " + u.getRole().getRoleName() + ", requested = " + roleName);
        if (u.getRole() == null || !u.getRole().getRoleName().equals(roleName)) {
            return null;
        }

        return u;
    }

}

