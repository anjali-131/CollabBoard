package com.collabboard.config;
import org.springframework.http.*;import org.springframework.security.access.AccessDeniedException;import org.springframework.web.server.ResponseStatusException;import org.springframework.web.bind.MethodArgumentNotValidException;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestControllerAdvice public class ApiErrorHandler {
 @ExceptionHandler(MethodArgumentNotValidException.class)public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException e){String message=e.getBindingResult().getFieldErrors().stream().findFirst().map(x->x.getField()+": "+x.getDefaultMessage()).orElse("Request validation failed");return ResponseEntity.badRequest().body(Map.of("error",message));}
 @ExceptionHandler(ResponseStatusException.class)public ResponseEntity<Map<String,String>> status(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("error",e.getReason()==null?"Request could not be completed":e.getReason()));}
 @ExceptionHandler(AccessDeniedException.class)public ResponseEntity<Map<String,String>> denied(AccessDeniedException e){return ResponseEntity.status(403).body(Map.of("error",e.getMessage()==null?"Access denied":e.getMessage()));}
 @ExceptionHandler(IllegalArgumentException.class)public ResponseEntity<Map<String,String>> invalid(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()==null?"Invalid request":e.getMessage()));}
 @ExceptionHandler(NoSuchElementException.class)public ResponseEntity<Map<String,String>> missing(NoSuchElementException e){return ResponseEntity.status(404).body(Map.of("error",e.getMessage()==null?"Not found":e.getMessage()));}
}
