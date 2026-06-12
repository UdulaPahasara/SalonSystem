package Salon.SalonManagementSystem.config;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.model.Role;
import Salon.SalonManagementSystem.model.Users;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.RoleRepository;
import Salon.SalonManagementSystem.repository.UsersRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(RoleRepository roleRepo, UsersRepository userRepo, BranchRepository branchRepo,
            Salon.SalonManagementSystem.repository.ServiceStaffRepository staffRepo,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Ensure Roles
            createRoleIfNotFound(roleRepo, "Owner");
            createRoleIfNotFound(roleRepo, "Branch Manager");
            createRoleIfNotFound(roleRepo, "Reception");
            createRoleIfNotFound(roleRepo, "Product Manager");
            createRoleIfNotFound(roleRepo, "Cashier");
            Role cashierRole = roleRepo.findByRoleName("Cashier").get();

            // 2. Ensure Branch
            Branch mainBranch = branchRepo.findAll().stream().findFirst().orElseGet(() -> {
                Branch b = new Branch();
                b.setBranchName("Main Branch");
                b.setAddress("123 Main St");
                b.setPhone("555-0100");
                return branchRepo.save(b);
            });

            // ... (Keep existing Owner/Admin/Cashier/Reception/Manager checks) ...

            // 3. Ensure Cashier User
            if (userRepo.findByUsername("cashier") == null) {
                Users cashier = new Users();
                cashier.setUsername("cashier");
                cashier.setPassword(passwordEncoder.encode("cashier"));
                cashier.setFullName("Cashier Test");
                cashier.setRole(cashierRole);
                cashier.setBranch(mainBranch);
                userRepo.save(cashier);
                System.out.println("CREATED USER: cashier / cashier");
            }

            //  Ensure Reception User
            if (userRepo.findByUsername("reception") == null) {
                Users reception = new Users();
                reception.setUsername("reception");
                reception.setPassword(passwordEncoder.encode("reception"));
                reception.setFullName("Reception Test");
                reception.setRole(createRoleIfNotFound(roleRepo, "Reception"));
                reception.setBranch(mainBranch);
                userRepo.save(reception);
                System.out.println("CREATED USER: reception / reception");
            }

            //  Ensure Branch Manager User
            if (userRepo.findByUsername("manager") == null) {
                Users manager = new Users();
                manager.setUsername("manager");
                manager.setPassword(passwordEncoder.encode("manager"));
                manager.setFullName("Manager Test");
                manager.setRole(createRoleIfNotFound(roleRepo, "Branch Manager"));
                manager.setBranch(mainBranch);
                userRepo.save(manager);
                System.out.println("CREATED USER: manager / manager");
            }

            //  Ensure SERVICE STAFF (Stylist, Barber, Therapist) - NOW IN SERVICE_STAFF
            // TABLE
            checkAndCreateStaff(staffRepo, mainBranch, "Amy Stylist", "Stylist");
            checkAndCreateStaff(staffRepo, mainBranch, "John Barber", "Barber");
            checkAndCreateStaff(staffRepo, mainBranch, "Lisa Therapist", "Therapist");

            // 4. Ensure Admin User (if needed)
            if (userRepo.findByUsername("admin") == null) {
                Users admin = new Users();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setFullName("Admin User");
                admin.setRole(roleRepo.findByRoleName("Owner").orElse(null));
                userRepo.save(admin);
                System.out.println("CREATED USER: admin / admin");
            }
        };
    }

    private void checkAndCreateStaff(Salon.SalonManagementSystem.repository.ServiceStaffRepository repo, Branch branch,
            String name, String role) {
        // Simple check by name for seeding purposes
        if (repo.findByBranchId(branch.getId()).stream().noneMatch(s -> s.getFullName().equals(name))) {
            Salon.SalonManagementSystem.model.ServiceStaff s = new Salon.SalonManagementSystem.model.ServiceStaff();
            s.setFullName(name);
            s.setRole(role);
            s.setBranch(branch);
            repo.save(s);
            System.out.println("CREATED SERVICE STAFF: " + name);
        }
    }

    // @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void migrateLegacyRoles(org.springframework.context.ApplicationContext ctx) {
        RoleRepository roleRepo = ctx.getBean(RoleRepository.class);
        UsersRepository userRepo = ctx.getBean(UsersRepository.class);

        roleRepo.findByRoleName("Chashire").ifPresent(legacy -> {
            roleRepo.findByRoleName("Cashier").ifPresent(correct -> {
                userRepo.findAll().stream()
                        .filter(u -> u.getRole() != null && u.getRole().getId() == legacy.getId())
                        .forEach(u -> {
                            System.out.println("Migrating user " + u.getUsername() + " from Chashire to Cashier");
                            u.setRole(correct);
                            userRepo.save(u);
                        });
            });
        });
    }

    private Role createRoleIfNotFound(RoleRepository roleRepo, String roleName) {
        return roleRepo.findByRoleName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(roleName);
            return roleRepo.save(role);
        });
    }
}
