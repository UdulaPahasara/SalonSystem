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
    CommandLineRunner initDatabase(
            RoleRepository roleRepo,
            UsersRepository userRepo,
            BranchRepository branchRepo,
            Salon.SalonManagementSystem.repository.ServiceStaffRepository staffRepo,
            Salon.SalonManagementSystem.repository.SalonServiceRepository salonServiceRepository,
            PasswordEncoder passwordEncoder,
            DatabaseMigrationRunner databaseMigrationRunner) {
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
                b.setBranchName("Lumière Salon — Main Branch");
                b.setAddress("123 Main Street, Colombo, Sri Lanka");
                b.setPhone("+94 11 555 0100");
                return branchRepo.save(b);
            });

            databaseMigrationRunner.runMigrations();

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

            seedSalonServices(salonServiceRepository, mainBranch);

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

            // Ensure Product Manager User
            if (userRepo.findByUsername("pm") == null) {
                Users pm = new Users();
                pm.setUsername("pm");
                pm.setPassword(passwordEncoder.encode("pm"));
                pm.setFullName("Product Manager Test");
                pm.setRole(createRoleIfNotFound(roleRepo, "Product Manager"));
                pm.setBranch(mainBranch);
                userRepo.save(pm);
                System.out.println("CREATED USER: pm / pm");
            }

            System.out.println("=== Default app users (see ARCHITECTURE.txt) ===");
            System.out.println("  admin / admin       (Owner)");
            System.out.println("  manager / manager   (Branch Manager)");
            System.out.println("  reception / reception (Reception)");
            System.out.println("  pm / pm             (Product Manager)");
            System.out.println("  cashier / cashier   (Cashier)");
        };
    }

    private void seedSalonServices(Salon.SalonManagementSystem.repository.SalonServiceRepository repo, Branch branch) {
        if (repo.count() > 0) {
            return;
        }

        Object[][] services = {
                { "Hair Care", "Women's Haircut & Blow Dry", 3500, 60 },
                { "Hair Care", "Full Hair Colour", 8500, 120 },
                { "Hair Care", "Keratin Smoothing Treatment", 12000, 150 },
                { "Skin & Facials", "Classic Deep Cleansing Facial", 4500, 60 },
                { "Skin & Facials", "Gold Glow Facial", 6500, 75 },
                { "Nails", "Classic Manicure", 1800, 45 },
                { "Nails", "Gel Manicure", 3200, 60 },
                { "Nails", "Spa Pedicure", 3800, 60 },
                { "Bridal & Occasions", "Bridal Hair & Makeup Trial", 15000, 120 },
                { "Bridal & Occasions", "Party Makeup", 7500, 90 },
                { "Spa & Wellness", "Head & Shoulder Massage", 2500, 30 },
                { "Spa & Wellness", "Aromatherapy Body Relaxation", 9000, 90 },
        };

        for (Object[] row : services) {
            Salon.SalonManagementSystem.model.SalonService s = new Salon.SalonManagementSystem.model.SalonService();
            s.setCategory((String) row[0]);
            s.setName((String) row[1]);
            s.setPrice(java.math.BigDecimal.valueOf((Integer) row[2]));
            s.setDurationMins((Integer) row[3]);
            s.setBranch(branch);
            repo.save(s);
        }
        System.out.println("SEEDED SALON SERVICES for customer price list");
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

    private Role createRoleIfNotFound(RoleRepository roleRepo, String roleName) {
        return roleRepo.findByRoleName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(roleName);
            return roleRepo.save(role);
        });
    }
}
