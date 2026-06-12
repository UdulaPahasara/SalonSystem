package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    java.util.Optional<Role> findByRoleName(String roleName);
}
