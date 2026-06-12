package Salon.SalonManagementSystem.Dto;

public class CreateUserRequest {
    private String username;
    private String password;
    private String fullName;
    private Integer roleId;
    private  Integer branchId;


    // getters/setters


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public Integer getBranchId() {
        return branchId;
    }
    public void setBranchId(Integer branchId) { this.branchId = branchId; }
}
