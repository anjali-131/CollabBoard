package com.collabboard.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id @Column(length = 36) private String id;
    @Column(name = "user_id", nullable = false, length = 36) private String userId;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "consumed_at") private Instant consumedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected PasswordResetToken() {}
    public PasswordResetToken(String id, String userId, String tokenHash, Instant expiresAt) {
        this.id = id; this.userId = userId; this.tokenHash = tokenHash; this.expiresAt = expiresAt;
    }
    public String getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getConsumedAt() { return consumedAt; }
    public void consume(Instant at) { consumedAt = at; }
}
