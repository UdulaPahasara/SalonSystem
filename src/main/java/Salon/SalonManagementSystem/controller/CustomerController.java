package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Customer;
import Salon.SalonManagementSystem.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:3000")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, Object> payload) {
        try {
            String phone = (String) payload.get("phone");
            if (phone == null || !phone.matches("\\d{10}")) {
                throw new RuntimeException("Invalid phone number. Must be 10 digits.");
            }

            Customer c = new Customer();
            c.setFullName((String) payload.get("fullName"));
            c.setPhone(phone);
            c.setEmail((String) payload.get("email"));
            if (payload.get("loyaltyMember") != null) {
                c.setLoyaltyMember((Boolean) payload.get("loyaltyMember"));
            }

            Integer branchId = null;
            if (payload.get("branchId") != null) {
                branchId = ((Number) payload.get("branchId")).intValue();
            }

            return ResponseEntity.ok(customerService.createCustomer(c, branchId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<Customer> getAllCustomers(@RequestParam(required = false) Integer branchId) {
        return customerService.getAllCustomers(branchId);
    }

    @GetMapping("/search")
    public ResponseEntity<?> getCustomerByPhone(@RequestParam String phone) {
        return customerService.getCustomerByPhone(phone)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    return ResponseEntity.status(404).body(null); // Or verify 404 behavior
                });
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Integer id, @RequestBody Customer customer) {
        try {
            return ResponseEntity.ok(customerService.updateCustomer(id, customer));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Integer id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok().build();
    }
}
