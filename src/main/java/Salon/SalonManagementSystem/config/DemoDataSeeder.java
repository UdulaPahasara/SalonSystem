package Salon.SalonManagementSystem.config;

import Salon.SalonManagementSystem.model.*;
import Salon.SalonManagementSystem.repository.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Fills an empty system with realistic demo data so every screen has something to show.
 * Off by default. Run once with:  SALON_SEED_DEMO_DATA=true  (or -Dsalon.seed-demo-data=true)
 * Safe to re-run: it skips if demo customers (@example.com) already exist.
 */
@Component
@ConditionalOnProperty(name = "salon.seed-demo-data", havingValue = "true")
public class DemoDataSeeder {

    private static final String DEMO_DOMAIN = "@example.com";
    private static final String KANDY = "Malroo Salon — Kandy Branch (Demo)";

    private final BranchRepository branchRepo;
    private final RoleRepository roleRepo;
    private final UsersRepository usersRepo;
    private final ServiceStaffRepository staffRepo;
    private final SalonServiceRepository serviceRepo;
    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final BranchInventoryRepository inventoryRepo;
    private final StockRequestRepository stockRequestRepo;
    private final AppointmentRepository appointmentRepo;
    private final TransactionRepository transactionRepo;
    private final SalaryPaymentRepository salaryRepo;
    private final ContactMessageRepository contactRepo;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    public DemoDataSeeder(BranchRepository branchRepo, RoleRepository roleRepo, UsersRepository usersRepo,
            ServiceStaffRepository staffRepo, SalonServiceRepository serviceRepo, CustomerRepository customerRepo,
            ProductRepository productRepo, BranchInventoryRepository inventoryRepo,
            StockRequestRepository stockRequestRepo, AppointmentRepository appointmentRepo,
            TransactionRepository transactionRepo, SalaryPaymentRepository salaryRepo,
            ContactMessageRepository contactRepo, PasswordEncoder passwordEncoder, JdbcTemplate jdbc) {
        this.branchRepo = branchRepo;
        this.roleRepo = roleRepo;
        this.usersRepo = usersRepo;
        this.staffRepo = staffRepo;
        this.serviceRepo = serviceRepo;
        this.customerRepo = customerRepo;
        this.productRepo = productRepo;
        this.inventoryRepo = inventoryRepo;
        this.stockRequestRepo = stockRequestRepo;
        this.appointmentRepo = appointmentRepo;
        this.transactionRepo = transactionRepo;
        this.salaryRepo = salaryRepo;
        this.contactRepo = contactRepo;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
    }

    // Runs after every CommandLineRunner, so the default branch, roles and staff already exist.
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (customerRepo.findAll().stream().anyMatch(c -> c.getEmail() != null && c.getEmail().endsWith(DEMO_DOMAIN))) {
            System.out.println("DEMO DATA: already present, skipping.");
            return;
        }
        Branch main = branchRepo.findAll().stream().findFirst().orElse(null);
        if (main == null) {
            System.out.println("DEMO DATA: no main branch yet, skipping.");
            return;
        }
        Random rnd = new Random(42);

        Branch kandy = branchRepo.findAll().stream().filter(b -> KANDY.equals(b.getBranchName())).findFirst()
                .orElseGet(() -> {
                    Branch b = new Branch();
                    b.setBranchName(KANDY);
                    b.setAddress("45 Peradeniya Road, Kandy");
                    b.setPhone("+94 81 223 4455");
                    return branchRepo.save(b);
                });

        // ---- Staff accounts and salaries
        Users cashier2 = usersRepo.findByUsername("cashier2");
        if (cashier2 == null) {
            cashier2 = new Users();
            cashier2.setUsername("cashier2");
            cashier2.setPassword(passwordEncoder.encode(DatabaseMigrationRunner.DEFAULT_STAFF_PASSWORD));
            cashier2.setFullName("Cashier Kandy");
            cashier2.setRole(roleRepo.findByRoleName("Cashier").orElseThrow());
            cashier2.setBranch(kandy);
            cashier2 = usersRepo.save(cashier2);
        }
        setSalary("admin", 150000);
        setSalary("manager", 120000);
        setSalary("reception", 60000);
        setSalary("pm", 75000);
        setSalary("cashier", 65000);
        setSalary("cashier2", 62000);

        List<ServiceStaff> mainStaff = staffRepo.findByBranchId(main.getId());
        for (ServiceStaff s : mainStaff) {
            if (s.getBaseSalary() == null || s.getBaseSalary() == 0) {
                s.setBaseSalary(s.getRole() != null && s.getRole().equals("Stylist") ? 85000.0
                        : s.getRole() != null && s.getRole().equals("Therapist") ? 80000.0 : 70000.0);
                staffRepo.save(s);
            }
        }
        List<ServiceStaff> kandyStaff = staffRepo.findByBranchId(kandy.getId());
        if (kandyStaff.isEmpty()) {
            kandyStaff = new ArrayList<>();
            kandyStaff.add(newStaff("Dinuka Stylist", "Stylist", 82000.0, kandy));
            kandyStaff.add(newStaff("Madhavi Therapist", "Therapist", 78000.0, kandy));
        }

        // ---- Services for the second branch (copy of the main menu)
        List<SalonService> mainServices = serviceRepo.findByBranch_Id(main.getId());
        if (serviceRepo.findByBranch_Id(kandy.getId()).isEmpty()) {
            for (int i = 0; i < Math.min(8, mainServices.size()); i++) {
                SalonService src = mainServices.get(i);
                SalonService s = new SalonService();
                s.setName(src.getName());
                s.setCategory(src.getCategory());
                s.setPrice(src.getPrice());
                s.setDurationMins(src.getDurationMins());
                s.setBranch(kandy);
                serviceRepo.save(s);
            }
        }
        List<SalonService> kandyServices = serviceRepo.findByBranch_Id(kandy.getId());

        // ---- Customers
        String[] names = { "Nimali Perera", "Kavindi Silva", "Dilini Fernando", "Shanika Jayawardena",
                "Tharushi Gunasekara", "Ishara Rajapaksa", "Sachini Wickramasinghe", "Hansika Dissanayake",
                "Madushi Karunaratne", "Chamari Bandara", "Anjali Senanayake", "Oshadi Ratnayake",
                "Piumi Abeysekara", "Nethmi Herath", "Rashmi Amarasinghe", "Thilini Weerasinghe",
                "Yasodha Mendis", "Lakshani Peiris" };
        List<Customer> mainCustomers = new ArrayList<>();
        List<Customer> kandyCustomers = new ArrayList<>();
        for (int i = 0; i < names.length; i++) {
            Customer c = new Customer();
            c.setFullName(names[i]);
            c.setPhone(String.format("077%03d%04d", 100 + i, 2000 + i * 13));
            c.setEmail(names[i].toLowerCase().replace(' ', '.') + DEMO_DOMAIN);
            boolean member = i % 2 == 0;
            c.setLoyaltyMember(member);
            c.setLoyaltyPoints(member ? 50 + rnd.nextInt(400) : 0);
            boolean isKandy = i >= 14;
            c.setBranch(isKandy ? kandy : main);
            (isKandy ? kandyCustomers : mainCustomers).add(customerRepo.save(c));
        }

        // ---- Products and branch stock (a few low / out of stock on purpose)
        Object[][] productData = {
                { "Hydra Repair Shampoo 500ml", "SilkLine", 1200 }, { "Keratin Hair Mask 250g", "SilkLine", 3400 },
                { "Argan Hair Serum 100ml", "PureGlow", 2100 }, { "Heat Protect Spray 200ml", "PureGlow", 1500 },
                { "Gentle Face Cleanser", "DermaLux", 1800 }, { "Vitamin C Serum 30ml", "DermaLux", 4200 },
                { "Rose Nail Polish", "ColorKiss", 650 }, { "Gel Top Coat", "ColorKiss", 900 },
                { "Nourishing Hand Cream 75ml", "SilkLine", 800 }, { "Styling Comb Set", "Salon Pro", 550 } };
        int[] mainQty = { 24, 3, 11, 18, 4, 7, 0, 15, 40, 2 };
        int[] kandyQty = { 10, 8, 5, 12, 2, 9 };
        List<Product> products = new ArrayList<>();
        for (int i = 0; i < productData.length; i++) {
            Product p = new Product();
            p.setProductName((String) productData[i][0]);
            p.setBrand((String) productData[i][1]);
            p.setUnitPrice(BigDecimal.valueOf((Integer) productData[i][2]));
            p.setLowStockLimit(5);
            products.add(productRepo.save(p));
            stock(main, p, mainQty[i]);
            if (i < kandyQty.length) stock(kandy, p, kandyQty[i]);
        }

        // ---- Stock requests in every state
        Users pm = usersRepo.findByUsername("pm");
        int[][] requests = { { 1, 0, 20, 0 }, { 5, 0, 30, 0 }, { 4, 1, 10, 0 }, { 0, 0, 24, 1 }, { 2, 0, 12, 1 },
                { 5, 1, 15, 1 }, { 7, 0, 50, 2 }, { 3, 1, 40, 2 } };
        String[] states = { "PENDING", "APPROVED", "REJECTED" };
        for (int[] r : requests) {
            StockRequest sr = new StockRequest();
            sr.setProduct(products.get(r[0]));
            sr.setBranch(r[1] == 0 ? main : kandy);
            sr.setRequestedQuantity(r[2]);
            sr.setStatus(states[r[3]]);
            sr.setRequestedBy(pm);
            // newer requests are pending, older ones already decided
            sr.setCreatedAt(LocalDateTime.now().minusDays(r[3] == 0 ? 1 + rnd.nextInt(4) : 6 + rnd.nextInt(30)));
            stockRequestRepo.save(sr);
        }

        // ---- Sales (transactions) over the last weeks
        Users cashier = usersRepo.findByUsername("cashier");
        List<Product> mainSellable = new ArrayList<>(products);
        mainSellable.remove(6); // out of stock
        List<Product> kandySellable = products.subList(0, 6);
        int sales = 0;
        sales += makeSales(rnd, 75, 60, 2, main, cashier, mainServices, mainSellable, mainCustomers);
        sales += makeSales(rnd, 24, 45, 1, kandy, cashier2, kandyServices, kandySellable, kandyCustomers);

        // ---- Appointments (past completed/cancelled, upcoming booked)
        int appts = makeAppointments(rnd, 30, main, mainCustomers, mainServices, mainStaff)
                + makeAppointments(rnd, 8, kandy, kandyCustomers, kandyServices, kandyStaff);

        // ---- Salary history: two months ago all paid, last month all but one, this month partly
        YearMonth now = YearMonth.now();
        List<Users> paidUsers = new ArrayList<>();
        usersRepo.findAll().forEach(u -> { if (u.getBaseSalary() != null && u.getBaseSalary() > 0) paidUsers.add(u); });
        List<ServiceStaff> allStaff = new ArrayList<>(mainStaff);
        allStaff.addAll(kandyStaff);
        for (Users u : paidUsers) {
            pay(u, null, now.minusMonths(2), true);
            pay(u, null, now.minusMonths(1), !"reception".equals(u.getUsername()));
            pay(u, null, now, "cashier".equals(u.getUsername()));
        }
        for (ServiceStaff s : allStaff) {
            pay(null, s, now.minusMonths(2), true);
            pay(null, s, now.minusMonths(1), true);
            pay(null, s, now, s.getFullName().startsWith("Amy"));
        }

        // ---- Website enquiries
        String[][] messages = {
                { "Sandali Perera", "sandali.perera" + DEMO_DOMAIN, "077 555 0101", "Do you offer bridal packages for a December wedding? Please share prices.", "1" },
                { "Ruwani Silva", "ruwani.silva" + DEMO_DOMAIN, "", "What time do you open on Sundays?", "2" },
                { "Kasuni Fernando", "kasuni.f" + DEMO_DOMAIN, "071 444 9922", "I'd like to book a hair colour and keratin treatment next week.", "4" },
                { "Dinusha Rathnayake", "dinusha.r" + DEMO_DOMAIN, "", "Is parking available at the salon?", "6" },
                { "Menaka Jayasinghe", "menaka.j" + DEMO_DOMAIN, "076 333 2211", "Do you do party makeup for groups of four?", "9" },
                { "Hirushi Gamage", "hirushi.g" + DEMO_DOMAIN, "", "Can I cancel my appointment for Friday and reschedule?", "13" },
                { "Pavithra Kumari", "pavithra.k" + DEMO_DOMAIN, "075 888 7766", "Do you sell the Vitamin C serum used in the facial?", "18" } };
        for (String[] m : messages) {
            ContactMessage cm = new ContactMessage();
            cm.setFullName(m[0]);
            cm.setEmail(m[1]);
            cm.setPhone(m[2].isEmpty() ? null : m[2]);
            cm.setMessage(m[3]);
            cm = contactRepo.save(cm);
            jdbc.update("UPDATE contact_messages SET created_at = ? WHERE id = ?",
                    Timestamp.valueOf(LocalDateTime.now().minusDays(Integer.parseInt(m[4])).withHour(10 + rnd.nextInt(8)).withMinute(rnd.nextInt(60))),
                    cm.getId());
        }

        System.out.println("DEMO DATA: added 1 branch, 1 user, " + names.length + " customers, " + products.size()
                + " products, " + requests.length + " stock requests, " + sales + " sales, " + appts
                + " appointments, " + messages.length + " messages, plus salary history.");
    }

    private void setSalary(String username, double salary) {
        Users u = usersRepo.findByUsername(username);
        if (u != null && (u.getBaseSalary() == null || u.getBaseSalary() == 0)) {
            u.setBaseSalary(salary);
            usersRepo.save(u);
        }
    }

    private ServiceStaff newStaff(String name, String role, double salary, Branch branch) {
        ServiceStaff s = new ServiceStaff();
        s.setFullName(name);
        s.setRole(role);
        s.setBaseSalary(salary);
        s.setBranch(branch);
        return staffRepo.save(s);
    }

    private void stock(Branch branch, Product product, int qty) {
        BranchInventory inv = new BranchInventory();
        inv.setBranch(branch);
        inv.setProduct(product);
        inv.setQuantity(qty);
        inv.setLowStockLimit(5);
        inventoryRepo.save(inv);
    }

    private int makeSales(Random rnd, int count, int daysBack, int today, Branch branch, Users cashier,
            List<SalonService> services, List<Product> sellable, List<Customer> customers) {
        for (int n = 0; n < count; n++) {
            int daysAgo = n < today ? 0 : 1 + rnd.nextInt(daysBack - 1); // a couple of sales today, the rest spread over earlier days
            LocalDateTime when = LocalDateTime.now().minusDays(daysAgo).withHour(9 + (n < today ? n : rnd.nextInt(10)))
                    .withMinute(rnd.nextInt(60)).withSecond(0).withNano(0);
            if (when.isAfter(LocalDateTime.now())) when = when.minusDays(1);

            Transaction tx = new Transaction();
            tx.setBranch(branch);
            tx.setCashier(cashier);
            tx.setDateTime(when);
            tx.setPaymentMethod(rnd.nextInt(100) < 58 ? "CASH" : "CARD");
            if (!customers.isEmpty() && rnd.nextInt(100) < 55) tx.setCustomer(customers.get(rnd.nextInt(customers.size())));

            BigDecimal total = BigDecimal.ZERO;
            int lines = 1 + rnd.nextInt(3);
            for (int l = 0; l < lines; l++) {
                TransactionItem item = new TransactionItem();
                item.setTransaction(tx);
                if (l == 0 || rnd.nextInt(100) < 70) {
                    SalonService s = services.get(rnd.nextInt(services.size()));
                    item.setService(s);
                    item.setQuantity(1);
                    item.setUnitPrice(s.getPrice());
                } else {
                    Product p = sellable.get(rnd.nextInt(sellable.size()));
                    item.setProduct(p);
                    item.setQuantity(1 + rnd.nextInt(2));
                    item.setUnitPrice(p.getUnitPrice());
                }
                total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                tx.getItems().add(item);
            }
            tx.setTotalAmount(total);
            transactionRepo.save(tx);
        }
        return count;
    }

    private int makeAppointments(Random rnd, int count, Branch branch, List<Customer> customers,
            List<SalonService> services, List<ServiceStaff> staff) {
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < count; i++) {
            LocalDateTime when = LocalDate.now().plusDays(rnd.nextInt(41) - 30)
                    .atTime(9 + rnd.nextInt(9), rnd.nextBoolean() ? 0 : 30);
            Appointment a = new Appointment();
            a.setBranch(branch);
            Customer c = customers.get(rnd.nextInt(customers.size()));
            a.setCustomer(c);
            a.setServiceType(services.get(rnd.nextInt(services.size())).getName());
            a.setAppointmentTime(when);
            a.setApplyLoyalty(rnd.nextInt(100) < 25);
            if (rnd.nextInt(100) < 90 && !staff.isEmpty()) a.setAssignedStaff(staff.get(rnd.nextInt(staff.size())));
            if (when.isBefore(now)) a.setStatus(rnd.nextInt(100) < 82 ? "COMPLETED" : "CANCELLED");
            else a.setStatus(rnd.nextInt(100) < 92 ? "BOOKED" : "CANCELLED");
            appointmentRepo.save(a);
        }
        return count;
    }

    private void pay(Users user, ServiceStaff staff, YearMonth month, boolean paid) {
        if (!paid) return;
        String key = month.toString();
        boolean exists = user != null
                ? salaryRepo.findByUser_Id(user.getId()).stream().anyMatch(p -> key.equals(p.getPaymentMonth()))
                : salaryRepo.findByServiceStaff_Id(staff.getId()).stream().anyMatch(p -> key.equals(p.getPaymentMonth()));
        if (exists) return;
        SalaryPayment p = new SalaryPayment();
        p.setUser(user);
        p.setServiceStaff(staff);
        p.setAmount(user != null ? user.getBaseSalary() : staff.getBaseSalary());
        p.setPaymentMonth(key);
        LocalDate day = month.atDay(Math.min(28, month.lengthOfMonth()));
        p.setPaymentDate(day.isAfter(LocalDate.now()) ? LocalDate.now() : day);
        salaryRepo.save(p);
    }
}
