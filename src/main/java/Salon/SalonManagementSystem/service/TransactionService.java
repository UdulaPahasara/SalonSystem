package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.Dto.CheckoutRequest;
import Salon.SalonManagementSystem.model.*;
import Salon.SalonManagementSystem.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Service
public class TransactionService {

    private static final Set<String> PAYMENT_METHODS = Set.of("CASH", "CARD");

    private final TransactionRepository transactionRepo;
    private final BranchRepository branchRepo;
    private final UsersRepository usersRepo;
    private final CustomerRepository customerRepo;
    private final SalonServiceRepository serviceRepo;
    private final ProductRepository productRepo;
    private final BranchInventoryRepository inventoryRepo;
    private final AppointmentRepository appointmentRepo;
    private final int rsPerPoint;

    public TransactionService(
            TransactionRepository transactionRepo,
            BranchRepository branchRepo,
            UsersRepository usersRepo,
            CustomerRepository customerRepo,
            SalonServiceRepository serviceRepo,
            ProductRepository productRepo,
            BranchInventoryRepository inventoryRepo,
            AppointmentRepository appointmentRepo,
            @org.springframework.beans.factory.annotation.Value("${salon.loyalty.rs-per-point:100}") int rsPerPoint) {
        this.transactionRepo = transactionRepo;
        this.branchRepo = branchRepo;
        this.usersRepo = usersRepo;
        this.customerRepo = customerRepo;
        this.serviceRepo = serviceRepo;
        this.productRepo = productRepo;
        this.inventoryRepo = inventoryRepo;
        this.appointmentRepo = appointmentRepo;
        this.rsPerPoint = rsPerPoint;
    }

    // Prices come from the database, never from the client; product stock is deducted.
    @Transactional
    public Transaction checkout(CheckoutRequest req) {
        Salon.SalonManagementSystem.security.AuthUser me = Salon.SalonManagementSystem.security.AuthContext.current();
        if (me != null) {
            Salon.SalonManagementSystem.security.AuthContext.requireBranch(req.getBranchId());
            req.setCashierId(me.id()); // the cashier is whoever is signed in
        }
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Add at least one service or product");
        }
        String method = req.getPaymentMethod() == null ? "" : req.getPaymentMethod().toUpperCase();
        if (!PAYMENT_METHODS.contains(method)) {
            throw new RuntimeException("Payment method must be CASH or CARD");
        }
        if (req.getBranchId() == null || req.getCashierId() == null) {
            throw new RuntimeException("Branch and cashier are required");
        }

        Branch branch = branchRepo.findById(req.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        Transaction tx = new Transaction();
        tx.setBranch(branch);
        tx.setCashier(usersRepo.findById(req.getCashierId())
                .orElseThrow(() -> new RuntimeException("Cashier not found")));
        if (req.getCustomerId() != null) {
            tx.setCustomer(customerRepo.findById(req.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found")));
        }
        tx.setPaymentMethod(method);
        tx.setDateTime(LocalDateTime.now());

        BigDecimal total = BigDecimal.ZERO;
        for (CheckoutRequest.Line line : req.getItems()) {
            int qty = line.getQuantity() == null ? 0 : line.getQuantity();
            if (qty < 1) {
                throw new RuntimeException("Quantity must be at least 1");
            }
            if ((line.getServiceId() == null) == (line.getProductId() == null)) {
                throw new RuntimeException("Each line must be either a service or a product");
            }

            TransactionItem item = new TransactionItem();
            item.setTransaction(tx);
            item.setQuantity(qty);

            if (line.getServiceId() != null) {
                SalonService service = serviceRepo.findById(line.getServiceId())
                        .orElseThrow(() -> new RuntimeException("Service not found"));
                if (service.getBranch() == null || !service.getBranch().getId().equals(branch.getId())) {
                    throw new RuntimeException(service.getName() + " is not offered at this branch");
                }
                item.setService(service);
                item.setUnitPrice(service.getPrice());
            } else {
                Product product = productRepo.findById(line.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                BranchInventory stock = inventoryRepo.findInventoryByBranchAndProduct(branch, product)
                        .orElseThrow(() -> new RuntimeException(product.getProductName() + " is not stocked at this branch"));
                if (inventoryRepo.deductStock(branch, product, qty) == 0) {
                    int left = inventoryRepo.findInventoryByBranchAndProduct(branch, product)
                            .map(s -> s.getQuantity() == null ? 0 : s.getQuantity()).orElse(0);
                    throw new RuntimeException("Only " + left + " " + product.getProductName() + " left in stock");
                }
                item.setProduct(product);
                item.setUnitPrice(product.getUnitPrice());
            }

            total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(qty)));
            tx.getItems().add(item);
        }

        tx.setTotalAmount(total);
        Transaction saved = transactionRepo.save(tx);

        // Paying for a booked visit completes it.
        Appointment visit = req.getAppointmentId() == null ? null : appointmentRepo.findById(req.getAppointmentId()).orElse(null);
        if (visit != null) {
            if (visit.getBranch() == null || !visit.getBranch().getId().equals(branch.getId())) {
                throw new RuntimeException("That appointment belongs to a different branch");
            }
            if ("BOOKED".equals(visit.getStatus())) {
                visit.setStatus("COMPLETED");
                appointmentRepo.save(visit);
            }
        }

        // Loyalty: members earn 1 point per `rsPerPoint` rupees. Ticking "loyalty" on the booking enrols the customer.
        Customer customer = saved.getCustomer();
        if (customer != null && rsPerPoint > 0) {
            boolean enrol = visit != null && visit.isApplyLoyalty();
            if (customer.isLoyaltyMember() || enrol) {
                customer.setLoyaltyMember(true);
                customer.setLoyaltyPoints(customer.getLoyaltyPoints() + total.divide(BigDecimal.valueOf(rsPerPoint), 0, java.math.RoundingMode.DOWN).intValue());
                customerRepo.save(customer);
            }
        }
        return saved;
    }
}
