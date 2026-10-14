package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.Dto.CreateUserRequest;
import Salon.SalonManagementSystem.Dto.UserDto;
import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.model.Role;
import Salon.SalonManagementSystem.model.Users;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.RoleRepository;
import Salon.SalonManagementSystem.repository.UsersRepository;
import Salon.SalonManagementSystem.security.AuthContext;
import Salon.SalonManagementSystem.security.AuthUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.regex.Pattern;

@Service
@Transactional
public class AdminUserService {

    private static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9._-]{3,50}$");
    private static final int MIN_PASSWORD = 8;

    @Autowired
    private UsersRepository usersRepository;
    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDto> listAll() {
        return usersRepository.findAll().stream().map(this::toDto).toList();
    }

    public UserDto toDto(Users u) {
        UserDto dto = new UserDto();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setFullName(u.getFullName());
        if (u.getRole() != null) {
            dto.setRoleId(u.getRole().getId());
            dto.setRoleName(u.getRole().getRoleName());
        }
        if (u.getBranch() != null) {
            dto.setBranchId(u.getBranch().getId());
            dto.setBranchName(u.getBranch().getBranchName());
        }
        return dto;
    }

    public UserDto findById(Integer id) {
        return usersRepository.findById(id).map(this::toDto).orElse(null);
    }

    public UserDto create(CreateUserRequest req) {
        Users u = new Users();
        apply(u, req, true);
        return toDto(usersRepository.save(u));
    }

    public UserDto update(Integer id, CreateUserRequest req) {
        Users u = usersRepository.findById(id).orElse(null);
        if (u == null) return null;
        AuthUser me = AuthContext.current();
        Role newRole = role(req);
        boolean demotesOwner = isOwner(u) && !"Owner".equals(newRole.getRoleName());
        if (demotesOwner && (me != null && me.id() == id)) {
            throw bad("You can't change your own role.");
        }
        if (demotesOwner && ownerCount() <= 1) {
            throw conflict("There must always be at least one Owner.");
        }
        apply(u, req, false);
        return toDto(usersRepository.save(u));
    }

    public boolean delete(Integer id) {
        Users u = usersRepository.findById(id).orElse(null);
        if (u == null) return false;
        AuthUser me = AuthContext.current();
        if (me != null && me.id() == id) throw conflict("You can't delete your own account.");
        if (isOwner(u) && ownerCount() <= 1) throw conflict("You can't delete the last Owner.");
        usersRepository.delete(u);
        usersRepository.flush(); // surface "has records" now so the screen can explain it
        return true;
    }

    public List<UserDto> getUsersByBranch(Integer branchId) {
        return usersRepository.findByBranchId(branchId).stream().map(this::toDto).toList();
    }

    // ---- rules shared by create and update
    private void apply(Users u, CreateUserRequest req, boolean creating) {
        String username = req.getUsername() == null ? "" : req.getUsername().trim();
        if (!USERNAME.matcher(username).matches()) {
            throw bad("Username must be 3-50 characters: letters, numbers, dots, dashes or underscores.");
        }
        Users clash = usersRepository.findByUsername(username);
        if (clash != null && clash.getId() != u.getId()) throw conflict("That username is already taken.");

        String fullName = req.getFullName() == null ? "" : req.getFullName().trim();
        if (fullName.isEmpty() || fullName.length() > 100) throw bad("Full name is required (up to 100 characters).");

        String pw = req.getPassword();
        if (creating || (pw != null && !pw.isBlank())) {
            if (pw == null || pw.length() < MIN_PASSWORD) throw bad("Password must be at least " + MIN_PASSWORD + " characters.");
            u.setPassword(passwordEncoder.encode(pw));
        }

        Role role = role(req);
        Branch branch = null;
        if (req.getBranchId() != null) {
            branch = branchRepository.findById(req.getBranchId()).orElseThrow(() -> bad("Branch not found."));
        }
        if (!"Owner".equals(role.getRoleName()) && branch == null) {
            throw bad("Choose a branch for this role.");
        }
        u.setUsername(username);
        u.setFullName(fullName);
        u.setRole(role);
        u.setBranch(branch);
    }

    private Role role(CreateUserRequest req) {
        if (req.getRoleId() == null) throw bad("Choose a role.");
        return roleRepository.findById(req.getRoleId()).orElseThrow(() -> bad("Role not found."));
    }

    private boolean isOwner(Users u) {
        return u.getRole() != null && "Owner".equals(u.getRole().getRoleName());
    }

    private long ownerCount() {
        return usersRepository.findByRole_RoleNameIn(List.of("Owner")).size();
    }

    private ResponseStatusException bad(String m) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, m);
    }

    private ResponseStatusException conflict(String m) {
        return new ResponseStatusException(HttpStatus.CONFLICT, m);
    }
}
