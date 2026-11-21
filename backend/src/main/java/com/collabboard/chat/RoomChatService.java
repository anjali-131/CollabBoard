package com.collabboard.chat;

import com.collabboard.auth.AppUser;
import com.collabboard.auth.AppUserRepository;
import com.collabboard.dto.ChatMessageResponse;
import com.collabboard.security.AuthPrincipal;
import com.collabboard.service.RoomService;
import com.collabboard.repository.RoomRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class RoomChatService {
    public static final int MAX_LENGTH = 2000;
    public static final int MAX_HISTORY = 100;

    private final RoomChatMessageRepository messages;
    private final RoomService rooms;
    private final AppUserRepository users;
    private final RoomRepository roomRepository;

    public RoomChatService(RoomChatMessageRepository messages, RoomService rooms, AppUserRepository users, RoomRepository roomRepository) {
        this.messages = messages;
        this.rooms = rooms;
        this.users = users;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> history(String roomId, int requestedLimit, AuthPrincipal principal) {
        rooms.requireAccess(roomId, principal.id());
        int limit = Math.max(1, Math.min(requestedLimit, MAX_HISTORY));
        List<RoomChatMessage> recent = new ArrayList<>(messages.findByRoom_RoomIdOrderByCreatedAtDescIdDesc(roomId, PageRequest.of(0, limit)));
        Collections.reverse(recent);
        return recent.stream().map(this::response).toList();
    }

    @Transactional
    public ChatMessageResponse send(String roomId, String content, AuthPrincipal principal) {
        rooms.requireAccess(roomId, principal.id());
        if (content == null || content.isBlank()) throw new IllegalArgumentException("Message cannot be empty");
        if (content.length() > MAX_LENGTH) throw new IllegalArgumentException("Message cannot exceed 2,000 characters");
        // Authorization is checked before loading the entities used for persistence.
        var room = roomRepository.findById(roomId).orElseThrow(() -> new NoSuchElementException("Board not found"));
        AppUser sender = users.findById(principal.id()).orElseThrow(() -> new NoSuchElementException("Account not found"));
        return response(messages.save(new RoomChatMessage(room, sender, content)));
    }

    private ChatMessageResponse response(RoomChatMessage message) {
        return new ChatMessageResponse(message.getId(), message.getRoom().getRoomId(), message.getSender().getId(), message.getSender().getName(), message.getContent(), message.getCreatedAt());
    }
}
