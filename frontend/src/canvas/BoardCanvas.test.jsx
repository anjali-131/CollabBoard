import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BoardCanvas from './BoardCanvas.jsx';

vi.mock('react-konva', () => {
  const Stage = forwardRef(function Stage({ children, onMouseDown, width, height }, ref) {
    const container = useRef(null);
    const point = useRef({ x: 0, y: 0 });
    useImperativeHandle(ref, () => ({
      setPointersPositions: event => { point.current = { x: event.clientX, y: event.clientY }; },
      getPointerPosition: () => point.current,
      container: () => container.current,
    }));
    return <div ref={container} data-testid="konva-stage" data-width={width} data-height={height} onMouseDown={event => onMouseDown?.({
      target: { getStage: () => ref.current },
      evt: event.nativeEvent,
    })}>{children}</div>;
  });
  const shape = name => forwardRef(function MockShape({ children, text, onDblClick }, ref) {
    return <span ref={ref} data-shape={name} onDoubleClick={onDblClick}>{text}{children}</span>;
  });
  return {
    Stage,
    Layer: ({ children }) => <>{children}</>,
    Line: shape('line'),
    Rect: shape('rect'),
    Ellipse: shape('ellipse'),
    Arrow: shape('arrow'),
    Text: shape('text'),
    Circle: shape('circle'),
    Group: shape('group'),
    Transformer: () => null,
  };
});

afterEach(cleanup);

describe('BoardCanvas text tools', () => {
  it('does not show the removed manual board expansion control', () => {
    render(<BoardCanvas elements={[]} change={vi.fn()} add={vi.fn()} tool="pen" color="#263247" width={4} selected={null} setSelected={vi.fn()} cursors={{}} />);
    expect(screen.queryByRole('button', { name: 'Add more space to this board' })).not.toBeInTheDocument();
  });

  it.each([
    ['text', 'Edit text', 'A board title'],
    ['sticky', 'Edit sticky note', 'Remember this decision'],
  ])('opens a text dialog when placing a %s and saves typed content', (tool, label, value) => {
    const add = vi.fn();
    const change = vi.fn();
    function Harness() {
      const [elements, setElements] = useState([]);
      return <BoardCanvas
        elements={elements}
        add={item => { add(item); setElements(current => [...current, item]); }}
        change={items => { change(items); setElements(items); }}
        tool={tool}
        color="#263247"
        width={4}
        selected={null}
        setSelected={vi.fn()}
        cursors={{}}
      />;
    }
    render(<Harness />);

    fireEvent.mouseDown(screen.getByTestId('konva-stage'), { clientX: 80, clientY: 90 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const editor = screen.getByRole('textbox', { name: label });
    fireEvent.change(editor, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save text' }));

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ kind: tool, x: 80, y: 90 }));
    expect(change).toHaveBeenCalledWith([expect.objectContaining({ kind: tool, text: value })]);
  });

  it('opens existing text for editing on double-click and saves the replacement', () => {
    const existing = { id: 'text-1', kind: 'text', x: 20, y: 30, width: 200, height: 60, text: 'Existing copy', color: '#263247' };
    const change = vi.fn();
    render(<BoardCanvas
      elements={[existing]}
      add={vi.fn()}
      change={change}
      tool="select"
      color="#263247"
      width={4}
      selected={null}
      setSelected={vi.fn()}
      cursors={{}}
    />);

    fireEvent.doubleClick(screen.getByText('Existing copy'));
    const editor = screen.getByRole('textbox', { name: 'Edit text' });
    expect(editor).toHaveValue('Existing copy');
    fireEvent.change(editor, { target: { value: 'Revised copy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save text' }));

    expect(change).toHaveBeenCalledWith([expect.objectContaining({ id: 'text-1', text: 'Revised copy' })]);
  });
});
