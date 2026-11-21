package com.collabboard;

import com.collabboard.auth.*;
import com.collabboard.chat.*;
import com.collabboard.entity.Room;
import com.collabboard.repository.RoomRepository;
import com.collabboard.security.AuthPrincipal;
import com.collabboard.service.RoomService;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoomChatServiceTest {
    private final RoomChatMessageRepository messages = mock(RoomChatMessageRepository.class);
    private final RoomService rooms = mock(RoomService.class);
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final RoomRepository roomRepository = mock(RoomRepository.class);
    private final RoomChatService chat = new RoomChatService(messages, rooms, users, roomRepository);
    private final AuthPrincipal member = new AuthPrincipal("member-1", "Taylor", "taylor@example.com");

    @Test void refusesHistoryForUsersWithoutRoomAccess() {
        doThrow(new org.springframework.security.access.AccessDeniedException("No access")).when(rooms).requireAccess("private-room", member.id());
        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> chat.history("private-room", 50, member));
        verifyNoInteractions(messages);
    }

    @Test void persistsMessagesWithIdentityFromTheAuthenticatedPrincipal() {
        Room room = new Room("shared-room", "Shared", new AppUser("owner", "Owner", "owner@example.com", "hash"));
        AppUser sender = new AppUser(member.id(), member.displayName(), member.email(), "hash");
        when(roomRepository.findById("shared-room")).thenReturn(Optional.of(room));
        when(users.findById(member.id())).thenReturn(Optional.of(sender));
        when(messages.save(any(RoomChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var saved = chat.send("shared-room", "Hello room", member);

        assertEquals(member.id(), saved.senderId());
        assertEquals("Taylor", saved.senderName());
        assertEquals("Hello room", saved.content());
        verify(rooms).requireAccess("shared-room", member.id());
        verify(messages).save(any(RoomChatMessage.class));
    }

    @Test void rejectsBlankAndOversizedMessages() {
        assertThrows(IllegalArgumentException.class, () -> chat.send("shared-room", "  ", member));
        assertThrows(IllegalArgumentException.class, () -> chat.send("shared-room", "x".repeat(RoomChatService.MAX_LENGTH + 1), member));
        verifyNoInteractions(roomRepository, users, messages);
    }
}
