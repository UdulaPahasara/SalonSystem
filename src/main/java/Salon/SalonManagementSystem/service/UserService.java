package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.Dto.LoginUserDto;
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

    // 5 wrong passwords for a username locks it for 10 minutes (kept in memory)
    private static final int MAX_FAILURES = 5;
    private static final long LOCK_MILLIS = 10 * 60 * 1000L;
    private final java.util.Map<String, long[]> failures = new java.util.concurrent.ConcurrentHashMap<>(); // {count, lockedUntil}

    public long lockedForSeconds(String username) {
        long[] f = failures.get(username.toLowerCase());
        long left = f == null ? 0 : f[1] - System.currentTimeMillis();
        return left > 0 ? (left + 999) / 1000 : 0;
    }

    public Users authenticate(String username, String rawPassword) {
        Users user = verify(username, rawPassword);
        String key = username.toLowerCase();
        if (user == null) {
            long[] f = failures.computeIfAbsent(key, k -> new long[2]);
            f[0]++;
            if (f[0] >= MAX_FAILURES) {
                f[0] = 0;
                f[1] = System.currentTimeMillis() + LOCK_MILLIS;
            }
        } else {
            failures.remove(key);
        }
        return user;
    }

    private Users verify(String username, String rawPassword) {
        Users user = usersRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            return null;
        }

        if (user.getRole() == null) {
            return null;
        }

        return user;
    }

    public LoginUserDto toLoginDto(Users user) {
        LoginUserDto dto = new LoginUserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setRoleName(user.getRole().getRoleName());

        if (user.getBranch() != null) {
            dto.setBranchId(user.getBranch().getId());
            dto.setBranchName(user.getBranch().getBranchName());
        }

        return dto;
    }
}
