import React, { useMemo, useRef, useState } from 'react';
import './BoardModes.css';

const TYPES = {
  start: { title: 'Start / End', shape: 'flow-start' },
  process: { title: 'Process', shape: 'flow-process' },
  decision: { title: 'Decision?', shape: 'flow-decision' },
};

function pointOnBorder(node, toward, isDiamond = false) {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const rx = node.width / 2;
  const ry = node.height / 2;
  const scale = isDiamond
    ? 1 / (Math.abs(dx) / rx + Math.abs(dy) / ry || 1)
    : Math.min(rx / (Math.abs(dx) || Infinity), ry / (Math.abs(dy) || Infinity));
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export default function FlowchartBoard({ elements, updateElements, disabled = false }) {
  const nodes = elements.filter(item => item.kind === 'flow-node');
  const edges = elements.filter(item => item.kind === 'flow-edge');
  const [connectMode, setConnectMode] = useState(false);
  const [sourceId, setSourceId] = useState(null);
  const [drag, setDrag] = useState(null);
  const graphRef = useRef(null);
  const visibleNodes = useMemo(() => nodes.map(node => drag?.id === node.id ? { ...node, x: drag.x, y: drag.y } : node), [nodes, drag]);

  const addNode = type => {
    if (disabled) return;
    const index = nodes.length;
    const column = index % 4;
    const row = Math.floor(index / 4);
    const definition = TYPES[type];
    updateElements([...elements, { id: crypto.randomUUID(), kind: 'flow-node', nodeType: type, title: definition.title, x: 70 + column * 255, y: 70 + row * 170, width: type === 'decision' ? 150 : 190, height: type === 'decision' ? 110 : 76 }]);
  };

  const clickNode = node => {
    if (disabled || !connectMode) return;
    if (!sourceId) setSourceId(node.id);
    else if (sourceId !== node.id && !edges.some(edge => edge.from === sourceId && edge.to === node.id)) {
      updateElements([...elements, { id: crypto.randomUUID(), kind: 'flow-edge', from: sourceId, to: node.id }]);
      setSourceId(null);
      setConnectMode(false);
    } else setSourceId(null);
  };

  const startDrag = (event, node) => {
    if (disabled || event.target instanceof HTMLInputElement || connectMode) return;
    event.preventDefault();
    event.stopPropagation();
    const box = graphRef.current.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: node.id, x: node.x, y: node.y, offsetX: event.clientX - box.left - node.x, offsetY: event.clientY - box.top - node.y });
  };

  const moveDrag = event => {
    if (!drag || !graphRef.current) return;
    const box = graphRef.current.getBoundingClientRect();
    setDrag(current => current && ({ ...current, x: Math.max(0, event.clientX - box.left - current.offsetX), y: Math.max(0, event.clientY - box.top - current.offsetY) }));
  };

  const endDrag = () => {
    if (!drag) return;
    updateElements(elements.map(item => item.id === drag.id ? { ...item, x: drag.x, y: drag.y } : item));
    setDrag(null);
  };

  const editNode = (id, title) => updateElements(elements.map(item => item.id === id ? { ...item, title } : item));
  const removeNode = id => updateElements(elements.filter(item => item.id !== id && !(item.kind === 'flow-edge' && (item.from === id || item.to === id))));
  const byId = id => visibleNodes.find(node => node.id === id);

  return <section className="diagram-panel" aria-label="Flowchart builder">
    <div className="diagram-toolbar">
      <div className="diagram-add-actions">
        <button type="button" disabled={disabled} onClick={() => addNode('start')}>＋ Start / End</button>
        <button type="button" disabled={disabled} onClick={() => addNode('process')}>＋ Process</button>
        <button type="button" disabled={disabled} onClick={() => addNode('decision')}>＋ Decision</button>
      </div>
      <button type="button" disabled={disabled} className={connectMode ? 'diagram-connect active' : 'diagram-connect'} onClick={() => { setConnectMode(value => !value); setSourceId(null); }}>↗ {connectMode ? 'Choose two nodes…' : 'Connect nodes'}</button>
      <span>{connectMode ? (sourceId ? 'Now select a target node' : 'Select a starting node') : 'Drag nodes to arrange · connect to create arrows'}</span>
    </div>
    <div className="diagram-scroll">
      <div className="diagram-graph" ref={graphRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <svg className="diagram-edges" width="1600" height={Math.max(900, Math.ceil(nodes.length / 4) * 250)} aria-label="Flowchart connectors">
          <defs><marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#65708a" /></marker></defs>
          {edges.map(edge => {
            const from = byId(edge.from); const to = byId(edge.to);
            if (!from || !to) return null;
            const aCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
            const bCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
            const a = pointOnBorder(from, bCenter, from.nodeType === 'decision');
            const b = pointOnBorder(to, aCenter, to.nodeType === 'decision');
            return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#65708a" strokeWidth="2" markerEnd="url(#flow-arrow)" />;
          })}
        </svg>
        {visibleNodes.map(node => <article key={node.id} className={`diagram-node ${TYPES[node.nodeType]?.shape || 'flow-process'}${sourceId === node.id ? ' source-selected' : ''}`} style={{ left: node.x, top: node.y, width: node.width, height: node.height }} onPointerDown={event => startDrag(event, node)} onClick={() => clickNode(node)}>
          {node.nodeType === 'decision' && <span className="decision-label"><input disabled={disabled} aria-label="Decision node text" value={node.title} onPointerDown={event => event.stopPropagation()} onChange={event => editNode(node.id, event.target.value)} /></span>}
          {node.nodeType !== 'decision' && <input disabled={disabled} aria-label={`${node.nodeType} node text`} value={node.title} onPointerDown={event => event.stopPropagation()} onChange={event => editNode(node.id, event.target.value)} />}
          <button type="button" disabled={disabled} className="diagram-node-delete" aria-label={`Delete ${node.title || 'node'}`} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); removeNode(node.id); }}>×</button>
        </article>)}
        {!nodes.length && <div className="diagram-empty">Add a Start, Process, or Decision block to begin your flowchart.</div>}
      </div>
    </div>
  </section>;
}
