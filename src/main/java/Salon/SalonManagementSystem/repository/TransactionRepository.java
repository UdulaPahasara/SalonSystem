package Salon.SalonManagementSystem.repository;

import Salon.SalonManagementSystem.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    List<Transaction> findByBranch_Id(Integer branchId);

    @Query("SELECT t FROM Transaction t WHERE t.branch.id = :branchId AND t.dateTime BETWEEN :startDate AND :endDate")
    List<Transaction> findByBranchAndDateRange(
            @Param("branchId") Integer branchId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT t FROM Transaction t WHERE t.dateTime BETWEEN :startDate AND :endDate")
    List<Transaction> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
