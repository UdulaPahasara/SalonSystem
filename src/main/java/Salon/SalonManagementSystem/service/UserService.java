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

    public Users authenticate(String username, String rawPassword) {
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
