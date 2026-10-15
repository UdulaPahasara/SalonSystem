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
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, Object> payload) {
        try {
            String phone = CustomerService.cleanPhone((String) payload.get("phone"));
            String name = ((String) payload.get("fullName") == null ? "" : ((String) payload.get("fullName")).trim());
            String email = payload.get("email") == null ? null : ((String) payload.get("email")).trim();
            CustomerService.validate(name, phone, email);

            Customer c = new Customer();
            c.setFullName(name);
            c.setPhone(phone);
            c.setEmail(email == null || email.isEmpty() ? null : email);
            if (payload.get("loyaltyMember") != null) {
                c.setLoyaltyMember((Boolean) payload.get("loyaltyMember"));
            }

            Integer branchId = null;
            if (payload.get("branchId") != null) {
                branchId = ((Number) payload.get("branchId")).intValue();
            }

            if (branchId == null) throw new RuntimeException("Branch is required.");
            Salon.SalonManagementSystem.security.AuthContext.requireBranch(branchId);
            return ResponseEntity.ok(customerService.createCustomer(c, branchId));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
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
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Integer id) {
        try {
            customerService.deleteCustomer(id);
            return ResponseEntity.ok().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409)
                    .body("This customer has appointments or purchases on record and can't be deleted.");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
