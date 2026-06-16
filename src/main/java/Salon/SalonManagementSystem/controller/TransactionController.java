package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.model.Transaction;
import Salon.SalonManagementSystem.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Transaction>> getByBranch(@PathVariable Integer branchId) {
        return ResponseEntity.ok(transactionRepository.findByBranch_Id(branchId));
    }
}
