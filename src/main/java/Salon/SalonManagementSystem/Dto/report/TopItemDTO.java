package Salon.SalonManagementSystem.Dto.report;

import java.math.BigDecimal;

public class TopItemDTO {
    private String name;
    private Long quantitySold;
    private Long usageCount;
    private BigDecimal totalRevenue;

    public TopItemDTO() {
    }

    public TopItemDTO(String name, Long count, BigDecimal totalRevenue) {
        this.name = name;
        this.quantitySold = count;
        this.usageCount = count;
        this.totalRevenue = totalRevenue;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(Long quantitySold) {
        this.quantitySold = quantitySold;
    }

    public Long getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Long usageCount) {
        this.usageCount = usageCount;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
