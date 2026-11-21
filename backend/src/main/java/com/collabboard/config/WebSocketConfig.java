package com.collabboard.config;

import com.collabboard.security.AuthPrincipal;
import com.collabboard.service.RoomService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private static final String ROOM_USER_QUEUE = "/user/queue/rooms/";
    private static final String ROOM_APP_PREFIX = "/app/rooms/";

    private final RoomService rooms;

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String origin;

    public WebSocketConfig(RoomService rooms) {
        this.rooms = rooms;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Board snapshots and cursors are sent to per-user queues. Keep /topic
        // available for future public room topics, but route /queue as well.
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origin);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                if (accessor.getCommand() == StompCommand.CONNECT) {
                    AuthPrincipal user = resolveUser(accessor.getUser());
                    if (user == null) throw new MessageDeliveryException("Sign in is required for board collaboration");
                    // The servlet security context can expose Authentication as the
                    // WebSocket Principal. Normalize it once for all STOMP handlers.
                    accessor.setUser(user);
                    return message;
                }

                StompCommand command = accessor.getCommand();
                if (command != StompCommand.SEND && command != StompCommand.SUBSCRIBE) return message;

                String destination = accessor.getDestination();
                String roomId = roomIdFor(destination, command);
                if (roomId == null) throw new MessageDeliveryException("Unsupported board destination");

                AuthPrincipal user = resolveUser(accessor.getUser());
                if (user == null) throw new MessageDeliveryException("Sign in is required for board collaboration");
                rooms.requireAccess(roomId, user.id());
                return message;
            }
        });
    }

    @Override
    public void configureWebSocketTransport(org.springframework.web.socket.config.annotation.WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(2_100_000)
                .setSendBufferSizeLimit(2_200_000)
                .setSendTimeLimit(15_000);
    }

    private String roomIdFor(String destination, StompCommand command) {
        if (destination == null) return null;
        if (command == StompCommand.SUBSCRIBE && destination.startsWith(ROOM_USER_QUEUE)) {
            String roomId = destination.substring(ROOM_USER_QUEUE.length());
            return roomId.isBlank() || roomId.contains("/") ? null : roomId;
        }
        if (command == StompCommand.SEND && destination.startsWith(ROOM_APP_PREFIX)) {
            String[] segments = destination.substring(ROOM_APP_PREFIX.length()).split("/");
            return segments.length >= 2 && !segments[0].isBlank() ? segments[0] : null;
        }
        return null;
    }

    private AuthPrincipal resolveUser(Principal principal) {
        if (principal instanceof AuthPrincipal user) return user;
        if (principal instanceof Authentication authentication && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof AuthPrincipal user) return user;
        return null;
    }
}
