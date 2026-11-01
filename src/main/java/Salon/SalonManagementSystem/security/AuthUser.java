package Salon.SalonManagementSystem.security;

/** The signed-in user, as proven by a valid token. */
public record AuthUser(int id, String role, Integer branchId) {

    public static final String OWNER = "Owner";
    public static final String MANAGER = "Branch Manager";
    public static final String RECEPTION = "Reception";
    public static final String CASHIER = "Cashier";
    public static final String PRODUCT_MANAGER = "Product Manager";

    public boolean isOwner() {
        return OWNER.equals(role);
    }

    /** Owners and Product Managers work across every branch; everyone else is tied to one. */
    public boolean isBranchScoped() {
        return !OWNER.equals(role) && !PRODUCT_MANAGER.equals(role);
    }
}
