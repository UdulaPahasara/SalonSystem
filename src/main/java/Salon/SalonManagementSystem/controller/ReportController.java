package Salon.SalonManagementSystem.controller;

import Salon.SalonManagementSystem.Dto.report.RevenueReportDTO;
import Salon.SalonManagementSystem.Dto.report.TopItemDTO;
import Salon.SalonManagementSystem.security.AuthContext;
import Salon.SalonManagementSystem.security.AuthUser;
import Salon.SalonManagementSystem.service.BusinessReportService;
import Salon.SalonManagementSystem.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports") // Allow frontend access
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private BusinessReportService businessReport;

    // The full manager's report: grouped sections plus plain-language findings. Salary costs are for the Owner only.
    @GetMapping("/business")
    public ResponseEntity<Map<String, Object>> getBusinessReport(
            @RequestParam(required = false) Integer branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "daily") String period) {
        if (endDate.isBefore(startDate)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "The end date must not be before the start date.");
        }
        AuthUser me = AuthContext.current();
        return ResponseEntity.ok(businessReport.build(branchId, startDate, endDate, "monthly".equalsIgnoreCase(period), me == null || me.isOwner()));
    }

    // Get Revenue Report
    @GetMapping("/revenue")
    // @PreAuthorize("hasAnyRole('Owner', 'Branch Manager')")
    public ResponseEntity<List<RevenueReportDTO>> getRevenueReport(
            @RequestParam(required = false) Integer branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "daily") String period) {

        // NOTE: Branch Managers should only be able to see their own branch.
        // In a real app, we'd validate the branchId against the logged-in user's branch
        // for BranchConfig.
        // For now, relying on frontend to send correct ID.

        List<RevenueReportDTO> report = reportService.getRevenueReport(branchId, startDate, endDate, period);
        return ResponseEntity.ok(report);
    }

    // Get Top Selling Products
    @GetMapping("/top-products")
    // @PreAuthorize("hasAnyRole('Owner', 'Branch Manager')")
    public ResponseEntity<List<TopItemDTO>> getTopProducts(
            @RequestParam(required = false) Integer branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getTopProducts(branchId, startDate, endDate));
    }

    // Get Top Selling Services
    @GetMapping("/top-services")
    // @PreAuthorize("hasAnyRole('Owner', 'Branch Manager')")
    public ResponseEntity<List<TopItemDTO>> getTopServices(
            @RequestParam(required = false) Integer branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getTopServices(branchId, startDate, endDate));
    }
}
