package Salon.SalonManagementSystem.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.server.ResponseStatusException;

/** Who is making the current request (set by AuthInterceptor). */
public final class AuthContext {

    public static final String ATTRIBUTE = "authUser";

    private AuthContext() {
    }

    /** The signed-in user, or null outside a web request (seeders) or on public endpoints. */
    public static AuthUser current() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        return attrs == null ? null : (AuthUser) attrs.getAttribute(ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
    }

    /** Branch-scoped staff may only act on their own branch. */
    public static void requireBranch(Integer branchId) {
        AuthUser u = current();
        if (u == null || !u.isBranchScoped()) return;
        if (branchId == null || !branchId.equals(u.branchId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only work with your own branch.");
        }
    }
}
