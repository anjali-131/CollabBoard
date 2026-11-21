package com.collabboard.controller;
import com.collabboard.dto.*;import com.collabboard.security.AuthPrincipal;import com.collabboard.service.RoomService;import jakarta.validation.Valid;import org.springframework.http.*;import org.springframework.security.core.annotation.AuthenticationPrincipal;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequestMapping("/api/rooms") public class RoomController {private final RoomService service;public RoomController(RoomService s){service=s;}
 @PostMapping public ResponseEntity<RoomResponse> create(@Valid @RequestBody(required=false)CreateRoomRequest req,@AuthenticationPrincipal AuthPrincipal p){return ResponseEntity.status(201).body(service.create(req==null?null:req.title(),p));}
 @GetMapping public List<BoardSummary> list(@AuthenticationPrincipal AuthPrincipal p){return service.list(p);}
 @GetMapping("/{id}")public RoomResponse get(@PathVariable String id,@AuthenticationPrincipal AuthPrincipal p){return service.get(id,p);}
 @PatchMapping("/{id}")public RoomResponse rename(@PathVariable String id,@Valid @RequestBody RenameBoardRequest b,@AuthenticationPrincipal AuthPrincipal p){return service.rename(id,b.title(),p);}
 @PostMapping("/{id}/invitations")public InviteResponse invite(@PathVariable String id,@Valid @RequestBody InviteRequest b,@AuthenticationPrincipal AuthPrincipal p,@RequestHeader(value="Origin",defaultValue="http://localhost:5173")String origin){return service.invite(id,b.expiresHours(),p,origin);}
 @GetMapping("/{id}/members")public List<MemberResponse> members(@PathVariable String id,@AuthenticationPrincipal AuthPrincipal p){return service.accessList(id,p);}
 @DeleteMapping("/{id}/members/{userId}")public ResponseEntity<Void> remove(@PathVariable String id,@PathVariable String userId,@AuthenticationPrincipal AuthPrincipal p){service.removeMember(id,userId,p);return ResponseEntity.noContent().build();}
 @PostMapping("/invites/{token}/accept")public BoardSummary accept(@PathVariable String token,@AuthenticationPrincipal AuthPrincipal p){return service.acceptInvite(token,p);}
 @ExceptionHandler(NoSuchElementException.class)public ResponseEntity<Map<String,String>> missing(Exception e){return ResponseEntity.status(404).body(Map.of("error",e.getMessage()));}@ExceptionHandler(IllegalArgumentException.class)public ResponseEntity<Map<String,String>> invalid(Exception e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()));}
}
