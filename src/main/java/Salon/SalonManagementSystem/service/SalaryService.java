package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.Branch;
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

    // Past payments for a range of months ("YYYY-MM" to "YYYY-MM", inclusive), newest first.
    public List<Map<String, Object>> getPaymentHistory(String fromMonth, String toMonth, Integer branchId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (SalaryPayment p : salaryRepository.findByPaymentMonthBetween(fromMonth, toMonth)) {
            Branch branch = p.getUser() != null ? p.getUser().getBranch()
                    : p.getServiceStaff() != null ? p.getServiceStaff().getBranch() : null;
            if (branchId != null && (branch == null || !branchId.equals(branch.getId()))) {
                continue;
            }
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("month", p.getPaymentMonth());
            map.put("paymentDate", p.getPaymentDate());
            map.put("amount", p.getAmount());
            map.put("type", p.getUser() != null ? "USER" : "SERVICE_STAFF");
            map.put("staffId", p.getUser() != null ? p.getUser().getId() : p.getServiceStaff().getId());
            map.put("name", p.getUser() != null ? p.getUser().getFullName() : p.getServiceStaff().getFullName());
            map.put("role", p.getUser() != null && p.getUser().getRole() != null ? p.getUser().getRole().getRoleName()
                    : p.getServiceStaff() != null ? p.getServiceStaff().getRole() : null);
            map.put("branch", branch != null ? branch.getBranchName() : "Head Office");
            result.add(map);
        }
        result.sort((a, b) -> {
            int byMonth = ((String) b.get("month")).compareTo((String) a.get("month"));
            return byMonth != 0 ? byMonth : String.valueOf(a.get("name")).compareTo(String.valueOf(b.get("name")));
        });
        return result;
    }

    public SalaryPayment paySalary(String type, Integer id, Double amount, String month) {
        if (amount == null || amount <= 0) {
            throw new RuntimeException("Set a base salary before paying");
        }
        boolean alreadyPaid = "USER".equals(type)
                ? salaryRepository.findByUser_Id(id).stream().anyMatch(p -> month.equals(p.getPaymentMonth()))
                : salaryRepository.findByServiceStaff_Id(id).stream().anyMatch(p -> month.equals(p.getPaymentMonth()));
        if (alreadyPaid) {
            throw new RuntimeException("Already paid for " + month);
        }
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
