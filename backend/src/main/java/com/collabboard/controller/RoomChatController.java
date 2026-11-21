package com.collabboard.controller;

import com.collabboard.chat.RoomChatService;
import com.collabboard.dto.ChatMessageResponse;
import com.collabboard.security.AuthPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rooms/{roomId}/messages")
public class RoomChatController {
    private final RoomChatService chat;

    public RoomChatController(RoomChatService chat) { this.chat = chat; }

    @GetMapping
    public List<ChatMessageResponse> history(@PathVariable String roomId,
                                             @RequestParam(defaultValue = "50") int limit,
                                             @AuthenticationPrincipal AuthPrincipal principal) {
        return chat.history(roomId, limit, principal);
    }
}
