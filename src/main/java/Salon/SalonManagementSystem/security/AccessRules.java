package Salon.SalonManagementSystem.security;

import org.springframework.util.AntPathMatcher;

import java.util.List;
import java.util.Set;

import static Salon.SalonManagementSystem.security.AuthUser.*;

/** Which roles may call which endpoints. First matching rule wins; anything unlisted is refused. */
public final class AccessRules {

    private record Rule(Set<String> methods, String pattern, Set<String> roles) {
    }

    private static final Set<String> READ = Set.of("GET");
    private static final Set<String> WRITE = Set.of("POST", "PUT", "DELETE", "PATCH");
    private static final Set<String> ANY = Set.of("GET", "POST", "PUT", "DELETE", "PATCH");

    /** Endpoints anyone may call: the public website and signing in. */
    private static final List<Rule> PUBLIC = List.of(
            new Rule(Set.of("POST"), "/users/login", null),
            new Rule(READ, "/branches", null),
            new Rule(READ, "/services", null),
            new Rule(READ, "/services/branch/*", null),
            new Rule(Set.of("POST"), "/contact-messages", null));

    private static final List<Rule> RULES = List.of(
            new Rule(READ, "/admin/branch/*/users", Set.of(OWNER, MANAGER)),
            new Rule(ANY, "/admin/**", Set.of(OWNER)),
            new Rule(READ, "/appointments", Set.of(OWNER, MANAGER, RECEPTION, CASHIER)),
            new Rule(WRITE, "/appointments/**", Set.of(OWNER, MANAGER, RECEPTION, CASHIER)),
            new Rule(WRITE, "/appointments", Set.of(OWNER, MANAGER, RECEPTION, CASHIER)),
            new Rule(WRITE, "/branches/**", Set.of(OWNER)),
            new Rule(WRITE, "/branches", Set.of(OWNER)),
            new Rule(ANY, "/contact-messages/**", Set.of(OWNER, RECEPTION)),
            new Rule(ANY, "/contact-messages", Set.of(OWNER, RECEPTION)),
            new Rule(READ, "/customers/**", Set.of(OWNER, MANAGER, RECEPTION, CASHIER)),
            new Rule(READ, "/customers", Set.of(OWNER, MANAGER, RECEPTION, CASHIER)),
            new Rule(WRITE, "/customers/**", Set.of(OWNER, MANAGER, RECEPTION)),
            new Rule(WRITE, "/customers", Set.of(OWNER, MANAGER, RECEPTION)),
            new Rule(READ, "/inventory/**", Set.of(OWNER, MANAGER, PRODUCT_MANAGER, CASHIER)),
            new Rule(READ, "/products/**", Set.of(OWNER, MANAGER, PRODUCT_MANAGER)),
            new Rule(READ, "/products", Set.of(OWNER, MANAGER, PRODUCT_MANAGER)),
            new Rule(WRITE, "/products/**", Set.of(OWNER, PRODUCT_MANAGER)),
            new Rule(WRITE, "/products", Set.of(OWNER, PRODUCT_MANAGER)),
            new Rule(READ, "/reports/**", Set.of(OWNER, MANAGER)),
            new Rule(ANY, "/salary/**", Set.of(OWNER)),
            new Rule(WRITE, "/services/**", Set.of(OWNER, MANAGER)),
            new Rule(WRITE, "/services", Set.of(OWNER, MANAGER)),
            new Rule(READ, "/staff", Set.of(OWNER, MANAGER, RECEPTION, CASHIER)),
            new Rule(WRITE, "/staff/**", Set.of(OWNER, MANAGER)),
            new Rule(WRITE, "/staff", Set.of(OWNER, MANAGER)),
            new Rule(READ, "/stock-requests", Set.of(OWNER, PRODUCT_MANAGER)),
            new Rule(READ, "/stock-requests/branch/*", Set.of(OWNER, MANAGER)),
            new Rule(Set.of("POST"), "/stock-requests", Set.of(OWNER, PRODUCT_MANAGER)),
            new Rule(Set.of("PUT"), "/stock-requests/*/approve", Set.of(OWNER, MANAGER)),
            new Rule(Set.of("PUT"), "/stock-requests/*/reject", Set.of(OWNER, MANAGER)),
            new Rule(READ, "/transactions", Set.of(OWNER)),
            new Rule(READ, "/transactions/branch/*", Set.of(OWNER, MANAGER, CASHIER)),
            new Rule(Set.of("POST"), "/transactions/checkout", Set.of(CASHIER)));

    /** Endpoints that list many branches' data: staff tied to one branch must name their own. */
    private static final List<String> NEEDS_BRANCH_PARAM = List.of("/appointments", "/customers", "/staff", "/reports/**");

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    private AccessRules() {
    }

    public static boolean isPublic(String method, String path) {
        return PUBLIC.stream().anyMatch(r -> r.methods().contains(method) && MATCHER.match(r.pattern(), path));
    }

    /** True if the role may call this endpoint. */
    public static boolean allowed(String method, String path, String role) {
        for (Rule r : RULES) {
            if (r.methods().contains(method) && MATCHER.match(r.pattern(), path)) {
                return r.roles().contains(role);
            }
        }
        return false;
    }

    public static boolean needsBranchParam(String method, String path) {
        return "GET".equals(method) && NEEDS_BRANCH_PARAM.stream().anyMatch(p -> MATCHER.match(p, path));
    }

    /** The branch id named in the path (e.g. /inventory/branch/3), or null. */
    public static Integer branchInPath(String path) {
        String[] parts = path.split("/");
        for (int i = 0; i < parts.length - 1; i++) {
            if ("branch".equals(parts[i])) {
                try {
                    return Integer.valueOf(parts[i + 1]);
                } catch (NumberFormatException e) {
                    return -1;
                }
            }
        }
        return null;
    }
}
