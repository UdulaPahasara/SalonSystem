package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.*;
import Salon.SalonManagementSystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Everything the manager's report shows, grouped and compared with the previous period of the same length.
 * Built for one branch (branchId) or for the whole salon (null).
 */
@Service
public class BusinessReportService {

    private static final int LAPSED_DAYS = 60;

    @Autowired private TransactionRepository txRepo;
    @Autowired private AppointmentRepository apptRepo;
    @Autowired private CustomerRepository customerRepo;
    @Autowired private BranchInventoryRepository inventoryRepo;
    @Autowired private StockRequestRepository stockRequestRepo;
    @Autowired private ServiceStaffRepository staffRepo;
    @Autowired private SalonServiceRepository serviceRepo;
    @Autowired private BranchRepository branchRepo;
    @Autowired private SalaryService salaryService;

    @Transactional(readOnly = true)
    public Map<String, Object> build(Integer branchId, LocalDateTime start, LocalDateTime end, boolean monthly, boolean includeCosts) {
        long days = ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate()) + 1;
        LocalDateTime prevEnd = start.toLocalDate().minusDays(1).atTime(23, 59, 59);
        LocalDateTime prevStart = prevEnd.toLocalDate().minusDays(days - 1).atStartOfDay();

        List<Transaction> txs = transactions(branchId, start, end);
        List<Transaction> prevTxs = transactions(branchId, prevStart, prevEnd);
        List<Appointment> appts = apptRepo.findAll().stream()
                .filter(a -> a.getAppointmentTime() != null && !a.getAppointmentTime().isBefore(start) && !a.getAppointmentTime().isAfter(end))
                .filter(a -> branchId == null || (a.getBranch() != null && branchId.equals(a.getBranch().getId())))
                .toList();
        List<Appointment> prevAppts = apptRepo.findAll().stream()
                .filter(a -> a.getAppointmentTime() != null && !a.getAppointmentTime().isBefore(prevStart) && !a.getAppointmentTime().isAfter(prevEnd))
                .filter(a -> branchId == null || (a.getBranch() != null && branchId.equals(a.getBranch().getId())))
                .toList();

        double revenue = sum(txs), prevRevenue = sum(prevTxs);
        double serviceRevenue = lines(txs).stream().filter(i -> i.getService() != null).mapToDouble(this::line).sum();
        double productRevenue = lines(txs).stream().filter(i -> i.getProduct() != null).mapToDouble(this::line).sum();

        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("revenue", revenue);
        summary.put("prevRevenue", prevRevenue);
        summary.put("transactions", txs.size());
        summary.put("prevTransactions", prevTxs.size());
        summary.put("avgBill", txs.isEmpty() ? 0 : revenue / txs.size());
        summary.put("serviceRevenue", serviceRevenue);
        summary.put("productRevenue", productRevenue);
        summary.put("appointments", appts.size());
        summary.put("prevAppointments", prevAppts.size());
        summary.put("completed", countStatus(appts, "COMPLETED"));
        summary.put("cancelled", countStatus(appts, "CANCELLED"));
        summary.put("booked", countStatus(appts, "BOOKED"));
        out.put("summary", summary);

        out.put("trend", trend(txs, monthly));
        out.put("payments", payments(txs, revenue));
        List<Map<String, Object>> services = services(txs, prevTxs, revenue);
        out.put("services", services);
        out.put("categories", categories(txs, revenue));
        List<Map<String, Object>> inventory = inventory(branchId, txs);
        out.put("products", products(txs, revenue, inventory));
        out.put("cashiers", cashiers(txs));
        List<Map<String, Object>> branches = branchId == null ? branches(txs, prevTxs, appts, revenue) : List.of();
        out.put("branches", branches);
        List<Map<String, Object>> staff = staff(branchId, appts);
        out.put("staff", staff);
        Map<String, Object> customers = customers(branchId, txs, start, end, revenue);
        out.put("customers", customers);
        Map<String, Object> appointments = appointments(appts, txs);
        out.put("appointments", appointments);
        Map<String, Object> stock = new LinkedHashMap<>();
        stock.put("items", inventory);
        stock.put("requests", stockRequests(branchId, start, end));
        out.put("inventory", stock);
        Map<String, Object> salary = includeCosts ? salary(branchId, start, end, revenue) : null;
        out.put("salary", salary);
        out.put("insights", insights(summary, services, branches, staff, customers, appointments, stock, salary));
        return out;
    }

    // ---------- data ----------

    private List<Transaction> transactions(Integer branchId, LocalDateTime from, LocalDateTime to) {
        return branchId != null ? txRepo.findByBranchAndDateRange(branchId, from, to) : txRepo.findByDateRange(from, to);
    }

    private List<TransactionItem> lines(List<Transaction> txs) {
        return txs.stream().flatMap(t -> t.getItems().stream()).toList();
    }

    private double line(TransactionItem i) {
        return i.getUnitPrice().doubleValue() * i.getQuantity();
    }

    private double sum(List<Transaction> txs) {
        return txs.stream().mapToDouble(t -> t.getTotalAmount().doubleValue()).sum();
    }

    private long countStatus(List<Appointment> list, String status) {
        return list.stream().filter(a -> status.equals(status(a))).count();
    }

    private String status(Appointment a) {
        return a.getStatus() == null ? "BOOKED" : a.getStatus();
    }

    private static double pct(double part, double whole) {
        return whole > 0 ? part / whole * 100 : 0;
    }

    /** % change from prev to now, or null when there was nothing to compare with. */
    private static Double change(double now, double prev) {
        return prev > 0 ? (now - prev) / prev * 100 : null;
    }

    private static Map<String, Object> row(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    // Values come back out of Map<String, Object>: the stored number may be an Integer or a Long.
    private static long L(Object o) { return ((Number) o).longValue(); }
    private static int I(Object o) { return ((Number) o).intValue(); }
    private static double D(Object o) { return ((Number) o).doubleValue(); }

    private static String money(double v) {
        return "Rs. " + String.format("%,.0f", v);
    }

    // ---------- sections ----------

    private List<Map<String, Object>> trend(List<Transaction> txs, boolean monthly) {
        DateTimeFormatter f = DateTimeFormatter.ofPattern(monthly ? "yyyy-MM" : "yyyy-MM-dd");
        return txs.stream().collect(Collectors.groupingBy(t -> t.getDateTime().format(f), TreeMap::new, Collectors.toList()))
                .entrySet().stream()
                .map(e -> row("key", e.getKey(), "revenue", sum(e.getValue()), "count", e.getValue().size()))
                .toList();
    }

    private List<Map<String, Object>> payments(List<Transaction> txs, double revenue) {
        return txs.stream().collect(Collectors.groupingBy(t -> t.getPaymentMethod() == null ? "" : t.getPaymentMethod().toUpperCase())).entrySet().stream()
                .map(e -> row("name", "CARD".equals(e.getKey()) ? "Card" : "Cash", "count", e.getValue().size(), "revenue", sum(e.getValue()), "share", pct(sum(e.getValue()), revenue)))
                .sorted((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue")))).toList();
    }

    private List<Map<String, Object>> services(List<Transaction> txs, List<Transaction> prevTxs, double revenue) {
        Map<String, Double> prev = new HashMap<>();
        lines(prevTxs).stream().filter(i -> i.getService() != null).forEach(i -> prev.merge(i.getService().getName(), line(i), Double::sum));
        Map<String, List<TransactionItem>> grouped = lines(txs).stream().filter(i -> i.getService() != null)
                .collect(Collectors.groupingBy(i -> i.getService().getName()));
        List<Map<String, Object>> out = new ArrayList<>();
        grouped.forEach((name, items) -> {
            double rev = items.stream().mapToDouble(this::line).sum();
            String category = items.get(0).getService().getCategory();
            out.add(row("name", name, "category", category == null ? "Other" : category,
                    "qty", items.stream().mapToInt(TransactionItem::getQuantity).sum(), "revenue", rev,
                    "share", pct(rev, revenue), "prevRevenue", prev.getOrDefault(name, 0.0), "change", change(rev, prev.getOrDefault(name, 0.0))));
        });
        out.sort((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue"))));
        return out;
    }

    private List<Map<String, Object>> categories(List<Transaction> txs, double revenue) {
        Map<String, double[]> m = new HashMap<>(); // [revenue, qty]
        for (TransactionItem i : lines(txs)) {
            String name = i.getService() != null ? (i.getService().getCategory() == null ? "Other services" : i.getService().getCategory()) : "Retail products";
            double[] v = m.computeIfAbsent(name, k -> new double[2]);
            v[0] += line(i);
            v[1] += i.getQuantity();
        }
        return m.entrySet().stream()
                .map(e -> row("name", e.getKey(), "qty", (int) e.getValue()[1], "revenue", e.getValue()[0], "share", pct(e.getValue()[0], revenue)))
                .sorted((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue")))).toList();
    }

    private List<Map<String, Object>> products(List<Transaction> txs, double revenue, List<Map<String, Object>> inventory) {
        Map<String, Integer> inStock = new HashMap<>();
        inventory.forEach(r -> inStock.merge((String) r.get("product"), (Integer) r.get("qty"), Integer::sum));
        Map<String, List<TransactionItem>> grouped = lines(txs).stream().filter(i -> i.getProduct() != null)
                .collect(Collectors.groupingBy(i -> i.getProduct().getProductName()));
        List<Map<String, Object>> out = new ArrayList<>();
        grouped.forEach((name, items) -> {
            double rev = items.stream().mapToDouble(this::line).sum();
            out.add(row("name", name, "brand", items.get(0).getProduct().getBrand(), "qty", items.stream().mapToInt(TransactionItem::getQuantity).sum(),
                    "revenue", rev, "share", pct(rev, revenue), "inStock", inStock.getOrDefault(name, 0)));
        });
        out.sort((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue"))));
        return out;
    }

    private List<Map<String, Object>> cashiers(List<Transaction> txs) {
        return txs.stream().filter(t -> t.getCashier() != null).collect(Collectors.groupingBy(t -> t.getCashier().getId())).values().stream()
                .map(list -> {
                    Users c = list.get(0).getCashier();
                    double rev = sum(list);
                    return row("name", c.getFullName(), "branch", c.getBranch() == null ? "" : c.getBranch().getBranchName(),
                            "transactions", list.size(), "revenue", rev, "avgBill", rev / list.size());
                })
                .sorted((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue")))).toList();
    }

    private List<Map<String, Object>> branches(List<Transaction> txs, List<Transaction> prevTxs, List<Appointment> appts, double revenue) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Branch b : branchRepo.findAll()) {
            List<Transaction> mine = txs.stream().filter(t -> t.getBranch() != null && t.getBranch().getId().equals(b.getId())).toList();
            double rev = sum(mine);
            double prev = sum(prevTxs.stream().filter(t -> t.getBranch() != null && t.getBranch().getId().equals(b.getId())).toList());
            List<Appointment> ba = appts.stream().filter(a -> a.getBranch() != null && a.getBranch().getId().equals(b.getId())).toList();
            long cancelled = countStatus(ba, "CANCELLED");
            out.add(row("name", b.getBranchName(), "revenue", rev, "prevRevenue", prev, "change", change(rev, prev), "share", pct(rev, revenue),
                    "transactions", mine.size(), "avgBill", mine.isEmpty() ? 0 : rev / mine.size(),
                    "appointments", ba.size(), "completed", countStatus(ba, "COMPLETED"), "cancelled", cancelled, "cancelRate", pct(cancelled, ba.size())));
        }
        out.sort((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue"))));
        return out;
    }

    private List<Map<String, Object>> staff(Integer branchId, List<Appointment> appts) {
        Map<String, Double> price = new HashMap<>();
        serviceRepo.findAll().forEach(s -> { if (s.getBranch() != null && s.getPrice() != null) price.put(s.getBranch().getId() + "|" + s.getName(), s.getPrice().doubleValue()); });
        List<Map<String, Object>> out = new ArrayList<>();
        for (ServiceStaff s : branchId == null ? staffRepo.findAll() : staffRepo.findByBranchId(branchId)) {
            List<Appointment> mine = appts.stream().filter(a -> a.getAssignedStaff() != null && a.getAssignedStaff().getId().equals(s.getId())).toList();
            long done = countStatus(mine, "COMPLETED"), cancelled = countStatus(mine, "CANCELLED");
            double value = mine.stream().filter(a -> "COMPLETED".equals(status(a)) && a.getBranch() != null)
                    .mapToDouble(a -> price.getOrDefault(a.getBranch().getId() + "|" + a.getServiceType(), 0.0)).sum();
            out.add(row("name", s.getFullName(), "role", s.getRole(), "branch", s.getBranch() == null ? "" : s.getBranch().getBranchName(),
                    "appointments", mine.size(), "completed", done, "cancelled", cancelled,
                    "completionRate", pct(done, mine.size()), "revenue", value));
        }
        List<Appointment> loose = appts.stream().filter(a -> a.getAssignedStaff() == null).toList();
        if (!loose.isEmpty()) {
            long done = countStatus(loose, "COMPLETED");
            out.add(row("name", "No stylist assigned", "role", "-", "branch", "-", "appointments", loose.size(), "completed", done,
                    "cancelled", countStatus(loose, "CANCELLED"), "completionRate", pct(done, loose.size()), "revenue", 0.0));
        }
        out.sort((a, b) -> Double.compare(D(b.get("revenue")), D(a.get("revenue"))));
        return out;
    }

    private Map<String, Object> customers(Integer branchId, List<Transaction> txs, LocalDateTime start, LocalDateTime end, double revenue) {
        List<Customer> scope = branchId == null ? customerRepo.findAll() : customerRepo.findByBranch_Id(branchId);
        Map<Integer, Customer> byId = scope.stream().collect(Collectors.toMap(Customer::getCustomerId, Function.identity()));
        Map<Integer, LocalDateTime[]> span = new HashMap<>(); // [first, last]
        Map<Integer, Long> visitCount = new HashMap<>();
        for (Object[] r : txRepo.customerVisitSpan(end)) {
            span.put((Integer) r[0], new LocalDateTime[]{(LocalDateTime) r[1], (LocalDateTime) r[2]});
            visitCount.put((Integer) r[0], (Long) r[3]);
        }

        Map<Integer, List<Transaction>> mine = txs.stream().filter(t -> t.getCustomer() != null).collect(Collectors.groupingBy(t -> t.getCustomer().getCustomerId()));
        long fresh = mine.keySet().stream().filter(id -> span.containsKey(id) && !span.get(id)[0].isBefore(start)).count();
        long repeaters = mine.keySet().stream().filter(id -> visitCount.getOrDefault(id, 0L) >= 2).count();
        long walkIns = txs.stream().filter(t -> t.getCustomer() == null).count();
        double memberRevenue = mine.values().stream().filter(l -> l.get(0).getCustomer().isLoyaltyMember()).mapToDouble(this::sum).sum();
        double knownRevenue = mine.values().stream().mapToDouble(this::sum).sum();

        List<Map<String, Object>> top = mine.values().stream()
                .sorted((a, b) -> Double.compare(sum(b), sum(a))).limit(10)
                .map(l -> {
                    Customer c = l.get(0).getCustomer();
                    return row("name", c.getFullName(), "visits", l.size(), "spent", sum(l), "member", c.isLoyaltyMember(),
                            "lastVisit", l.stream().map(Transaction::getDateTime).max(Comparator.naturalOrder()).get().toLocalDate().toString());
                }).toList();

        LocalDateTime cutoff = end.minusDays(LAPSED_DAYS);
        List<Map<String, Object>> lapsed = new ArrayList<>();
        for (Customer c : scope) {
            LocalDateTime[] s = span.get(c.getCustomerId());
            if (s != null && s[1].isBefore(cutoff)) lapsed.add(row("name", c.getFullName(), "phone", c.getPhone(), "lastVisit", s[1].toLocalDate().toString(), "member", c.isLoyaltyMember()));
        }
        lapsed.sort(Comparator.comparing(m -> (String) m.get("lastVisit")));

        return row("registered", scope.size(), "members", scope.stream().filter(Customer::isLoyaltyMember).count(),
                "pointsOutstanding", scope.stream().mapToInt(Customer::getLoyaltyPoints).sum(),
                "served", (long) mine.size(), "newCustomers", fresh, "returning", mine.size() - fresh, "repeatCustomers", repeaters, "walkInVisits", walkIns,
                "memberRevenue", memberRevenue, "otherCustomerRevenue", knownRevenue - memberRevenue, "walkInRevenue", revenue - knownRevenue,
                "top", top, "lapsedDays", LAPSED_DAYS, "lapsedCount", lapsed.size(), "lapsed", lapsed.stream().limit(15).toList());
    }

    private Map<String, Object> appointments(List<Appointment> appts, List<Transaction> txs) {
        String[] names = new String[7];
        for (DayOfWeek d : DayOfWeek.values()) names[d.getValue() - 1] = d.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        List<Map<String, Object>> weekdays = new ArrayList<>();
        for (int d = 1; d <= 7; d++) {
            final int day = d;
            List<Transaction> t = txs.stream().filter(x -> x.getDateTime().getDayOfWeek().getValue() == day).toList();
            weekdays.add(row("name", names[d - 1], "appointments", appts.stream().filter(a -> a.getAppointmentTime().getDayOfWeek().getValue() == day).count(),
                    "transactions", t.size(), "revenue", sum(t)));
        }
        Map<Integer, long[]> hours = new TreeMap<>();
        appts.forEach(a -> hours.computeIfAbsent(a.getAppointmentTime().getHour(), h -> new long[2])[0]++);
        txs.forEach(t -> hours.computeIfAbsent(t.getDateTime().getHour(), h -> new long[2])[1]++);
        List<Map<String, Object>> byHour = hours.entrySet().stream()
                .map(e -> row("name", String.format("%02d:00", e.getKey()), "appointments", e.getValue()[0], "transactions", e.getValue()[1])).toList();
        List<Map<String, Object>> byService = appts.stream().collect(Collectors.groupingBy(a -> a.getServiceType() == null ? "Unknown" : a.getServiceType())).entrySet().stream()
                .map(e -> row("name", e.getKey(), "booked", e.getValue().size(), "completed", countStatus(e.getValue(), "COMPLETED"), "cancelled", countStatus(e.getValue(), "CANCELLED")))
                .sorted((a, b) -> Integer.compare(I(b.get("booked")), I(a.get("booked")))).toList();
        long total = appts.size(), cancelled = countStatus(appts, "CANCELLED");
        return row("total", total, "completed", countStatus(appts, "COMPLETED"), "cancelled", cancelled, "booked", countStatus(appts, "BOOKED"),
                "cancelRate", pct(cancelled, total), "loyaltyBookings", appts.stream().filter(Appointment::isApplyLoyalty).count(),
                "weekdays", weekdays, "hours", byHour, "services", byService);
    }

    private List<Map<String, Object>> inventory(Integer branchId, List<Transaction> txs) {
        Map<String, Integer> sold = new HashMap<>();
        for (Transaction t : txs) for (TransactionItem i : t.getItems())
            if (i.getProduct() != null && t.getBranch() != null) sold.merge(t.getBranch().getId() + "|" + i.getProduct().getProductId(), i.getQuantity(), Integer::sum);
        List<BranchInventory> all = branchId == null ? inventoryRepo.findAll() : inventoryRepo.findInventoryByBranchId(branchId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (BranchInventory b : all) {
            int qty = b.getQuantity() == null ? 0 : b.getQuantity();
            int limit = b.getLowStockLimit() == null ? 10 : b.getLowStockLimit();
            double unit = b.getProduct().getUnitPrice() == null ? 0 : b.getProduct().getUnitPrice().doubleValue();
            out.add(row("branch", b.getBranch().getBranchName(), "product", b.getProduct().getProductName(), "brand", b.getProduct().getBrand(),
                    "qty", qty, "limit", limit, "status", qty == 0 ? "OUT" : qty <= limit ? "LOW" : "OK", "value", qty * unit,
                    "sold", sold.getOrDefault(b.getBranch().getId() + "|" + b.getProduct().getProductId(), 0)));
        }
        List<String> order = List.of("OUT", "LOW", "OK");
        out.sort(Comparator.comparingInt((Map<String, Object> m) -> order.indexOf(m.get("status"))).thenComparing(m -> (String) m.get("product")));
        return out;
    }

    private Map<String, Object> stockRequests(Integer branchId, LocalDateTime start, LocalDateTime end) {
        List<StockRequest> list = (branchId == null ? stockRequestRepo.findAll() : stockRequestRepo.findByBranch_Id(branchId));
        long pendingNow = list.stream().filter(r -> "PENDING".equals(r.getStatus())).count();
        List<StockRequest> inPeriod = list.stream().filter(r -> r.getCreatedAt() != null && !r.getCreatedAt().isBefore(start) && !r.getCreatedAt().isAfter(end)).toList();
        return row("pendingNow", pendingNow, "requested", inPeriod.size(),
                "approved", inPeriod.stream().filter(r -> "APPROVED".equals(r.getStatus())).count(),
                "rejected", inPeriod.stream().filter(r -> "REJECTED".equals(r.getStatus())).count());
    }

    private Map<String, Object> salary(Integer branchId, LocalDateTime start, LocalDateTime end, double revenue) {
        DateTimeFormatter ym = DateTimeFormatter.ofPattern("yyyy-MM");
        List<Map<String, Object>> pays = salaryService.getPaymentHistory(start.format(ym), end.format(ym), branchId);
        double total = pays.stream().mapToDouble(p -> ((Number) p.get("amount")).doubleValue()).sum();
        Function<String, List<Map<String, Object>>> groupBy = key -> pays.stream()
                .collect(Collectors.groupingBy(p -> String.valueOf(p.get(key)), TreeMap::new, Collectors.toList())).entrySet().stream()
                .map(e -> row("name", e.getKey(), "payments", e.getValue().size(), "amount", e.getValue().stream().mapToDouble(p -> ((Number) p.get("amount")).doubleValue()).sum()))
                .toList();
        return row("total", total, "payments", pays.size(), "net", revenue - total, "ratio", pct(total, revenue),
                "byMonth", groupBy.apply("month"), "byBranch", groupBy.apply("branch"), "byRole", groupBy.apply("role"),
                "list", pays.stream().limit(200).map(p -> row("month", p.get("month"), "name", p.get("name"), "role", p.get("role"), "branch", p.get("branch"), "amount", p.get("amount"))).toList());
    }

    // ---------- plain-language findings ----------

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> insights(Map<String, Object> summary, List<Map<String, Object>> services, List<Map<String, Object>> branches,
                                               List<Map<String, Object>> staff, Map<String, Object> customers, Map<String, Object> appts,
                                               Map<String, Object> stock, Map<String, Object> salary) {
        List<Map<String, Object>> out = new ArrayList<>();
        double revenue = D(summary.get("revenue")), prev = D(summary.get("prevRevenue"));
        Double ch = change(revenue, prev);
        if (revenue == 0) {
            out.add(row("level", "info", "area", "Sales", "text", "No sales were recorded in this period."));
        } else if (ch == null) {
            out.add(row("level", "info", "area", "Sales", "text", "Revenue was " + money(revenue) + ". There were no sales in the previous period to compare with."));
        } else if (ch >= 5) {
            out.add(row("level", "good", "area", "Sales", "text", String.format("Revenue is up %.1f%% on the previous period (%s, from %s).", ch, money(revenue), money(prev))));
        } else if (ch <= -5) {
            out.add(row("level", "warn", "area", "Sales", "text", String.format("Revenue is down %.1f%% on the previous period (%s, from %s). The service and branch tables show where the drop came from.", -ch, money(revenue), money(prev))));
        } else {
            out.add(row("level", "info", "area", "Sales", "text", String.format("Revenue is steady at %s (%+.1f%% on the previous period).", money(revenue), ch)));
        }
        if (!services.isEmpty()) {
            Map<String, Object> top = services.get(0);
            double share = D(top.get("share"));
            if (share >= 35 && services.size() > 1) {
                out.add(row("level", "info", "area", "Services", "text", String.format("%s brings in %.0f%% of all sales. Depending on one service is risky, so consider promoting the others.", top.get("name"), share)));
            }
            services.stream().filter(s -> s.get("change") != null && D(s.get("change")) <= -30 && D(s.get("prevRevenue")) >= 5000)
                    .sorted(Comparator.comparingDouble(s -> D(s.get("change")))).limit(2)
                    .forEach(s -> out.add(row("level", "warn", "area", "Services", "text", String.format("%s fell %.0f%% (%s, from %s). Check its price, availability and promotion.", s.get("name"), -D(s.get("change")), money(D(s.get("revenue"))), money(D(s.get("prevRevenue")))))));
            services.stream().filter(s -> s.get("change") != null && D(s.get("change")) >= 30 && D(s.get("prevRevenue")) >= 5000)
                    .sorted((a, b) -> Double.compare(D(b.get("change")), D(a.get("change")))).limit(1)
                    .forEach(s -> out.add(row("level", "good", "area", "Services", "text", String.format("%s grew %.0f%% (%s). Make sure there are enough stylists for it.", s.get("name"), D(s.get("change")), money(D(s.get("revenue")))))));
        }
        if (branches.size() > 1) {
            Map<String, Object> best = branches.get(0), worst = branches.get(branches.size() - 1);
            if (D(worst.get("revenue")) < D(best.get("revenue")) * 0.7) {
                out.add(row("level", "info", "area", "Branches", "text", String.format("%s earned %s, %.0f%% less than %s (%s). Compare their services, staff and opening hours.", worst.get("name"), money(D(worst.get("revenue"))), 100 - D(worst.get("revenue")) / D(best.get("revenue")) * 100, best.get("name"), money(D(best.get("revenue"))))));
            }
            branches.stream().filter(b -> b.get("change") != null && D(b.get("change")) <= -10).forEach(b ->
                    out.add(row("level", "warn", "area", "Branches", "text", String.format("%s is down %.0f%% on the previous period.", b.get("name"), -D(b.get("change"))))));
        }
        long total = L(appts.get("total"));
        if (total >= 5 && D(appts.get("cancelRate")) >= 15) {
            out.add(row("level", "warn", "area", "Appointments", "text", String.format("%.0f%% of appointments were cancelled (%d of %d). A reminder call or message the day before usually reduces this.", D(appts.get("cancelRate")), L(appts.get("cancelled")), total)));
        }
        List<Map<String, Object>> days = (List<Map<String, Object>>) appts.get("weekdays");
        if (I(summary.get("transactions")) >= 14) {
            Map<String, Object> busy = days.stream().max(Comparator.comparingDouble(d -> D(d.get("revenue")))).get();
            Map<String, Object> quiet = days.stream().filter(d -> D(d.get("revenue")) > 0 || true).min(Comparator.comparingDouble(d -> D(d.get("revenue")))).get();
            if (busy != quiet) out.add(row("level", "info", "area", "Appointments", "text", String.format("%s is the busiest day (%s) and %s the quietest (%s). Roster more staff on the busy day and use the quiet day for offers.", busy.get("name"), money(D(busy.get("revenue"))), quiet.get("name"), money(D(quiet.get("revenue"))))));
        }
        List<Map<String, Object>> idle = staff.stream().filter(s -> I(s.get("appointments")) == 0 && !"-".equals(s.get("role"))).toList();
        if (!idle.isEmpty() && total >= 5 && idle.size() < staff.size()) {
            out.add(row("level", "warn", "area", "Staff", "text", idle.size() + " staff member" + (idle.size() == 1 ? " had" : "s had") + " no appointments: " + names(idle) + ". Review their workload or assignments."));
        }
        if (!staff.isEmpty() && D(staff.get(0).get("revenue")) > 0) {
            out.add(row("level", "good", "area", "Staff", "text", String.format("%s completed the most value in bookings (%s from %d completed appointments).", staff.get(0).get("name"), money(D(staff.get(0).get("revenue"))), L(staff.get(0).get("completed")))));
        }
        long served = L(customers.get("served"));
        if (served >= 5 && L(customers.get("repeatCustomers")) * 100.0 / served < 40) {
            out.add(row("level", "warn", "area", "Customers", "text", String.format("Only %d of %d customers have visited more than once. Encourage repeat visits with loyalty points and follow-up offers.", L(customers.get("repeatCustomers")), served)));
        }
        if (L(customers.get("lapsedCount")) > 0) {
            out.add(row("level", "info", "area", "Customers", "text", customers.get("lapsedCount") + " customers have not visited in over " + customers.get("lapsedDays") + " days. The list in the Customers section is ready for a win-back offer."));
        }
        List<Map<String, Object>> items = (List<Map<String, Object>>) stock.get("items");
        List<Map<String, Object>> out0 = items.stream().filter(i -> "OUT".equals(i.get("status"))).toList();
        List<Map<String, Object>> low = items.stream().filter(i -> "LOW".equals(i.get("status"))).toList();
        if (!out0.isEmpty()) out.add(row("level", "warn", "area", "Stock", "text", out0.size() + " product line" + (out0.size() == 1 ? " is" : "s are") + " out of stock: " + stockNames(out0) + ". Raise stock requests so sales are not lost."));
        if (!low.isEmpty()) out.add(row("level", "warn", "area", "Stock", "text", low.size() + " product line" + (low.size() == 1 ? " is" : "s are") + " running low: " + stockNames(low) + "."));
        Map<String, Object> req = (Map<String, Object>) stock.get("requests");
        if (L(req.get("pendingNow")) > 0) out.add(row("level", "info", "area", "Stock", "text", req.get("pendingNow") + " stock request(s) are still waiting for approval."));
        List<Map<String, Object>> slow = items.stream().filter(i -> I(i.get("qty")) > 0 && I(i.get("sold")) == 0).toList();
        if (!slow.isEmpty() && I(summary.get("transactions")) >= 5) {
            double tied = slow.stream().mapToDouble(i -> D(i.get("value"))).sum();
            out.add(row("level", "info", "area", "Stock", "text", slow.size() + " stocked product line(s) did not sell at all in this period, tying up " + money(tied) + " of stock. Consider bundling them with services or running a promotion."));
        }
        if (salary != null && D(salary.get("total")) > 0) {
            double ratio = D(salary.get("ratio"));
            out.add(row("level", ratio > 60 ? "warn" : "info", "area", "Costs", "text", String.format("Salaries paid in this period were %s, which is %.0f%% of revenue, leaving %s.%s",
                    money(D(salary.get("total"))), ratio, money(D(salary.get("net"))), ratio > 60 ? " Salaries are taking most of the income, so review staffing against demand." : "")));
        }
        out.sort(Comparator.comparingInt(m -> "warn".equals(m.get("level")) ? 0 : "good".equals(m.get("level")) ? 1 : 2));
        return out.size() > 12 ? out.subList(0, 12) : out;
    }

    private String names(List<Map<String, Object>> rows) {
        return rows.stream().limit(4).map(r -> (String) r.get("name")).collect(Collectors.joining(", ")) + (rows.size() > 4 ? " and others" : "");
    }

    private String stockNames(List<Map<String, Object>> rows) {
        return rows.stream().limit(3).map(r -> r.get("product") + " (" + r.get("branch") + ")").collect(Collectors.joining(", ")) + (rows.size() > 3 ? " and " + (rows.size() - 3) + " more" : "");
    }
}
