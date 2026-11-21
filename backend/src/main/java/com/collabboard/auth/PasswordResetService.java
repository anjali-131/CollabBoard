package com.collabboard.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class PasswordResetService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AppUserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final ObjectProvider<JavaMailSender> mailSenders;
    private final String from;
    private final String publicBaseUrl;

    public PasswordResetService(AppUserRepository users, PasswordResetTokenRepository tokens,
                                PasswordEncoder encoder, ObjectProvider<JavaMailSender> mailSenders,
                                @Value("${app.mail.from:}") String from,
                                @Value("${app.public-base-url:http://localhost:5173}") String publicBaseUrl) {
        this.users = users; this.tokens = tokens; this.encoder = encoder; this.mailSenders = mailSenders;
        this.from = from; this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional
    public void request(String email) {
        JavaMailSender sender = mailSenders.getIfAvailable();
        if (sender == null || from.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Email delivery is unavailable. Start the local mail service or configure SMTP, then try again.");
        }
        if (sender instanceof JavaMailSenderImpl smtp) {
            try {
                smtp.testConnection();
            } catch (MessagingException e) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Email delivery is unavailable. Start the local mail service or check your SMTP settings.");
            }
        }
        tokens.deleteByExpiresAtBefore(Instant.now());
        AppUser user = users.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (user == null) return;
        tokens.deleteByUserIdAndConsumedAtIsNull(user.getId());
        byte[] random = new byte[32]; RANDOM.nextBytes(random);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        tokens.save(new PasswordResetToken(UUID.randomUUID().toString(), user.getId(), hash(rawToken),
                Instant.now().plus(30, ChronoUnit.MINUTES)));
        String link = publicBaseUrl.replaceAll("/$", "") + "/reset-password?token=" + rawToken;
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setTo(user.getEmail()); helper.setFrom(from); helper.setSubject("Reset your CollabBoard password");
            helper.setText("<p>We received a request to reset your CollabBoard password.</p>" +
                    "<p><a href=\"" + link + "\">Choose a new password</a></p>" +
                    "<p>This link expires in 30 minutes and can only be used once. If you did not request this, ignore this email.</p>", true);
            sender.send(message);
        } catch (MessagingException | RuntimeException e) {
            // Do not log the address, reset token, or generated URL.
            org.slf4j.LoggerFactory.getLogger(PasswordResetService.class).warn("Password reset email could not be delivered: {}", e.getClass().getSimpleName());
        }
    }

    @Transactional
    public void reset(String rawToken, String password, String confirmation) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) throw new IllegalArgumentException("Password must be no more than 72 UTF-8 bytes.");
        if (!password.equals(confirmation)) throw new IllegalArgumentException("Passwords do not match.");
        PasswordResetToken token = tokens.findByTokenHash(hash(rawToken)).orElseThrow(this::invalidToken);
        Instant now = Instant.now();
        if (token.getConsumedAt() != null || !token.getExpiresAt().isAfter(now)) throw invalidToken();
        AppUser user = users.findById(token.getUserId()).orElseThrow(this::invalidToken);
        user.setPasswordHash(encoder.encode(password));
        token.consume(now);
        tokens.deleteByUserIdAndConsumedAtIsNull(user.getId());
    }

    private ResponseStatusException invalidToken() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "This password reset link is invalid or has expired. Request a new one.");
    }
    private static String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException("SHA-256 is unavailable", e); }
    }
}
