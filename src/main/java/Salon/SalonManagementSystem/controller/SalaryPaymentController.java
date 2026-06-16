package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.service.SalaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salary")
@CrossOrigin(origins = "http://localhost:3000")
public class SalaryPaymentController {

    @Autowired
    private SalaryService salaryService;

    @GetMapping("/staff-status")
    public List<Map<String, Object>> getStaffSalaryStatus(
            @RequestParam String month,
            @RequestParam(required = false) Integer branchId) {
        if (branchId != null) {
            return salaryService.getStaffWithSalaryStatusByBranch(branchId, month);
        }
        return salaryService.getAllStaffWithSalaryStatus(month);
    }

    @PostMapping("/pay")
    public ResponseEntity<?> paySalary(@RequestBody Map<String, Object> payload) {
        try {
            String type = (String) payload.get("type");
            Integer id = ((Number) payload.get("id")).intValue();
            Double amount = ((Number) payload.get("amount")).doubleValue();
            String month = (String) payload.get("month");

            return ResponseEntity.ok(salaryService.paySalary(type, id, amount, month));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/update-base")
    public ResponseEntity<?> updateBaseSalary(@RequestBody Map<String, Object> payload) {
        try {
            String type = (String) payload.get("type");
            Integer id = ((Number) payload.get("id")).intValue();
            Double newSalary = ((Number) payload.get("baseSalary")).doubleValue();

            salaryService.updateBaseSalary(type, id, newSalary);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
