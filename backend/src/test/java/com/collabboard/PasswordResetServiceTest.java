package com.collabboard;

import com.collabboard.auth.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.Instant;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {
    @SuppressWarnings("unchecked")
    private PasswordResetService service(AppUserRepository users, PasswordResetTokenRepository tokens) {
        ObjectProvider<org.springframework.mail.javamail.JavaMailSender> mail = mock(ObjectProvider.class);
        return new PasswordResetService(users, tokens, new BCryptPasswordEncoder(4), mail, "", "http://localhost:5173");
    }

    @Test void resetChangesHashedPasswordAndConsumesTheToken() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
        AppUser user = new AppUser("u1", "Taylor", "taylor@example.com", encoder.encode("old-password"));
        PasswordResetToken token = new PasswordResetToken("t1", "u1", "hash", Instant.now().plusSeconds(120));
        AppUserRepository users = mock(AppUserRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        when(tokens.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(users.findById("u1")).thenReturn(Optional.of(user));

        service(users, tokens).reset("secure-token", "new-password-123", "new-password-123");

        assertTrue(encoder.matches("new-password-123", user.getPasswordHash()));
        assertEquals(1, user.getTokenVersion());
        assertNotNull(token.getConsumedAt());
        verify(tokens).deleteByUserIdAndConsumedAtIsNull("u1");
    }

    @Test void resetRejectsMismatchedConfirmationBeforeChangingPassword() {
        AppUserRepository users = mock(AppUserRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        assertThrows(IllegalArgumentException.class, () -> service(users, tokens).reset("token", "new-password-123", "different-password"));
        verifyNoInteractions(tokens, users);
    }

    @Test void resetRejectsUnknownAndExpiredTokens() {
        AppUserRepository users = mock(AppUserRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        PasswordResetService service = service(users, tokens);
        when(tokens.findByTokenHash(anyString())).thenReturn(Optional.empty());
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.reset("unknown-token", "new-password-123", "new-password-123"));
        when(tokens.findByTokenHash(anyString())).thenReturn(Optional.of(
                new PasswordResetToken("expired", "u1", "hash", Instant.now().minusSeconds(1))));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.reset("expired-token", "new-password-123", "new-password-123"));
        verifyNoInteractions(users);
    }

    @Test void recoveryRequestReportsUnavailableMailTransportBeforeLookingUpAccounts() {
        AppUserRepository users = mock(AppUserRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        var error = assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service(users, tokens).request("person@example.com"));
        assertEquals(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        verifyNoInteractions(users);
    }
}
