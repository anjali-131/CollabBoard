package com.collabboard.membership;
import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface BoardInvitationRepository extends JpaRepository<BoardInvitation,String>{Optional<BoardInvitation> findByTokenHash(String tokenHash);void deleteByRoom_RoomId(String roomId);}

