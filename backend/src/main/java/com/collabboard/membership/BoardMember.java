package com.collabboard.membership;
import com.collabboard.entity.Room;import com.collabboard.auth.AppUser;import jakarta.persistence.*;import java.time.Instant;
@Entity @Table(name="board_members",uniqueConstraints=@UniqueConstraint(columnNames={"room_id","user_id"})) public class BoardMember {
 @Id @Column(length=36) private String id;@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="room_id",nullable=false) private Room room;@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private AppUser user;@Column(nullable=false,length=16) private String role="EDITOR";@Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();protected BoardMember(){}public BoardMember(Room room,AppUser user){this.id=java.util.UUID.randomUUID().toString();this.room=room;this.user=user;}public String getId(){return id;}public Room getRoom(){return room;}public AppUser getUser(){return user;}public String getRole(){return role;}
}

