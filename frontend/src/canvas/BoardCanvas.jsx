import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Circle, Group, Transformer } from 'react-konva';
import './BoardCanvas.css';

const DEFAULT_SHAPE_SIZE = 100;

function Shape({ item, selected, tool, onSelect, onChange, onEdit }) {
  const shapeRef = useRef();
  const transformer = useRef();
  const isEditable = tool === 'select';
  const isText = item.kind === 'text' || item.kind === 'sticky';

  useEffect(() => {
    if (selected && isEditable && shapeRef.current && transformer.current) {
      transformer.current.nodes([shapeRef.current]);
      transformer.current.getLayer()?.batchDraw();
    }
  }, [selected, isEditable]);

  const shapeProps = {
    x: item.x,
    y: item.y,
    draggable: isEditable,
    listening: isEditable,
    onClick: isEditable ? onSelect : undefined,
    onTap: isEditable ? onSelect : undefined,
    onDragEnd: event => onChange({ ...item, x: event.target.x(), y: event.target.y() }),
    onTransformEnd: event => {
      const node = event.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const next = {
        ...item,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
        scaleX: 1,
        scaleY: 1,
      };
      if (item.kind === 'arrow') {
        next.points = node.points().map((point, index) => point * (index % 2 === 0 ? scaleX : scaleY));
      }
      node.scaleX(1);
      node.scaleY(1);
      onChange(next);
    },
  };

  let shape;
  if (item.kind === 'rect') {
    shape = <Rect {...shapeProps} width={item.width} height={item.height} fill={item.fill || 'rgba(0,0,0,0)'} stroke={item.color} strokeWidth={item.strokeWidth || 4} cornerRadius={item.radius || 4} />;
  } else if (item.kind === 'circle') {
    shape = <Ellipse {...shapeProps} radiusX={(item.width || DEFAULT_SHAPE_SIZE) / 2} radiusY={(item.height || DEFAULT_SHAPE_SIZE) / 2} fill={item.fill || 'rgba(0,0,0,0)'} stroke={item.color} strokeWidth={item.strokeWidth || 4} />;
  } else if (item.kind === 'arrow') {
    shape = <Arrow {...shapeProps} points={item.points || [0, 0, item.width || 150, item.height || 0]} fill={item.color} stroke={item.color} strokeWidth={item.strokeWidth || 4} pointerLength={12} pointerWidth={12} />;
  } else if (item.kind === 'sticky') {
    shape = <Group {...shapeProps} width={item.width || 200} height={item.height || 130} onDblClick={isEditable ? () => onEdit(item) : undefined} onDblTap={isEditable ? () => onEdit(item) : undefined}>
      <Rect width={item.width || 200} height={item.height || 130} fill={item.fill || '#fff1a8'} stroke="#e8d778" strokeWidth={1} cornerRadius={4} shadowColor="#263247" shadowBlur={8} shadowOpacity={0.12} shadowOffsetY={2} />
      <Text x={0} y={0} width={item.width || 200} height={item.height || 130} text={item.text || 'Write a note…'} fontSize={item.fontSize || 18} padding={14} fill={item.textColor || '#263247'} wrap="word" verticalAlign="top" />
    </Group>;
  } else if (isText) {
    shape = <Text
      {...shapeProps}
      width={item.width || 200}
      height={item.height || 80}
      text={item.text || (item.kind === 'sticky' ? 'Write a note…' : 'Double-click to edit')}
      fontSize={item.fontSize || 18}
      padding={item.kind === 'sticky' ? 14 : 6}
      fill={item.textColor || item.color || '#263247'}
      wrap="word"
      verticalAlign="top"
      onDblClick={isEditable ? () => onEdit(item) : undefined}
      onDblTap={isEditable ? () => onEdit(item) : undefined}
    />;
  } else {
    shape = <Line
      {...shapeProps}
      points={item.points || []}
      stroke={item.color}
      strokeWidth={item.strokeWidth || 4}
      globalCompositeOperation={item.kind === 'eraser' ? 'destination-out' : 'source-over'}
      lineCap="round"
      lineJoin="round"
      tension={0.35}
    />;
  }

  return <>
    {React.cloneElement(shape, { ref: shapeRef })}
    {selected && isEditable && item.kind !== 'line' && item.kind !== 'eraser' && <Transformer
      ref={transformer}
      rotateEnabled={false}
      boundBoxFunc={(oldBox, newBox) => newBox.width < 20 || newBox.height < 20 ? oldBox : newBox}
    />}
  </>;
}

function createItem(tool, start, end, id, color, strokeWidth) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const dragged = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;

  if (tool === 'pen' || tool === 'eraser') {
    return { id, kind: tool === 'pen' ? 'line' : 'eraser', points: [start.x, start.y, end.x, end.y], color, strokeWidth };
  }
  if (tool === 'rect') {
    const width = dragged ? Math.max(2, Math.abs(deltaX)) : DEFAULT_SHAPE_SIZE;
    const height = dragged ? Math.max(2, Math.abs(deltaY)) : 80;
    return { id, kind: 'rect', x: dragged ? Math.min(start.x, end.x) : start.x, y: dragged ? Math.min(start.y, end.y) : start.y, width, height, color, strokeWidth };
  }
  if (tool === 'circle') {
    const width = dragged ? Math.max(2, Math.abs(deltaX)) : DEFAULT_SHAPE_SIZE;
    const height = dragged ? Math.max(2, Math.abs(deltaY)) : DEFAULT_SHAPE_SIZE;
    return { id, kind: 'circle', x: dragged ? (start.x + end.x) / 2 : start.x, y: dragged ? (start.y + end.y) / 2 : start.y, width, height, color, strokeWidth };
  }
  if (tool === 'arrow') {
    const points = dragged ? [0, 0, deltaX, deltaY] : [0, 0, 150, 0];
    return { id, kind: 'arrow', x: start.x, y: start.y, points, width: points[2], height: points[3], color, strokeWidth };
  }
  if (tool === 'text') {
    return { id, kind: 'text', x: start.x, y: start.y, width: 200, height: 60, text: 'Double-click to edit', color, strokeWidth };
  }
  if (tool === 'sticky') {
    return { id, kind: 'sticky', x: start.x, y: start.y, width: 200, height: 130, text: 'Write a note…', fill: '#fff1a8', textColor: '#263247', color, strokeWidth };
  }
  return null;
}

export default function BoardCanvas({ elements, change, add, tool, color, width, selected, setSelected, cursors, disabled = false, disabledMessage = '' }) {
  const stageRef = useRef();
  const drawing = useRef(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingItemSnapshot, setEditingItemSnapshot] = useState(null);
  const [textDraft, setTextDraft] = useState('');
  const [size, setSize] = useState({ w: 900, h: 600 });

  useEffect(() => {
    const viewport = document.querySelector('.canvas-viewport');
    if (!viewport) return undefined;
    const resize = () => setSize({ w: Math.max(1, viewport.clientWidth), h: Math.max(1, viewport.clientHeight) });
    resize();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const contentBounds = elements.reduce((bounds, item) => {
    const points = item.points || [];
    const offsetX = item.kind === 'arrow' ? (item.x || 0) : 0;
    const offsetY = item.kind === 'arrow' ? (item.y || 0) : 0;
    const pointRight = points.reduce((max, value, index) => index % 2 === 0 ? Math.max(max, value + offsetX) : max, 0);
    const pointBottom = points.reduce((max, value, index) => index % 2 === 1 ? Math.max(max, value + offsetY) : max, 0);
    return {
      width: Math.max(bounds.width, (item.x || 0) + (item.width || 0), pointRight),
      height: Math.max(bounds.height, (item.y || 0) + (item.height || 0), pointBottom),
    };
  }, { width: 0, height: 0 });
  const canvasWidth = Math.max(size.w, contentBounds.width + 120);
  const canvasHeight = Math.max(size.h, contentBounds.height + 120);

  useEffect(() => {
    if (stageRef.current) window.__collabBoardStage = stageRef.current;
    return () => { delete window.__collabBoardStage; };
  }, [size]);

  const pointer = event => {
    const stage = event.target?.getStage?.() || stageRef.current;
    if (!stage) return null;
    stage.setPointersPositions?.(event.evt);
    return stage.getPointerPosition();
  };

  const start = event => {
    if (disabled || tool === 'select') return;
    const point = pointer(event);
    if (!point) return;
    const id = crypto.randomUUID();
    if (tool === 'text' || tool === 'sticky') {
      const item = createItem(tool, point, point, id, color, width);
      if (item) {
        add(item);
        setSelected(item.id);
        setEditingId(item.id);
        setEditingItemSnapshot(item);
        setTextDraft('');
      }
      return;
    }
    drawing.current = { id, tool, start: point, color, strokeWidth: width };
    setPreview(createItem(tool, point, point, id, color, width));
  };

  const move = event => {
    if (disabled) return;
    const point = pointer(event);
    if (!point) return;
    if (drawing.current) {
      const active = drawing.current;
      if (active.tool === 'pen' || active.tool === 'eraser') {
        setPreview(current => current ? { ...current, points: [...current.points, point.x, point.y] } : current);
      } else {
        setPreview(createItem(active.tool, active.start, point, active.id, active.color, active.strokeWidth));
      }
    }
    if (stageRef.current) stageRef.current.container().style.cursor = tool === 'select' ? 'default' : (tool === 'eraser' ? 'cell' : 'crosshair');
    window.dispatchEvent(new CustomEvent('boardcursor', { detail: point }));
  };

  const finish = event => {
    if (disabled) return;
    const active = drawing.current;
    if (!active) return;
    const point = pointer(event) || active.start;
    let item;
    if (active.tool === 'pen' || active.tool === 'eraser') {
      item = preview || createItem(active.tool, active.start, point, active.id, active.color, active.strokeWidth);
      if (item.points.length < 4) item = { ...item, points: [...item.points, item.points[0], item.points[1]] };
    } else {
      item = createItem(active.tool, active.start, point, active.id, active.color, active.strokeWidth);
    }
    if (item) add(item);
    drawing.current = null;
    setPreview(null);
  };

  const canvasElements = elements.filter(item => item.kind !== 'flow-node' && item.kind !== 'flow-edge' && item.kind !== 'kanban-task');
  const renderedItems = preview ? [...canvasElements, preview] : canvasElements;
  const editingItem = elements.find(item => item.id === editingId) || editingItemSnapshot;
  const commitText = () => {
    if (!editingId) return;
    change(elements.map(item => item.id === editingId ? { ...item, text: textDraft } : item));
    setEditingId(null);
    setEditingItemSnapshot(null);
  };
  const cancelText = () => {
    setEditingId(null);
    setEditingItemSnapshot(null);
  };

  return <div className={`canvas-viewport${disabled ? ' canvas-disabled' : ''}`}>
    <Stage
      ref={stageRef}
      width={canvasWidth}
      height={canvasHeight}
      listening={!disabled}
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={finish}
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={finish}
      onClick={event => {
        if (tool === 'select' && event.target === event.target.getStage()) setSelected(null);
      }}
    >
      <Layer>
        {renderedItems.map(item => <Shape
          key={item.id}
          item={item}
          tool={tool}
          selected={selected === item.id}
          onSelect={() => setSelected(item.id)}
          onEdit={value => {
            setSelected(value.id);
            setEditingId(value.id);
            setEditingItemSnapshot(value);
            setTextDraft(value.text || '');
          }}
          onChange={value => change(elements.map(existing => existing.id === value.id ? value : existing))}
        />)}
      </Layer>
      <Layer listening={false}>
        {Object.values(cursors).map(cursor => <React.Fragment key={cursor.clientId}>
          <Circle x={cursor.x} y={cursor.y} radius={5} fill={cursor.color || '#5b6cff'} stroke="#fff" strokeWidth={2} />
          <Text x={cursor.x + 10} y={cursor.y + 8} text={cursor.label || 'Collaborator'} fontSize={12} fill={cursor.color || '#5b6cff'} />
        </React.Fragment>)}
      </Layer>
    </Stage>
    {editingItem && <div className="canvas-text-backdrop">
      <section className={`canvas-text-dialog${editingItem.kind === 'sticky' ? ' sticky-dialog' : ''}`} role="dialog" aria-modal="true" aria-labelledby="canvas-text-dialog-title">
        <h2 id="canvas-text-dialog-title">{editingItem.kind === 'sticky' ? 'Write a sticky note' : 'Add text to the board'}</h2>
        <p>Your text will appear on the board for everyone in this room.</p>
        <textarea
          autoFocus
          aria-label={editingItem.kind === 'sticky' ? 'Edit sticky note' : 'Edit text'}
          value={textDraft}
          placeholder={editingItem.kind === 'sticky' ? 'Write your note…' : 'Type your text…'}
          onChange={event => setTextDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelText();
            } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              commitText();
            }
          }}
        />
        <div className="canvas-text-actions">
          <button type="button" onClick={cancelText}>Cancel</button>
          <button type="button" className="primary" onClick={commitText}>Save text</button>
        </div>
      </section>
    </div>}
    {disabled && <div className="canvas-connect-overlay" role="status">
      <strong>{disabledMessage || 'Connecting to this board…'}</strong>
      <span>Board tools will activate when the latest saved state is synchronized.</span>
    </div>}
  </div>;
}
