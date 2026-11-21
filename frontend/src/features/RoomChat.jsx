import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './RoomChat.css';

export const MAX_CHAT_LENGTH = 2000;
const STORAGE_KEY_PREFIX = 'collabboard-room-chat-frame:';
const EDGE = 8;

function constraints(viewportWidth, viewportHeight) {
  const maxWidth = Math.max(1, Math.min(520, viewportWidth - EDGE * 2));
  const maxHeight = Math.max(1, Math.min(720, viewportHeight - EDGE * 2));
  return {
    minWidth: Math.min(300, maxWidth),
    maxWidth,
    minHeight: Math.min(340, maxHeight),
    maxHeight,
  };
}

function fitFrame(frame, viewportWidth = window.innerWidth, viewportHeight = window.innerHeight) {
  const limits = constraints(viewportWidth, viewportHeight);
  const width = Math.max(limits.minWidth, Math.min(limits.maxWidth, Number(frame.width) || Math.min(360, limits.maxWidth)));
  const height = Math.max(limits.minHeight, Math.min(limits.maxHeight, Number(frame.height) || Math.min(560, limits.maxHeight)));
  return {
    width,
    height,
    x: Math.max(EDGE, Math.min(viewportWidth - width - EDGE, Number.isFinite(Number(frame.x)) ? Number(frame.x) : viewportWidth - width - 16)),
    y: Math.max(EDGE, Math.min(viewportHeight - height - EDGE, Number.isFinite(Number(frame.y)) ? Number(frame.y) : viewportHeight - height - 16)),
  };
}

function initialFrame(roomId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${roomId}`));
    if (saved && typeof saved === 'object') return fitFrame(saved);
  } catch { /* Use a sensible viewport-relative default if the session value is invalid. */ }
  return fitFrame({});
}

export default function RoomChat({ roomId, messages, user, connected, loading, error, onSend, onClose }) {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [frame, setFrame] = useState(() => initialFrame(roomId));
  const listRef = useRef(null);
  const interaction = useRef(null);
  const shownError = sendError || error;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    try { sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${roomId}`, JSON.stringify(frame)); }
    catch { /* Position and size remain available until this panel unmounts. */ }
  }, [frame, roomId]);

  useEffect(() => {
    const resizeViewport = () => setFrame(current => fitFrame(current));
    window.addEventListener('resize', resizeViewport);
    return () => {
      window.removeEventListener('resize', resizeViewport);
      interaction.current = null;
    };
  }, []);

  const beginInteraction = (event, mode) => {
    if (event.button != null && event.button !== 0 && event.pointerType !== 'touch') return;
    if (mode === 'move' && event.target.closest('button,input,textarea,select,a,[data-no-drag]')) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    interaction.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      frame,
      pointerId: event.pointerId,
    };
  };

  const moveInteraction = event => {
    const active = interaction.current;
    if (!active) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    const limits = constraints(window.innerWidth, window.innerHeight);
    const right = active.frame.x + active.frame.width;
    let next = active.frame;
    if (active.mode === 'move') {
      next = { ...active.frame, x: active.frame.x + dx, y: active.frame.y + dy };
    } else if (active.mode === 'resize-left') {
      const width = Math.max(limits.minWidth, Math.min(limits.maxWidth, active.frame.width - dx));
      next = { ...active.frame, x: right - width, width };
    } else if (active.mode === 'resize-corner') {
      next = {
        ...active.frame,
        width: Math.max(limits.minWidth, Math.min(limits.maxWidth, active.frame.width + dx)),
        height: Math.max(limits.minHeight, Math.min(limits.maxHeight, active.frame.height + dy)),
      };
    }
    setFrame(fitFrame(next));
  };

  const endInteraction = event => {
    if (!interaction.current || event.pointerId == null || event.pointerId === interaction.current.pointerId) interaction.current = null;
  };

  const send = event => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) { setSendError('Write a message before sending.'); return; }
    if (content.length > MAX_CHAT_LENGTH) { setSendError('Messages can be up to 2,000 characters.'); return; }
    if (!connected || !onSend(content)) { setSendError('You are offline. Your message was not sent.'); return; }
    setDraft('');
    setSendError('');
  };

  return createPortal(<section className="room-chat" aria-label="Room chat" style={{ position: 'fixed', left: frame.x, top: frame.y, width: frame.width, height: frame.height }} onPointerMove={moveInteraction} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
    <header className="room-chat-header" onPointerDown={event => beginInteraction(event, 'move')}>
      <div className="room-chat-heading"><strong>Room chat</strong><span>{connected ? 'Live with this board’s members' : 'Reconnecting…'}</span></div>
      <div className="room-chat-header-actions"><button type="button" aria-label="Minimize chat" title="Minimize chat" onPointerDown={event => event.stopPropagation()} onClick={onClose}>−</button><button type="button" aria-label="Close chat" title="Close chat" onPointerDown={event => event.stopPropagation()} onClick={onClose}>×</button></div>
    </header>
    <div className="room-chat-messages" role="log" aria-live="polite" aria-relevant="additions text" ref={listRef}>
      {loading ? <p className="room-chat-empty">Loading recent messages…</p> : messages.length === 0 ? <p className="room-chat-empty">No messages yet. Start the conversation.</p> : messages.map(message => <article key={message.id} className={`room-chat-message${message.senderId === user.id ? ' mine' : ''}`}>
        <div className="room-chat-message-meta"><b>{message.senderId === user.id ? 'You' : message.senderName}</b><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
        <p>{message.content}</p>
      </article>)}
    </div>
    <div className="room-chat-bottom">
      {shownError && <p className="room-chat-error" role="alert">{shownError}</p>}
      {!connected && <p className="room-chat-offline" role="status">Chat is unavailable until the board reconnects.</p>}
      <form className="room-chat-compose" onSubmit={send}>
        <textarea aria-label="Chat message" placeholder="Message the room…" value={draft} maxLength={MAX_CHAT_LENGTH} disabled={!connected} onChange={event => { setDraft(event.target.value); setSendError(''); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event); } }} />
        <div className="room-chat-compose-footer"><span>{draft.length}/{MAX_CHAT_LENGTH} · Enter to send, Shift+Enter for a new line</span><button type="submit" className="button primary" disabled={!connected || !draft.trim()}>Send</button></div>
      </form>
    </div>
    <div className="room-chat-resize-left" role="separator" aria-orientation="vertical" aria-label="Resize chat width" onPointerDown={event => beginInteraction(event, 'resize-left')} />
    <div className="room-chat-resize-corner" role="separator" aria-orientation="horizontal" aria-label="Resize chat panel" onPointerDown={event => beginInteraction(event, 'resize-corner')} />
  </section>, document.body);
}
