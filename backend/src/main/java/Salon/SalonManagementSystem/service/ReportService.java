package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.Dto.report.RevenueReportDTO;
import Salon.SalonManagementSystem.Dto.report.TopItemDTO;
import Salon.SalonManagementSystem.model.Transaction;
import Salon.SalonManagementSystem.model.TransactionItem;
import Salon.SalonManagementSystem.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private Salon.SalonManagementSystem.repository.AppointmentRepository appointmentRepository;

    @Autowired
    private Salon.SalonManagementSystem.repository.SalonServiceRepository salonServiceRepository;

    public List<RevenueReportDTO> getRevenueReport(Integer branchId, LocalDateTime startDate, LocalDateTime endDate,
            String period) {
        List<Transaction> transactions;
        if (branchId != null) {
            transactions = transactionRepository.findByBranchAndDateRange(branchId, startDate, endDate);
        } else {
            transactions = transactionRepository.findByDateRange(startDate, endDate);
        }

        // Aggregate by day or month
        Map<String, List<Transaction>> grouped;
        DateTimeFormatter formatter;

        if ("monthly".equalsIgnoreCase(period)) {
            formatter = DateTimeFormatter.ofPattern("yyyy-MM");
            grouped = transactions.stream()
                    .collect(Collectors.groupingBy(t -> t.getDateTime().format(formatter)));
        } else {
            // Default to daily
            formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            grouped = transactions.stream()
                    .collect(Collectors.groupingBy(t -> t.getDateTime().format(formatter)));
        }

        List<RevenueReportDTO> report = new ArrayList<>();

        for (Map.Entry<String, List<Transaction>> entry : grouped.entrySet()) {
            String label = entry.getKey();
            List<Transaction> txs = entry.getValue();

            BigDecimal total = txs.stream()
                    .map(Transaction::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            report.add(new RevenueReportDTO(label, total, (long) txs.size()));
        }

        report.sort(Comparator.comparing(RevenueReportDTO::getLabel));
        return report;
    }

    public List<TopItemDTO> getTopProducts(Integer branchId) {
        List<Transaction> transactions;
        if (branchId != null) {
            transactions = transactionRepository.findByBranch_Id(branchId);
        } else {
            transactions = transactionRepository.findAll();
        }

        Map<String, TopItemDTO> productMap = new HashMap<>();

        for (Transaction t : transactions) {
            if (t.getItems() == null)
                continue;
            for (TransactionItem item : t.getItems()) {
                // Assuming TransactionItem only holds Products for now based on service logic
                if (item.getProduct() != null) {
                    String productName = item.getProduct().getProductName();
                    productMap.compute(productName, (k, v) -> {
                        if (v == null) {
                            // Calculate revenue for this item: unitPrice * qty
                            BigDecimal itemTotal = item.getProduct().getUnitPrice()
                                    .multiply(BigDecimal.valueOf(item.getQuantity()));
                            return new TopItemDTO(k, (long) item.getQuantity(), itemTotal);
                        } else {
                            v.setQuantitySold(v.getQuantitySold() + item.getQuantity());
                            BigDecimal itemTotal = item.getProduct().getUnitPrice()
                                    .multiply(BigDecimal.valueOf(item.getQuantity()));
                            v.setTotalRevenue(v.getTotalRevenue().add(itemTotal));
                            return v;
                        }
                    });
                }
            }
        }

        return productMap.values().stream()
                .sorted((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()))
                .limit(10)
                .collect(Collectors.toList());
    }

    public List<TopItemDTO> getTopServices(Integer branchId) {
        // Use AppointmentRepository for services
        List<Salon.SalonManagementSystem.model.Appointment> appointments;
        List<Salon.SalonManagementSystem.model.SalonService> allServices;

        if (branchId != null) {
            appointments = appointmentRepository.findByBranch_Id(branchId);
            allServices = salonServiceRepository.findByBranch_Id(branchId);
        } else {
            appointments = appointmentRepository.findAll();
            allServices = salonServiceRepository.findAll();
        }

        // Create a lookup map: "BranchId:ServiceName" -> Price
        Map<String, BigDecimal> priceMap = new HashMap<>();
        for (Salon.SalonManagementSystem.model.SalonService s : allServices) {
            String key = s.getBranch().getId() + ":" + s.getName();
            priceMap.put(key, s.getPrice());
        }

        Map<String, TopItemDTO> serviceMap = new HashMap<>();

        for (Salon.SalonManagementSystem.model.Appointment appt : appointments) {
            String status = appt.getStatus();
            if ("COMPLETED".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) {
                String serviceName = appt.getServiceType();
                if (serviceName == null)
                    continue;

                // Lookup price
                String key = appt.getBranch().getId() + ":" + serviceName;
                BigDecimal price = priceMap.getOrDefault(key, BigDecimal.ZERO);

                serviceMap.compute(serviceName, (k, v) -> {
                    if (v == null) {
                        return new TopItemDTO(k, 1L, price);
                    } else {
                        v.setUsageCount(v.getUsageCount() + 1);
                        v.setTotalRevenue(v.getTotalRevenue().add(price));
                        return v;
                    }
                });
            }
        }

        return serviceMap.values().stream()
                .sorted((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()))
                .limit(10)
                .collect(Collectors.toList());
    }
}
