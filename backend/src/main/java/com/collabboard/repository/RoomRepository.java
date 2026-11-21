package com.collabboard.repository;
import com.collabboard.entity.Room;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface RoomRepository extends JpaRepository<Room,String>{@Lock(LockModeType.PESSIMISTIC_WRITE)@Query("select r from Room r where r.roomId=:id")Optional<Room> findLocked(@Param("id")String id);@EntityGraph(attributePaths="owner")List<Room> findByOwner_IdOrderByUpdatedAtDesc(String ownerId);}

