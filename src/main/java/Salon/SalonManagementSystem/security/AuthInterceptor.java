package Salon.SalonManagementSystem.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/** Every /api call must carry a valid token (except the public ones) and the role must be allowed. */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenService tokens;

    public AuthInterceptor(TokenService tokens) {
        this.tokens = tokens;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws IOException {
        if ("OPTIONS".equals(req.getMethod())) return true;

        String path = req.getRequestURI().substring(req.getContextPath().length()).replaceFirst("^/api", "");
        if (path.length() > 1 && path.endsWith("/")) path = path.substring(0, path.length() - 1);
        String method = req.getMethod();

        // A valid token is read even on public endpoints so the user is known if they sent one.
        AuthUser user = null;
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            user = tokens.verify(header.substring(7));
            if (user != null) req.setAttribute(AuthContext.ATTRIBUTE, user);
        }

        if (AccessRules.isPublic(method, path)) return true;
        if (user == null) return deny(res, 401, "Please sign in again.");
        if (!AccessRules.allowed(method, path, user.role())) return deny(res, 403, "Your role doesn't have access to this.");

        if (user.isBranchScoped()) {
            String param = req.getParameter("branchId");
            Integer inPath = AccessRules.branchInPath(path);
            boolean wrongParam = param != null && !param.equals(String.valueOf(user.branchId()));
            boolean wrongPath = inPath != null && !inPath.equals(user.branchId());
            boolean missing = param == null && AccessRules.needsBranchParam(method, path);
            if (user.branchId() == null || wrongParam || wrongPath || missing) {
                return deny(res, 403, "You can only work with your own branch.");
            }
        }
        return true;
    }

    private boolean deny(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("text/plain;charset=UTF-8");
        res.getWriter().write(message);
        return false;
    }
}
