package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UsersRepository extends JpaRepository<Users, Integer> {
    Users findByUsername(String username);

    @Query("SELECT u FROM Users u WHERE u.branch.id = :branchId")
    List<Users> findByBranchId(@Param("branchId") Integer branchId);

    long countByBranchId(Integer branchId);

    List<Users> findByRole_RoleNameIn(List<String> roleNames);
}
