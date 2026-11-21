package com.collabboard.websocket;

import com.collabboard.chat.RoomChatService;
import com.collabboard.dto.BoardEvent;
import com.collabboard.dto.ChatMessageResponse;
import com.collabboard.dto.SendChatMessage;
import com.collabboard.security.AuthPrincipal;
import com.collabboard.service.RoomService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Controller
public class RoomSocketController {
    private final RoomService rooms;
    private final RoomChatService chat;
    private final SimpMessagingTemplate messaging;
    private final PresenceTracker presence;

    public RoomSocketController(RoomService rooms, RoomChatService chat, SimpMessagingTemplate messaging, PresenceTracker presence) {
        this.rooms = rooms;
        this.chat = chat;
        this.messaging = messaging;
        this.presence = presence;
    }

    @MessageMapping("/rooms/{id}/join")
    public void join(@DestinationVariable String id, @Header("simpSessionId") String session, Principal principal) {
        presence.join(id, session, (AuthPrincipal) principal);
        presence.broadcast(id);
    }

    @MessageMapping("/rooms/{id}/leave")
    public void leave(@Header("simpSessionId") String session) { presence.leave(session); }

    @MessageMapping("/rooms/{id}/event")
    public void event(@DestinationVariable String id, BoardEvent event, @Header("simpSessionId") String session, Principal principal) {
        if (!"BOARD".equals(event.type())) return;
        AuthPrincipal user = (AuthPrincipal) principal;
        try {
        rooms.accept(id, event, user.id()).ifPresent(room -> {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "BOARD");
            payload.put("roomId", id);
            payload.put("clientId", event.clientId());
            payload.put("elements", room.elements());
            payload.put("title", room.title());
            payload.put("version", room.version());
            for (String uid : rooms.authorizedUserIds(id)) messaging.convertAndSendToUser(uid, "/queue/rooms/" + id, payload);
        });
        } catch (RuntimeException error) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "BOARD_ERROR");
            payload.put("roomId", id);
            payload.put("clientId", event.clientId());
            payload.put("error", error instanceof IllegalArgumentException && error.getMessage() != null
                    ? error.getMessage() : "Could not save this board update.");
            messaging.convertAndSendToUser(user.id(), "/queue/rooms/" + id, payload);
        }
    }

    @MessageMapping("/rooms/{id}/cursor")
    public void cursor(@DestinationVariable String id, BoardEvent event, @Header("simpSessionId") String session, Principal principal) {
        AuthPrincipal user = (AuthPrincipal) principal;
        rooms.requireAccess(id, user.id());
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "CURSOR");
        payload.put("roomId", id);
        payload.put("clientId", event.clientId());
        payload.put("x", event.x());
        payload.put("y", event.y());
        payload.put("color", event.color());
        payload.put("label", user.displayName());
        for (String uid : rooms.authorizedUserIds(id)) messaging.convertAndSendToUser(uid, "/queue/rooms/" + id, payload);
    }

    @MessageMapping("/rooms/{id}/chat")
    public void sendChat(@DestinationVariable String id, SendChatMessage message, Principal principal) {
        AuthPrincipal user = (AuthPrincipal) principal;
        try {
            ChatMessageResponse saved = chat.send(id, message == null ? null : message.content(), user);
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CHAT");
            payload.put("roomId", id);
            payload.put("clientId", message.clientId());
            payload.put("id", saved.id());
            payload.put("senderId", saved.senderId());
            payload.put("senderName", saved.senderName());
            payload.put("content", saved.content());
            payload.put("createdAt", saved.createdAt());
            for (String uid : rooms.authorizedUserIds(id)) messaging.convertAndSendToUser(uid, "/queue/rooms/" + id, payload);
        } catch (RuntimeException error) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CHAT_ERROR");
            payload.put("roomId", id);
            payload.put("clientId", message == null ? null : message.clientId());
            payload.put("error", error instanceof IllegalArgumentException && error.getMessage() != null
                    ? error.getMessage() : "Could not send this message");
            messaging.convertAndSendToUser(user.id(), "/queue/rooms/" + id, payload);
        }
    }
}
