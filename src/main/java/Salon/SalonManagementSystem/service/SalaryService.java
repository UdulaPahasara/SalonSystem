package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.SalaryPayment;
import Salon.SalonManagementSystem.model.ServiceStaff;
import Salon.SalonManagementSystem.model.Users;
import Salon.SalonManagementSystem.repository.SalaryPaymentRepository;
import Salon.SalonManagementSystem.repository.ServiceStaffRepository;
import Salon.SalonManagementSystem.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SalaryService {

    @Autowired
    private SalaryPaymentRepository salaryRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private ServiceStaffRepository staffRepository;

    public List<Map<String, Object>> getAllStaffWithSalaryStatus(String month) {
        List<Map<String, Object>> result = new ArrayList<>();

        List<Users> users = usersRepository.findAll();
        for (Users u : users) {
            processUser(u, month, result);
        }

        List<ServiceStaff> staff = staffRepository.findAll();
        for (ServiceStaff s : staff) {
            processStaff(s, month, result);
        }

        return result;
    }

    public List<Map<String, Object>> getStaffWithSalaryStatusByBranch(Integer branchId, String month) {
        List<Map<String, Object>> result = new ArrayList<>();

        List<Users> users = usersRepository.findByBranchId(branchId);
        for (Users u : users) {
            processUser(u, month, result);
        }

        List<ServiceStaff> staff = staffRepository.findByBranchId(branchId);
        for (ServiceStaff s : staff) {
            processStaff(s, month, result);
        }

        return result;
    }

    private void processUser(Users u, String month, List<Map<String, Object>> result) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("type", "USER");
        map.put("name", u.getFullName());
        try {
            if (u.getRole() == null) {
                return;
            }

            map.put("role", u.getRole().getRoleName());
            map.put("branch", u.getBranch() != null ? u.getBranch().getBranchName() : "Head Office");
            map.put("baseSalary", u.getBaseSalary());

            boolean paid = salaryRepository.findByUser_Id(u.getId()).stream()
                    .anyMatch(p -> p.getPaymentMonth().equals(month));
            map.put("isPaid", paid);

            result.add(map);
        } catch (Exception e) {
            System.err.println("Error processing user " + u.getUsername() + ": " + e.getMessage());
        }
    }

    private void processStaff(ServiceStaff s, String month, List<Map<String, Object>> result) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("type", "SERVICE_STAFF");
        map.put("name", s.getFullName());
        map.put("role", s.getRole());
        map.put("branch", s.getBranch() != null ? s.getBranch().getBranchName() : "Unknown Branch");
        map.put("baseSalary", s.getBaseSalary());

        boolean paid = salaryRepository.findByServiceStaff_Id(s.getId()).stream()
                .anyMatch(p -> p.getPaymentMonth().equals(month));
        map.put("isPaid", paid);

        result.add(map);
    }

    public SalaryPayment paySalary(String type, Integer id, Double amount, String month) {
        SalaryPayment payment = new SalaryPayment();
        payment.setAmount(amount);
        payment.setPaymentMonth(month);
        payment.setPaymentDate(LocalDate.now());

        if ("USER".equals(type)) {
            Users u = usersRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
            payment.setUser(u);
        } else if ("SERVICE_STAFF".equals(type)) {
            ServiceStaff s = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Staff not found"));
            payment.setServiceStaff(s);
        } else {
            throw new RuntimeException("Invalid staff type");
        }

        return salaryRepository.save(payment);
    }

    public void updateBaseSalary(String type, Integer id, Double newSalary) {
        if ("USER".equals(type)) {
            Users u = usersRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
            u.setBaseSalary(newSalary);
            usersRepository.save(u);
        } else if ("SERVICE_STAFF".equals(type)) {
            ServiceStaff s = staffRepository.findById(id).orElseThrow(() -> new RuntimeException("Staff not found"));
            s.setBaseSalary(newSalary);
            staffRepository.save(s);
        }
    }
}
