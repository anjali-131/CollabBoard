import { Client } from '@stomp/stompjs';
import { request } from '../auth/AuthContext.jsx';

const WS = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const createRoom = title => request('/api/rooms', {
  method: 'POST',
  body: JSON.stringify({ title }),
});

export const getRoom = id => request(`/api/rooms/${encodeURIComponent(id)}`);

export function connectRoom(roomId, onEvent, onState, onStatus) {
  const clientId = sessionStorage.getItem('collabboard-client') || crypto.randomUUID();
  sessionStorage.setItem('collabboard-client', clientId);

  const client = new Client({
    brokerURL: WS,
    reconnectDelay: 1500,
    connectionTimeout: 10000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      onStatus(true, null);
      // This matches the server's per-user queue and the /queue broker prefix.
      client.subscribe(`/user/queue/rooms/${roomId}`, message => {
        const event = JSON.parse(message.body);
        if (event.type === 'STATE') onState(event);
        else onEvent(event);
      }, { id: `room-${roomId}` });
      client.publish({ destination: `/app/rooms/${roomId}/join`, body: '{}' });
    },
    onWebSocketError: () => onStatus(false, 'Could not open the board WebSocket.'),
    onWebSocketClose: event => onStatus(false, `WebSocket closed (${event.code}). Reconnecting…`),
    onStompError: frame => onStatus(false, frame.headers?.message || 'The board server rejected the STOMP connection.'),
    onDisconnect: () => onStatus(false, 'Disconnected from the board. Reconnecting…'),
  });

  client.activate();

  return {
    send: event => {
      if (!client.connected) return false;
      client.publish({
        destination: `/app/rooms/${roomId}/event`,
        body: JSON.stringify({ ...event, clientId }),
      });
      return true;
    },
    chat: message => {
      if (!client.connected) return false;
      client.publish({
        destination: `/app/rooms/${roomId}/chat`,
        body: JSON.stringify({ content: message.content, clientId }),
      });
      return true;
    },
    cursor: event => {
      if (client.connected) {
        client.publish({
          destination: `/app/rooms/${roomId}/cursor`,
          body: JSON.stringify({ ...event, clientId }),
        });
      }
    },
    close: () => {
      if (client.connected) {
        client.publish({ destination: `/app/rooms/${roomId}/leave`, body: '{}' });
      }
      client.deactivate();
    },
  };
}
