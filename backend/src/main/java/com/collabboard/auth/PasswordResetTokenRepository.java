package com.collabboard.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.time.Instant;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    void deleteByUserIdAndConsumedAtIsNull(String userId);
    void deleteByExpiresAtBefore(Instant cutoff);
}
