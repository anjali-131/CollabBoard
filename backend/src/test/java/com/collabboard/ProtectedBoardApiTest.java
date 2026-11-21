package com.collabboard;
import com.collabboard.auth.*;
import com.collabboard.dto.BoardSummary;import com.collabboard.security.*;import com.collabboard.service.RoomService;import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;import org.springframework.boot.test.mock.mockito.MockBean;import org.springframework.context.annotation.Import;import org.springframework.http.MediaType;import org.springframework.test.web.servlet.MockMvc;import java.util.List;import static org.mockito.Mockito.*;import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@WebMvcTest(value=com.collabboard.controller.RoomController.class,properties="app.jwt.secret=test-only-secret-key-longer-than-32-bytes")
@Import({com.collabboard.config.SecurityConfig.class,JwtCookieFilter.class,JwtService.class,com.collabboard.config.CorsConfig.class,com.collabboard.config.ApiErrorHandler.class})
class ProtectedBoardApiTest {
 @Autowired MockMvc mvc;@Autowired JwtService jwt;@MockBean RoomService rooms;@MockBean AppUserRepository users;
 @Test void boardsApiRequiresAuthentication()throws Exception{mvc.perform(get("/api/rooms")).andExpect(status().isUnauthorized());}
 @Test void authenticatedUserCanReadTheirBoardList()throws Exception{when(rooms.list(any())).thenReturn(List.<BoardSummary>of());when(users.findById("user-1")).thenReturn(java.util.Optional.of(new AppUser("user-1","Alex","alex@example.com","unused-hash")));String token=jwt.issue(new AuthPrincipal("user-1","Alex","alex@example.com"));mvc.perform(get("/api/rooms").cookie(new jakarta.servlet.http.Cookie("COLLABBOARD_SESSION",token))).andExpect(status().isOk()).andExpect(content().json("[]"));}
}
