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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private TransactionRepository transactionRepository;



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

    // Optional date range; null means "all time".
    private List<Transaction> transactionsFor(Integer branchId, LocalDateTime start, LocalDateTime end) {
        LocalDateTime from = start != null ? start : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = end != null ? end : LocalDateTime.of(2100, 1, 1, 0, 0);
        return branchId != null
                ? transactionRepository.findByBranchAndDateRange(branchId, from, to)
                : transactionRepository.findByDateRange(from, to);
    }

    public List<TopItemDTO> getTopProducts(Integer branchId, LocalDateTime start, LocalDateTime end) {
        return topItems(transactionsFor(branchId, start, end),
                item -> item.getProduct() != null ? item.getProduct().getProductName() : null);
    }

    // Services come from checkout lines so the figures match revenue (price at time of sale).
    public List<TopItemDTO> getTopServices(Integer branchId, LocalDateTime start, LocalDateTime end) {
        return topItems(transactionsFor(branchId, start, end),
                item -> item.getService() != null ? item.getService().getName() : null);
    }

    private List<TopItemDTO> topItems(List<Transaction> transactions, Function<TransactionItem, String> nameOf) {
        Map<String, TopItemDTO> byName = new HashMap<>();
        for (Transaction t : transactions) {
            if (t.getItems() == null)
                continue;
            for (TransactionItem item : t.getItems()) {
                String name = nameOf.apply(item);
                if (name == null)
                    continue;
                BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice()
                        : item.getProduct() != null ? item.getProduct().getUnitPrice()
                                : item.getService() != null ? item.getService().getPrice() : BigDecimal.ZERO;
                long qty = item.getQuantity() == null ? 1 : item.getQuantity();
                byName.merge(name, new TopItemDTO(name, qty, price.multiply(BigDecimal.valueOf(qty))), (a, b) -> {
                    a.setQuantitySold(a.getQuantitySold() + b.getQuantitySold());
                    a.setUsageCount(a.getUsageCount() + b.getUsageCount());
                    a.setTotalRevenue(a.getTotalRevenue().add(b.getTotalRevenue()));
                    return a;
                });
            }
        }
        return byName.values().stream()
                .sorted((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()))
                .limit(10)
                .collect(Collectors.toList());
    }
}
