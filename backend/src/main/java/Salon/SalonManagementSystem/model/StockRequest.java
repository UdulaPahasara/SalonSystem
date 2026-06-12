package Salon.SalonManagementSystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "stock_requests")
public class StockRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestId;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    private Integer requestedQuantity;

    private String status; // PENDING / APPROVED / REJECTED

    @ManyToOne
    @JoinColumn(name = "requested_by")
    private Users requestedBy;

    // getters & setters

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
        this.branch = branch;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Users getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(Users requestedBy) {
        this.requestedBy = requestedBy;
    }
}
