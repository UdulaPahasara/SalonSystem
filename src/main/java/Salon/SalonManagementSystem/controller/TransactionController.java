package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.CheckoutRequest;
import Salon.SalonManagementSystem.service.TransactionService;

import Salon.SalonManagementSystem.model.Transaction;
import Salon.SalonManagementSystem.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest request) {
        try {
            return ResponseEntity.ok(transactionService.checkout(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAll() {
        return ResponseEntity.ok(transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "dateTime")));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Transaction>> getByBranch(@PathVariable Integer branchId) {
        return ResponseEntity.ok(transactionRepository.findByBranch_Id(branchId));
    }
}
