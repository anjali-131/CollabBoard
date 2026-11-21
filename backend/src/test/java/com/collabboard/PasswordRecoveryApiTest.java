package com.collabboard;

import com.collabboard.auth.*;
import com.collabboard.config.*;
import com.collabboard.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = AuthController.class, properties = "app.jwt.secret=test-only-secret-key-longer-than-32-bytes")
@Import({SecurityConfig.class, JwtCookieFilter.class, JwtService.class, CorsConfig.class, ApiErrorHandler.class})
class PasswordRecoveryApiTest {
    @Autowired MockMvc mvc;
    @MockBean AuthService auth;
    @MockBean AppUserRepository users;
    @MockBean PasswordResetService passwordReset;

    @Test void forgotPasswordAcceptsUnauthenticatedRequest() throws Exception {
        mvc.perform(post("/api/auth/password/forgot").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"person@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists for this address and email delivery succeeds, you should receive a reset link shortly."));
        verify(passwordReset).request("person@example.com");
    }

    @Test void resetPasswordAcceptsUnauthenticatedRequest() throws Exception {
        mvc.perform(post("/api/auth/password/reset").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"opaque-token\",\"password\":\"new-password-123\",\"confirmPassword\":\"new-password-123\"}"))
                .andExpect(status().isOk());
        verify(passwordReset).reset("opaque-token", "new-password-123", "new-password-123");
    }

    @Test void invalidResetTokenReturnsSafeBadRequest() throws Exception {
        doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                "This password reset link is invalid or has expired. Request a new one."))
                .when(passwordReset).reset("bad", "new-password-123", "new-password-123");
        mvc.perform(post("/api/auth/password/reset").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"bad\",\"password\":\"new-password-123\",\"confirmPassword\":\"new-password-123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("This password reset link is invalid or has expired. Request a new one."));
    }

    @Test void protectedRoomsStillRequireAuthentication() throws Exception {
        mvc.perform(get("/api/rooms")).andExpect(status().isUnauthorized());
    }
}
