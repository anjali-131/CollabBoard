import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { callbacks, chatPublish, close } = vi.hoisted(() => ({ callbacks: {}, chatPublish: vi.fn(() => true), close: vi.fn() }));
vi.mock('../services/api.js', () => ({ connectRoom: vi.fn((roomId, onEvent, onState, onStatus) => {
  callbacks.event = onEvent;
  callbacks.state = onState;
  callbacks.status = onStatus;
  return { send: vi.fn(() => true), chat: chatPublish, cursor: vi.fn(), close };
}) }));
import { useRoom } from './useRoom.js';

afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

describe('useRoom chat transport', () => {
  it('receives chat echo for the sender, publishes over the existing room transport, and cleans up', () => {
    const receive = vi.fn();
    const { result, unmount } = renderHook(() => useRoom('room-1', null, vi.fn(), 'Alex', receive, vi.fn()));
    act(() => callbacks.status(true));
    act(() => callbacks.event({ type: 'CHAT', id: 'm1', clientId: sessionStorage.getItem('collabboard-client') }));
    expect(receive).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }));
    expect(result.current.sendChat('hello')).toBe(true);
    expect(chatPublish).toHaveBeenCalledWith({ content: 'hello' });
    unmount();
    expect(close).toHaveBeenCalled();
  });
});
