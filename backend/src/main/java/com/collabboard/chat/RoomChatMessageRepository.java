package com.collabboard.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomChatMessageRepository extends JpaRepository<RoomChatMessage, String> {
    List<RoomChatMessage> findByRoom_RoomIdOrderByCreatedAtDescIdDesc(String roomId, Pageable pageable);
}
