package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Product;
import Salon.SalonManagementSystem.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<Product> all() {
        return service.getAll();
    }

    @PostMapping
    public Product create(@RequestBody Product p) {
        return service.save(p);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Integer id,
            @RequestBody Product p) {
        return service.update(id, p);
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            service.delete(id);
            return org.springframework.http.ResponseEntity.ok().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return org.springframework.http.ResponseEntity.status(409)
                    .body("Cannot delete product: It is used in Inventory, Stock Requests, or Sales.");
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body("Error deleting product");
        }
    }

    // Get products filtered by Product Manager's assigned branches
    @GetMapping("/by-manager/{userId}")
    public List<Product> getByProductManager(@PathVariable Integer userId) {
        return service.getProductsByManager(userId);
    }

}
