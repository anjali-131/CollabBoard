package com.collabboard.security;
import java.security.Principal;
public record AuthPrincipal(String id,String displayName,String email,int tokenVersion) implements Principal {public AuthPrincipal(String id,String displayName,String email){this(id,displayName,email,0);}public String getName(){return id;}}
