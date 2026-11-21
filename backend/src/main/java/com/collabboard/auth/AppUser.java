package com.collabboard.auth;
import jakarta.persistence.*;import java.time.Instant;
@Entity @Table(name="app_users") public class AppUser {
 @Id @Column(length=36) private String id; @Column(nullable=false,length=80) private String name; @Column(nullable=false,unique=true,length=254) private String email; @Column(name="password_hash",nullable=false,length=100) private String passwordHash; @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now(); @Column(name="token_version",nullable=false) private int tokenVersion=0;
 protected AppUser(){} public AppUser(String id,String name,String email,String hash){this.id=id;this.name=name;this.email=email;this.passwordHash=hash;} public String getId(){return id;}public String getName(){return name;}public String getEmail(){return email;}public String getPasswordHash(){return passwordHash;}public int getTokenVersion(){return tokenVersion;}public void setPasswordHash(String value){passwordHash=value;tokenVersion++;}
}
