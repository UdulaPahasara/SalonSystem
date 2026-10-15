package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.service.BranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")// use plural word
public class BranchController {

    @Autowired
    private BranchService branchService;

    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        check(branch);
        return ResponseEntity.ok(branchService.saveBranch(branch));
    }

    @GetMapping
    public ResponseEntity<List<Branch>> getBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            branchService.deleteBranch(id);
            return ResponseEntity.ok("Branch deleted");
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).body("This branch still has staff, services, customers or sales, so it can't be deleted.");
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Integer id, @RequestBody Branch branch) {
        check(branch);
        return ResponseEntity.ok(branchService.updateBranch(id, branch));
    }

    private void check(Branch b) {
        String name = b.getBranchName() == null ? "" : b.getBranchName().trim();
        if (name.isEmpty() || name.length() > 100) throw new IllegalArgumentException("Branch name is required (up to 100 characters).");
        if (b.getAddress() != null && b.getAddress().length() > 255) throw new IllegalArgumentException("Address is too long.");
        if (b.getPhone() != null && b.getPhone().length() > 30) throw new IllegalArgumentException("Phone number is too long.");
        b.setBranchName(name);
    }
}
