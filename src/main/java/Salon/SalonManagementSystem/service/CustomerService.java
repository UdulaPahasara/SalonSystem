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
        c.setFullName(details.getFullName());
        c.setPhone(details.getPhone());
        c.setEmail(details.getEmail());
        c.setLoyaltyMember(details.isLoyaltyMember());
        return customerRepository.save(c);
    }

    public void deleteCustomer(Integer id) {
        customerRepository.deleteById(id);
    }



}

