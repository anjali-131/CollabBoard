package com.collabboard.chat;

import com.collabboard.auth.AppUser;
import com.collabboard.entity.Room;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_chat_messages", indexes = @Index(name = "idx_room_chat_messages_room_created", columnList = "room_id,created_at"))
public class RoomChatMessage {
    @Id
    @Column(name = "message_id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private AppUser sender;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected RoomChatMessage() { }

    public RoomChatMessage(Room room, AppUser sender, String content) {
        this.id = UUID.randomUUID().toString();
        this.room = room;
        this.sender = sender;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public Room getRoom() { return room; }
    public AppUser getSender() { return sender; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
