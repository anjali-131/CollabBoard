import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RoomChat from './RoomChat.jsx';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('RoomChat', () => {
  const pointerEvent = (target, type, options = {}) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0, ...options });
    Object.defineProperty(event, 'pointerId', { value: options.pointerId ?? 1 });
    fireEvent(target, event);
  };

  it('renders history with distinct own and received messages', () => {
    render(<RoomChat user={{ id: 'u1' }} connected loading={false} error="" onSend={vi.fn()} onClose={vi.fn()} messages={[
      { id: 'm1', senderId: 'u2', senderName: 'Sam', content: 'Hello', createdAt: '2026-10-25T10:00:00Z' },
      { id: 'm2', senderId: 'u1', senderName: 'Alex', content: 'Hi there', createdAt: '2026-10-25T10:01:00Z' },
    ]} />);
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there').closest('.room-chat-message')).toHaveClass('mine');
  });

  it('sends on Enter, keeps Shift+Enter for multiline, and rejects blank input', () => {
    const onSend = vi.fn(() => true);
    render(<RoomChat user={{ id: 'u1' }} connected loading={false} error="" onSend={onSend} onClose={vi.fn()} messages={[]} />);
    const input = screen.getByRole('textbox', { name: 'Chat message' });
    fireEvent.change(input, { target: { value: 'First line' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('First line');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert')).toHaveTextContent('Write a message before sending.');
  });

  it('keeps the composer outside the independently scrollable message list', () => {
    render(<RoomChat roomId="room-a" user={{ id: 'u1' }} connected loading={false} error="" onSend={vi.fn()} onClose={vi.fn()} messages={[]} />);
    const panel = screen.getByRole('region', { name: 'Room chat' });
    const messages = screen.getByRole('log');
    const composer = screen.getByRole('textbox', { name: 'Chat message' });
    expect(panel).toHaveStyle({ position: 'fixed' });
    expect(messages.parentElement).toBe(panel);
    expect(composer.closest('.room-chat-bottom').parentElement).toBe(panel);
    expect(screen.getByRole('separator', { name: 'Resize chat width' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Resize chat panel' })).toBeInTheDocument();
  });

  it('supports moving and resizing while keeping the panel inside the viewport', () => {
    render(<RoomChat roomId="room-a" user={{ id: 'u1' }} connected loading={false} error="" onSend={vi.fn()} onClose={vi.fn()} messages={[]} />);
    const panel = screen.getByRole('region', { name: 'Room chat' });
    const header = screen.getByText('Room chat').closest('header');
    const startX = Number.parseFloat(panel.style.left);
    const startY = Number.parseFloat(panel.style.top);

    pointerEvent(header, 'pointerdown', { pointerId: 1, clientX: 700, clientY: 220 });
    pointerEvent(panel, 'pointermove', { pointerId: 1, clientX: 660, clientY: 250 });
    pointerEvent(panel, 'pointerup', { pointerId: 1 });
    expect(panel.style.left).toBe(`${startX - 40}px`);
    expect(Number.parseFloat(panel.style.top)).toBeGreaterThan(startY);

    pointerEvent(screen.getByRole('separator', { name: 'Resize chat width' }), 'pointerdown', { pointerId: 2, clientX: startX, clientY: 300 });
    pointerEvent(panel, 'pointermove', { pointerId: 2, clientX: startX - 60, clientY: 300 });
    pointerEvent(panel, 'pointerup', { pointerId: 2 });
    expect(panel.style.width).toBe('420px');

    pointerEvent(screen.getByRole('separator', { name: 'Resize chat panel' }), 'pointerdown', { pointerId: 3, clientX: 900, clientY: 700 });
    pointerEvent(panel, 'pointermove', { pointerId: 3, clientX: 950, clientY: 740 });
    pointerEvent(panel, 'pointerup', { pointerId: 3 });
    expect(panel.style.width).toBe('470px');
    expect(panel.style.height).toBe('600px');

    pointerEvent(header, 'pointerdown', { pointerId: 4, clientX: 700, clientY: 220 });
    pointerEvent(panel, 'pointermove', { pointerId: 4, clientX: -5000, clientY: -5000 });
    pointerEvent(panel, 'pointerup', { pointerId: 4 });
    expect(Number.parseFloat(panel.style.left)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(panel.style.top)).toBeGreaterThanOrEqual(8);
  });

  it('calls close from minimize and restores the saved room placement on reopen', () => {
    const onClose = vi.fn();
    const { unmount } = render(<RoomChat roomId="room-a" user={{ id: 'u1' }} connected loading={false} error="" onSend={vi.fn()} onClose={onClose} messages={[]} />);
    const panel = screen.getByRole('region', { name: 'Room chat' });
    const originalLeft = panel.style.left;
    pointerEvent(screen.getByRole('button', { name: 'Minimize chat' }), 'pointerdown', { pointerId: 5 });
    fireEvent.click(screen.getByRole('button', { name: 'Minimize chat' }));
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    render(<RoomChat roomId="room-a" user={{ id: 'u1' }} connected loading={false} error="" onSend={vi.fn()} onClose={vi.fn()} messages={[]} />);
    expect(screen.getByRole('region', { name: 'Room chat' }).style.left).toBe(originalLeft);
  });

  it('fits the saved panel into a smaller viewport after resize', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    const { unmount } = render(<RoomChat roomId="room-mobile" user={{ id: 'u1' }} connected loading={false} error="" onSend={vi.fn()} onClose={vi.fn()} messages={[]} />);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 });
    fireEvent(window, new Event('resize'));
    const panel = screen.getByRole('region', { name: 'Room chat' });
    expect(Number.parseFloat(panel.style.left)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(panel.style.top)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(panel.style.width)).toBeLessThanOrEqual(344);
    expect(Number.parseFloat(panel.style.height)).toBeLessThanOrEqual(284);
    unmount();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
  });
});
