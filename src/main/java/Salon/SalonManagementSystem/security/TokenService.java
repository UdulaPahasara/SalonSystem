package Salon.SalonManagementSystem.security;

import Salon.SalonManagementSystem.model.Users;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/** Issues and checks signed login tokens (HMAC-SHA256, no external library). */
@Component
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);
    private static final String DEV_SECRET = "dev-only-secret-change-me-before-deploying";

    private final byte[] secret;
    private final long ttlMillis;

    public TokenService(@Value("${app.security.secret:" + DEV_SECRET + "}") String secret,
            @Value("${app.security.token-hours:12}") long hours) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlMillis = hours * 3_600_000L;
        if (DEV_SECRET.equals(secret)) {
            log.warn("APP_SECRET is not set: using the built-in development secret. Set APP_SECRET before deploying.");
        }
    }

    public String issue(Users user) {
        String role = user.getRole().getRoleName();
        if ("Chashire".equals(role)) role = AuthUser.CASHIER; // legacy spelling in old databases
        String branch = user.getBranch() == null ? "" : String.valueOf(user.getBranch().getId());
        String payload = user.getId() + "|" + role + "|" + branch + "|" + (System.currentTimeMillis() + ttlMillis);
        String body = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return body + "." + sign(body);
    }

    /** Returns the user inside a valid, unexpired token, or null. */
    public AuthUser verify(String token) {
        try {
            int dot = token.indexOf('.');
            if (dot < 1) return null;
            String body = token.substring(0, dot);
            if (!MessageDigest.isEqual(sign(body).getBytes(StandardCharsets.UTF_8), token.substring(dot + 1).getBytes(StandardCharsets.UTF_8))) {
                return null;
            }
            String[] p = new String(Base64.getUrlDecoder().decode(body), StandardCharsets.UTF_8).split("\\|", -1);
            if (Long.parseLong(p[3]) < System.currentTimeMillis()) return null;
            return new AuthUser(Integer.parseInt(p[0]), p[1], p[2].isEmpty() ? null : Integer.valueOf(p[2]));
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
