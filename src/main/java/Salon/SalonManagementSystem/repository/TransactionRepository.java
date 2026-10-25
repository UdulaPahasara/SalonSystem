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

    /** One row per customer who has ever paid up to `end`: [customerId, first payment, last payment, number of payments]. */
    @Query("SELECT t.customer.customerId, MIN(t.dateTime), MAX(t.dateTime), COUNT(t) FROM Transaction t "
            + "WHERE t.customer IS NOT NULL AND t.dateTime <= :end GROUP BY t.customer.customerId")
    List<Object[]> customerVisitSpan(@Param("end") LocalDateTime end);
}
