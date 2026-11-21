import { useEffect, useRef, useState } from 'react';
import { connectRoom } from '../services/api';

export function useRoom(roomId, initial, onRemoteState, displayName, onChatMessage, onChatError, onBoardError) {
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [peers, setPeers] = useState([]);
  const [cursors, setCursors] = useState({});
  const transport = useRef(null);
  const cursorTimers = useRef(new Map());
  const connectionGeneration = useRef(0);
  const version = useRef(initial?.version || 0);
  const onStateRef = useRef(onRemoteState);
  const onChatRef = useRef(onChatMessage);
  const onChatErrorRef = useRef(onChatError);
  const onBoardErrorRef = useRef(onBoardError);
  onStateRef.current = onRemoteState;
  onChatRef.current = onChatMessage;
  onChatErrorRef.current = onChatError;
  onBoardErrorRef.current = onBoardError;

  useEffect(() => {
    const generation = ++connectionGeneration.current;
    const isCurrentConnection = () => connectionGeneration.current === generation;
    setReady(false);
    setConnected(false);
    setConnectError('');
    if (!roomId) return undefined;

    const clientId = sessionStorage.getItem('collabboard-client') || crypto.randomUUID();
    sessionStorage.setItem('collabboard-client', clientId);
    sessionStorage.setItem('collabboard-name', displayName || 'Collaborator');

    transport.current = connectRoom(
      roomId,
      event => {
        if (!isCurrentConnection()) return;
        if (event.type === 'CURSOR') {
          if (event.clientId === clientId) return;
          setCursors(current => ({ ...current, [event.clientId]: event }));
          clearTimeout(cursorTimers.current.get(event.clientId));
          cursorTimers.current.set(event.clientId, setTimeout(() => {
            cursorTimers.current.delete(event.clientId);
            setCursors(current => {
            const next = { ...current };
            delete next[event.clientId];
            return next;
            });
          }, 4000));
          return;
        }
        if (event.type === 'CHAT') {
          onChatRef.current?.(event);
          return;
        }
        if (event.type === 'CHAT_ERROR') {
          onChatErrorRef.current?.(event);
          return;
        }
        if (event.type === 'BOARD_ERROR') {
          onBoardErrorRef.current?.(event);
          return;
        }
        if (event.clientId === clientId) {
          version.current = Math.max(version.current, event.version || 0);
          onStateRef.current(event);
          return;
        }
        if (event.clientId !== clientId && event.version > version.current) {
          version.current = event.version;
          onStateRef.current(event);
        }
      },
      state => {
        if (!isCurrentConnection()) return;
        // The join snapshot may be equal to the REST version. It still must be
        // applied so an empty, version-zero board becomes ready.
        if (state.version >= version.current) {
          version.current = state.version;
          onStateRef.current(state);
          setPeers(state.participants || []);
          setReady(true);
        }
      },
      (isConnected, error) => {
        if (!isCurrentConnection()) return;
        setConnected(isConnected);
        setConnectError(isConnected ? '' : (error || ''));
        if (!isConnected) setReady(false);
      },
    );

    return () => {
      connectionGeneration.current += 1;
      transport.current?.close();
      transport.current = null;
      cursorTimers.current.forEach(clearTimeout);
      cursorTimers.current.clear();
      setConnected(false);
    };
  }, [roomId, displayName]);

  return {
    connected,
    ready,
    connectError,
    peers,
    cursors,
    send: payload => transport.current?.send({
      ...payload,
      clientId: sessionStorage.getItem('collabboard-client'),
      baseVersion: version.current,
    }),
    sendChat: content => transport.current?.chat({ content }),
    cursor: payload => transport.current?.cursor({
      ...payload,
      clientId: sessionStorage.getItem('collabboard-client'),
    }),
  };
}
