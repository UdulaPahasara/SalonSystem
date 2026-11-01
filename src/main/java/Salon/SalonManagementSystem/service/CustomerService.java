package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.Customer;
import Salon.SalonManagementSystem.repository.CustomerRepository;
import Salon.SalonManagementSystem.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BranchRepository branchRepository; // Add this

    private static final java.util.regex.Pattern EMAIL = java.util.regex.Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    /** Phone numbers are stored as digits only, so "077 123 4567" and "0771234567" are the same number. */
    public static String cleanPhone(String phone) {
        return phone == null ? "" : phone.replaceAll("[\\s-]", "");
    }

    public static void validate(String name, String phone, String email) {
        if (name == null || name.isBlank() || name.length() > 100) throw new RuntimeException("Full name is required (up to 100 characters).");
        if (!phone.matches("\\d{10}")) throw new RuntimeException("Invalid phone number. Must be 10 digits.");
        if (email != null && !email.isBlank() && (email.length() > 150 || !EMAIL.matcher(email).matches())) throw new RuntimeException("Enter a valid email address.");
    }

    public Customer createCustomer(Customer customer, Integer branchId) {
        if (customerRepository.findByPhone(customer.getPhone()).isPresent()) {
            throw new RuntimeException("Customer with this phone already exists.");
        }
        if (branchId != null) {
            customer.setBranch(branchRepository.findById(branchId).orElse(null));
        }
        return customerRepository.save(customer);
    }

    public List<Customer> getAllCustomers(Integer branchId) {
        if (branchId != null) {
            return customerRepository.findByBranch_Id(branchId);
        }
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerByPhone(String phone) {
        return customerRepository.findByPhone(phone);
    }

    public void addLoyaltyPoints(Integer customerId, int points) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + points);
        customerRepository.save(customer);
    }

    public Customer updateCustomer(Integer id, Customer details) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Salon.SalonManagementSystem.security.AuthContext.requireBranch(c.getBranch() == null ? null : c.getBranch().getId());
        String phone = cleanPhone(details.getPhone());
        String email = details.getEmail() == null ? null : details.getEmail().trim();
        validate(details.getFullName() == null ? null : details.getFullName().trim(), phone, email);
        customerRepository.findByPhone(phone).ifPresent(other -> {
            if (!other.getCustomerId().equals(id)) throw new RuntimeException("Another customer already has this phone number.");
        });
        c.setFullName(details.getFullName().trim());
        c.setPhone(phone);
        c.setEmail(email == null || email.isEmpty() ? null : email);
        c.setLoyaltyMember(details.isLoyaltyMember());
        return customerRepository.save(c);
    }

    public void deleteCustomer(Integer id) {
        Customer c = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
        Salon.SalonManagementSystem.security.AuthContext.requireBranch(c.getBranch() == null ? null : c.getBranch().getId());
        customerRepository.delete(c);
        customerRepository.flush();
    }



}

