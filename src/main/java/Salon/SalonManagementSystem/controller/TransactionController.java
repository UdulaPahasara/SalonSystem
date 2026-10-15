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
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // startDate/endDate (ISO date-times) are optional: screens that only need recent sales ask for just those.
    @GetMapping
    public ResponseEntity<List<Transaction>> getAll(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        if (startDate != null || endDate != null) {
            return ResponseEntity.ok(transactionRepository.findByDateRange(from(startDate), to(endDate)));
        }
        return ResponseEntity.ok(transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "dateTime")));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Transaction>> getByBranch(
            @PathVariable Integer branchId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        if (startDate != null || endDate != null) {
            return ResponseEntity.ok(transactionRepository.findByBranchAndDateRange(branchId, from(startDate), to(endDate)));
        }
        return ResponseEntity.ok(transactionRepository.findByBranch_Id(branchId));
    }

    private static java.time.LocalDateTime from(java.time.LocalDateTime d) {
        return d != null ? d : java.time.LocalDateTime.of(2000, 1, 1, 0, 0);
    }

    private static java.time.LocalDateTime to(java.time.LocalDateTime d) {
        return d != null ? d : java.time.LocalDateTime.of(2100, 1, 1, 0, 0);
    }
}
