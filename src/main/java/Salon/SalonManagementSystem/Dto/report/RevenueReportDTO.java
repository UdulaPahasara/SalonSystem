package Salon.SalonManagementSystem.Dto.report;

import java.math.BigDecimal;

public class RevenueReportDTO {
    private String label;
    private BigDecimal totalRevenue;
    private Long transactionCount;

    public RevenueReportDTO() {
    }

    public RevenueReportDTO(String label, BigDecimal totalRevenue, Long transactionCount) {
        this.label = label;
        this.totalRevenue = totalRevenue;
        this.transactionCount = transactionCount;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }
}
