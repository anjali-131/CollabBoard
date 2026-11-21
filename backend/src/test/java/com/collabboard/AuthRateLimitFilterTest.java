package com.collabboard;

import com.collabboard.security.AuthRateLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthRateLimitFilterTest {
    @Test
    void limitsSignupAttemptsPerAddressAndEndpoint() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter();
        for (int attempt = 0; attempt < 5; attempt++) {
            MockHttpServletRequest request = request();
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(200, response.getStatus());
        }

        MockHttpServletResponse limited = new MockHttpServletResponse();
        filter.doFilter(request(), limited, new MockFilterChain());
        assertEquals(429, limited.getStatus());
        assertEquals("60", limited.getHeader("Retry-After"));
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/signup");
        request.setRemoteAddr("192.0.2.10");
        return request;
    }
}
