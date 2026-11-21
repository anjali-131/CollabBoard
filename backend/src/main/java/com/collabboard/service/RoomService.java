package com.collabboard.service;
import com.collabboard.auth.*;import com.collabboard.security.AuthPrincipal;import com.collabboard.dto.*;import com.collabboard.entity.Room;import com.collabboard.membership.*;import com.collabboard.repository.RoomRepository;import com.fasterxml.jackson.databind.*;import com.fasterxml.jackson.databind.node.ArrayNode;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import java.nio.charset.StandardCharsets;import java.security.*;import java.time.*;import java.util.*;import java.util.Base64;
@Service public class RoomService {
 private final RoomRepository rooms;private final AppUserRepository users;private final BoardMemberRepository members;private final BoardInvitationRepository invites;private final ObjectMapper mapper;
 public RoomService(RoomRepository r,AppUserRepository u,BoardMemberRepository m,BoardInvitationRepository i,ObjectMapper om){rooms=r;users=u;members=m;invites=i;mapper=om;}
 @Transactional public RoomResponse create(String title,AuthPrincipal principal){AppUser owner=user(principal.id());String t=cleanTitle(title==null||title.isBlank()?"Untitled board":title);Room r=new Room(UUID.randomUUID().toString(),t,owner);r.setBoardState(mapper.createArrayNode());return response(rooms.save(r));}
 @Transactional(readOnly=true) public RoomResponse get(String id,AuthPrincipal p){Room r=accessible(id,p.id());return response(r);}
 @Transactional(readOnly=true) public List<BoardSummary> list(AuthPrincipal p){List<BoardSummary> out=new ArrayList<>();rooms.findByOwner_IdOrderByUpdatedAtDesc(p.id()).forEach(r->out.add(summary(r,"OWNER")));for(BoardMember m:members.findByUser_Id(p.id()))out.add(summary(m.getRoom(),"EDITOR"));return out;}
 @Transactional public RoomResponse rename(String id,String title,AuthPrincipal p){Room r=owned(id,p.id());r.setTitle(cleanTitle(title));r.touch();return response(r);}
 @Transactional public Optional<RoomResponse> accept(String id,BoardEvent event,String actorId){
  Room r=rooms.findLocked(id).orElse(null);if(r==null)return Optional.empty();
  if(event.upserts()!=null||event.removedIds()!=null){
   if(event.upserts()!=null&&!event.upserts().isArray())throw new IllegalArgumentException("Board updates must be an array");
   int upsertCount=event.upserts()==null?0:event.upserts().size();int removeCount=event.removedIds()==null?0:event.removedIds().size();
   if(upsertCount+removeCount>10000)throw new IllegalArgumentException("A board update cannot affect more than 10,000 elements");
   Map<String,JsonNode> byId=new LinkedHashMap<>();JsonNode current=r.getBoardState();
   if(current!=null&&current.isArray())for(JsonNode item:current){String elementId=validElement(item);byId.put(elementId,item);}
   if(event.removedIds()!=null)for(String elementId:event.removedIds()){if(elementId==null||elementId.length()>80)throw new IllegalArgumentException("Board element id is invalid");byId.remove(elementId);}
   if(event.upserts()!=null)for(JsonNode item:event.upserts()){String elementId=validElement(item);byId.put(elementId,item);}
   if(byId.size()>10000)throw new IllegalArgumentException("Board state cannot contain more than 10,000 elements");
   ArrayNode merged=mapper.createArrayNode();byId.values().forEach(merged::add);validateSerializedState(merged);r.setBoardState(merged);
  }else if(event.elements()!=null){validateState(event.elements());r.setBoardState(event.elements());}
  if(event.title()!=null&&r.getOwner()!=null&&r.getOwner().getId().equals(actorId))r.setTitle(cleanTitle(event.title()));r.setVersion(r.getVersion()+1);r.touch();return Optional.of(response(r));
 }
 private void validateState(JsonNode state){if(!state.isArray()||state.size()>10000)throw new IllegalArgumentException("Board state must be an array of at most 10,000 elements");for(JsonNode e:state)validElement(e);validateSerializedState(state);}
 private String validElement(JsonNode e){if(e==null||!e.isObject()||!e.hasNonNull("id")||!e.get("id").isTextual()||!e.hasNonNull("kind")||!e.get("kind").isTextual())throw new IllegalArgumentException("Every board element needs a text id and kind");String id=e.get("id").asText(),kind=e.get("kind").asText();if(id.isBlank()||id.length()>80||!Set.of("line","eraser","rect","circle","arrow","text","sticky","flow-node","flow-edge","kanban-task").contains(kind))throw new IllegalArgumentException("Board element is invalid");validateNumbers(e);try{if(mapper.writeValueAsBytes(e).length>32768)throw new IllegalArgumentException("A board element cannot exceed 32 KB");}catch(com.fasterxml.jackson.core.JsonProcessingException ex){throw new IllegalArgumentException("Board element is invalid");}return id;}
 private void validateNumbers(JsonNode node){if(node.isNumber()){double value=node.doubleValue();if(!Double.isFinite(value)||Math.abs(value)>1_000_000)throw new IllegalArgumentException("Board coordinates and measurements must be within 1,000,000 units");}else if(node.isContainerNode())node.elements().forEachRemaining(this::validateNumbers);}
 private void validateSerializedState(JsonNode state){try{if(mapper.writeValueAsBytes(state).length>2_000_000)throw new IllegalArgumentException("Board state cannot exceed 2 MB");}catch(com.fasterxml.jackson.core.JsonProcessingException ex){throw new IllegalArgumentException("Board state is invalid");}}
 @Transactional public InviteResponse invite(String id,long hours,AuthPrincipal p,String origin){Room r=owned(id,p.id());AppUser user=user(p.id());byte[] raw=new byte[32];new SecureRandom().nextBytes(raw);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(raw);invites.save(new BoardInvitation(r,hash(token),user,Instant.now().plusSeconds(hours*3600)));return new InviteResponse(token,id,origin+"/invite?token="+token);}
 @Transactional public BoardSummary acceptInvite(String token,AuthPrincipal p){BoardInvitation i=invites.findByTokenHash(hash(token)).orElseThrow(()->new NoSuchElementException("Invitation is invalid or expired"));if(i.getExpiresAt().isBefore(Instant.now())){invites.delete(i);throw new NoSuchElementException("Invitation is invalid or expired");}AppUser u=user(p.id());String id=i.getRoomId();Room room=rooms.findById(id).orElseThrow();if(!room.getOwner().getId().equals(u.getId())&&!members.existsByRoom_RoomIdAndUser_Id(id,u.getId()))members.save(new BoardMember(room,u));return summary(room,"EDITOR");}
 @Transactional public List<MemberResponse> accessList(String id,AuthPrincipal p){Room r=accessible(id,p.id());List<MemberResponse> list=new ArrayList<>();list.add(new MemberResponse(r.getOwner().getId(),r.getOwner().getName(),r.getOwner().getEmail(),"OWNER"));for(BoardMember m:members.findByRoom_RoomId(id))list.add(new MemberResponse(m.getUser().getId(),m.getUser().getName(),m.getUser().getEmail(),m.getRole()));return list;}
 @Transactional public void removeMember(String id,String userId,AuthPrincipal p){owned(id,p.id());members.deleteByRoom_RoomIdAndUser_Id(id,userId);invites.deleteByRoom_RoomId(id);}
 @Transactional(readOnly=true) public List<String> authorizedUserIds(String id){Room r=rooms.findById(id).orElseThrow(()->new NoSuchElementException("Board not found"));List<String> ids=new ArrayList<>();if(r.getOwner()!=null)ids.add(r.getOwner().getId());members.findByRoom_RoomId(id).forEach(m->ids.add(m.getUser().getId()));return ids;}
 @Transactional(readOnly=true) public RoomResponse getForPresence(String id){return response(rooms.findById(id).orElseThrow(()->new NoSuchElementException("Board not found")));}
 @Transactional(readOnly=true) public void requireAccess(String id,String userId){accessible(id,userId);}
 @Transactional(readOnly=true) public void requireOwner(String id,String userId){owned(id,userId);}
 private Room accessible(String id,String uid){Room r=rooms.findById(id).orElseThrow(()->new NoSuchElementException("Board not found"));if(r.getOwner()!=null&&r.getOwner().getId().equals(uid)||members.existsByRoom_RoomIdAndUser_Id(id,uid))return r;throw new org.springframework.security.access.AccessDeniedException("You do not have access to this board");}
 private Room owned(String id,String uid){Room r=rooms.findById(id).orElseThrow(()->new NoSuchElementException("Board not found"));if(r.getOwner()==null||!r.getOwner().getId().equals(uid))throw new org.springframework.security.access.AccessDeniedException("Only the board owner can do that");return r;}
 private AppUser user(String id){return users.findById(id).orElseThrow(()->new NoSuchElementException("Account not found"));}
 private String cleanTitle(String title){String t=title.trim();if(t.isEmpty()||t.length()>120)throw new IllegalArgumentException("Board title must contain 1 to 120 characters");return t;}
 private BoardSummary summary(Room r,String access){return new BoardSummary(r.getRoomId(),r.getTitle(),r.getOwner()==null?"Legacy board":r.getOwner().getName(),access,r.getCreatedAt(),r.getUpdatedAt());}
 private RoomResponse response(Room r){return new RoomResponse(r.getRoomId(),r.getTitle(),r.getBoardState()==null?mapper.createArrayNode():r.getBoardState(),r.getVersion(),r.getCreatedAt(),r.getUpdatedAt(),r.getOwner()==null?"Unknown":r.getOwner().getName(),r.getOwner()==null?null:r.getOwner().getId());}
 private String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
}







