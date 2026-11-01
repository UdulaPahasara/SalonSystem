package Salon.SalonManagementSystem.config;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.model.Role;
import Salon.SalonManagementSystem.model.SalonService;
import Salon.SalonManagementSystem.model.Users;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.RoleRepository;
import Salon.SalonManagementSystem.repository.SalonServiceRepository;
import Salon.SalonManagementSystem.repository.UsersRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Applies data fixes when the app starts so existing MySQL databases stay in sync
 * with new features (service categories, contact messages, role-based login, etc.).
 */
@Component
public class DatabaseMigrationRunner {

    private static final Map<String, String> SERVICE_CATEGORY_BY_NAME = new LinkedHashMap<>();

    static {
        SERVICE_CATEGORY_BY_NAME.put("Women's Haircut & Blow Dry", "Hair Care");
        SERVICE_CATEGORY_BY_NAME.put("Full Hair Colour", "Hair Care");
        SERVICE_CATEGORY_BY_NAME.put("Keratin Smoothing Treatment", "Hair Care");
        SERVICE_CATEGORY_BY_NAME.put("Classic Deep Cleansing Facial", "Skin & Facials");
        SERVICE_CATEGORY_BY_NAME.put("Gold Glow Facial", "Skin & Facials");
        SERVICE_CATEGORY_BY_NAME.put("Classic Manicure", "Nails");
        SERVICE_CATEGORY_BY_NAME.put("Gel Manicure", "Nails");
        SERVICE_CATEGORY_BY_NAME.put("Spa Pedicure", "Nails");
        SERVICE_CATEGORY_BY_NAME.put("Bridal Hair & Makeup Trial", "Bridal & Occasions");
        SERVICE_CATEGORY_BY_NAME.put("Party Makeup", "Bridal & Occasions");
        SERVICE_CATEGORY_BY_NAME.put("Head & Shoulder Massage", "Spa & Wellness");
        SERVICE_CATEGORY_BY_NAME.put("Aromatherapy Body Relaxation", "Spa & Wellness");
    }

    private static final Map<String, String> DEFAULT_USER_ROLES = Map.of(
            "admin", "Owner",
            "manager", "Branch Manager",
            "reception", "Reception",
            "pm", "Product Manager",
            "cashier", "Cashier"
    );

    // One shared password for all default staff logins
    public static final String DEFAULT_STAFF_PASSWORD = "Malroo@123";

    private static final Map<String, String> DEFAULT_USER_PASSWORDS = Map.of(
            "admin", DEFAULT_STAFF_PASSWORD,
            "manager", DEFAULT_STAFF_PASSWORD,
            "reception", DEFAULT_STAFF_PASSWORD,
            "pm", DEFAULT_STAFF_PASSWORD,
            "cashier", DEFAULT_STAFF_PASSWORD
    );

    private final RoleRepository roleRepository;
    private final UsersRepository usersRepository;
    private final BranchRepository branchRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean resetDefaultPasswords;
    private final Salon.SalonManagementSystem.repository.CustomerRepository customerRepository;

    public DatabaseMigrationRunner(
            RoleRepository roleRepository,
            UsersRepository usersRepository,
            BranchRepository branchRepository,
            SalonServiceRepository salonServiceRepository,
            PasswordEncoder passwordEncoder,
            Salon.SalonManagementSystem.repository.CustomerRepository customerRepository,
            @org.springframework.beans.factory.annotation.Value("${salon.reset-default-passwords:false}") boolean resetDefaultPasswords) {
        this.roleRepository = roleRepository;
        this.usersRepository = usersRepository;
        this.branchRepository = branchRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.passwordEncoder = passwordEncoder;
        this.customerRepository = customerRepository;
        this.resetDefaultPasswords = resetDefaultPasswords;
    }

    // Phone numbers are stored as digits only, so the same number can't be registered twice in different formats.
    private void normalizeCustomerPhones() {
        customerRepository.findAll().forEach(c -> {
            String digits = c.getPhone() == null ? null : c.getPhone().replaceAll("[\\s-]", "");
            if (digits != null && !digits.equals(c.getPhone()) && customerRepository.findByPhone(digits).isEmpty()) {
                c.setPhone(digits);
                customerRepository.save(c);
            }
        });
    }

    public void runMigrations() {
        normalizeCustomerPhones();
        migrateLegacyCashierRole();
        syncMainBranchDetails();
        backfillServiceCategories();
        repairDefaultStaffAccounts();
        ensureUsersLinkedToMainBranch();
    }

    private void repairDefaultStaffAccounts() {
        Branch mainBranch = branchRepository.findAll().stream().findFirst().orElse(null);

        DEFAULT_USER_PASSWORDS.forEach((username, plainPassword) -> {
            Users user = usersRepository.findByUsername(username);
            if (user == null) {
                return;
            }

            boolean changed = false;
            String expectedRoleName = DEFAULT_USER_ROLES.get(username);
            Role expectedRole = roleRepository.findByRoleName(expectedRoleName).orElse(null);

            if (expectedRole != null && (user.getRole() == null || user.getRole().getId() != expectedRole.getId())) {
                user.setRole(expectedRole);
                changed = true;
                System.out.println("MIGRATION: assigned role " + expectedRoleName + " to user '" + username + "'");
            }

            if (!"admin".equals(username) && mainBranch != null && user.getBranch() == null) {
                user.setBranch(mainBranch);
                changed = true;
            }

            // Passwords are only set here if missing, or when SALON_RESET_DEFAULT_PASSWORDS=true is set on purpose.
            // They are no longer reset on every start, so a changed password stays changed.
            if (user.getPassword() == null || (resetDefaultPasswords && !passwordEncoder.matches(plainPassword, user.getPassword()))) {
                user.setPassword(passwordEncoder.encode(plainPassword));
                changed = true;
                System.out.println("MIGRATION: set default password for user '" + username + "'");
            }

            if (changed) {
                usersRepository.save(user);
            }
        });
    }

    private void migrateLegacyCashierRole() {
        roleRepository.findByRoleName("Chashire").ifPresent(legacy -> {
            roleRepository.findByRoleName("Cashier").ifPresent(cashier -> {
                usersRepository.findAll().stream()
                        .filter(u -> u.getRole() != null && u.getRole().getId() == legacy.getId())
                        .forEach(u -> {
                            u.setRole(cashier);
                            usersRepository.save(u);
                            System.out.println("MIGRATION: user '" + u.getUsername() + "' role Chashire → Cashier");
                        });
            });
        });

        roleRepository.findByRoleName("Cashire").ifPresent(legacy -> {
            roleRepository.findByRoleName("Cashier").ifPresent(cashier -> {
                usersRepository.findAll().stream()
                        .filter(u -> u.getRole() != null && u.getRole().getId() == legacy.getId())
                        .forEach(u -> {
                            u.setRole(cashier);
                            usersRepository.save(u);
                            System.out.println("MIGRATION: user '" + u.getUsername() + "' role Cashire → Cashier");
                        });
            });
        });
    }

    private void syncMainBranchDetails() {
        branchRepository.findAll().stream().findFirst().ifPresent(branch -> {
            boolean changed = false;

            if (branch.getBranchName() == null
                    || branch.getBranchName().equals("Main Branch")
                    || branch.getBranchName().equals("Lumière Salon — Main Branch")
                    || branch.getBranchName().isBlank()) {
                branch.setBranchName("Malroo Salon — Main Branch");
                changed = true;
            }

            if (branch.getAddress() == null
                    || branch.getAddress().equals("123 Main St")
                    || branch.getAddress().equals("123 Main Street, Colombo, Sri Lanka")
                    || branch.getAddress().isBlank()) {
                branch.setAddress("Govinna Handiya, Ratiyelapaara, Sri Lanka");
                changed = true;
            }

            if (branch.getPhone() == null
                    || branch.getPhone().equals("555-0100")
                    || branch.getPhone().equals("+94 11 555 0100")
                    || branch.getPhone().isBlank()) {
                branch.setPhone("+94 77 432 6785");
                changed = true;
            }

            if (changed) {
                branchRepository.save(branch);
                System.out.println("MIGRATION: updated main branch details for public site");
            }
        });
    }

    private void backfillServiceCategories() {
        int updated = 0;
        for (SalonService service : salonServiceRepository.findAll()) {
            if (service.getCategory() != null && !service.getCategory().isBlank()) {
                continue;
            }

            String category = SERVICE_CATEGORY_BY_NAME.getOrDefault(service.getName(), "Other Services");
            service.setCategory(category);
            salonServiceRepository.save(service);
            updated++;
        }

        if (updated > 0) {
            System.out.println("MIGRATION: backfilled category on " + updated + " salon service(s)");
        }
    }

    private void ensureUsersLinkedToMainBranch() {
        Branch mainBranch = branchRepository.findAll().stream().findFirst().orElse(null);
        if (mainBranch == null) {
            return;
        }

        for (Users user : usersRepository.findAll()) {
            if (user.getBranch() != null) {
                continue;
            }

            Role role = user.getRole();
            if (role == null) {
                continue;
            }

            String roleName = role.getRoleName();
            if ("Owner".equals(roleName)) {
                continue;
            }

            if ("Branch Manager".equals(roleName)
                    || "Reception".equals(roleName)
                    || "Product Manager".equals(roleName)
                    || "Cashier".equals(roleName)
                    || "Chashire".equals(roleName)) {
                user.setBranch(mainBranch);
                usersRepository.save(user);
                System.out.println("MIGRATION: linked user '" + user.getUsername() + "' to main branch");
            }
        }
    }
}
