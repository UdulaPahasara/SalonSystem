package Salon.SalonManagementSystem.Dto;

import java.util.List;

public class CheckoutRequest {

    private Integer branchId;
    private Integer cashierId;
    private Integer customerId; // optional, walk-in when null
    private String paymentMethod; // CASH or CARD
    private List<Line> items;

    public static class Line {
        private Integer serviceId; // set exactly one of serviceId / productId
        private Integer productId;
        private Integer quantity;

        public Integer getServiceId() {
            return serviceId;
        }

        public void setServiceId(Integer serviceId) {
            this.serviceId = serviceId;
        }

        public Integer getProductId() {
            return productId;
        }

        public void setProductId(Integer productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }

    public Integer getBranchId() {
        return branchId;
    }

    public void setBranchId(Integer branchId) {
        this.branchId = branchId;
    }

    public Integer getCashierId() {
        return cashierId;
    }

    public void setCashierId(Integer cashierId) {
        this.cashierId = cashierId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public List<Line> getItems() {
        return items;
    }

    public void setItems(List<Line> items) {
        this.items = items;
    }
}
