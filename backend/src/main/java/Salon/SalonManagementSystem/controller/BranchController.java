package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.service.BranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")// use plural word
@CrossOrigin("http://localhost:3000")
public class BranchController {

    @Autowired
    private BranchService branchService;

    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        return ResponseEntity.ok(branchService.saveBranch(branch));
    }

    @GetMapping
    public ResponseEntity<List<Branch>> getBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok("Branch deleted");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Integer id, @RequestBody Branch branch) {
        return ResponseEntity.ok(branchService.updateBranch(id, branch));
    }
}
