import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FlowchartBoard from './FlowchartBoard.jsx';
import KanbanBoard from './KanbanBoard.jsx';

afterEach(cleanup);

describe('FlowchartBoard', () => {
  it('creates nodes and connects them with an automatically positioned arrow', () => {
    function Harness() {
      const [elements, setElements] = useState([]);
      return <FlowchartBoard elements={elements} updateElements={setElements} />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '＋ Process' }));
    fireEvent.click(screen.getByRole('button', { name: '＋ Decision' }));
    fireEvent.click(screen.getByRole('button', { name: /Connect nodes/ }));
    fireEvent.click(screen.getByLabelText('process node text').closest('.diagram-node'));
    fireEvent.click(screen.getByLabelText('Decision node text').closest('.diagram-node'));
    expect(screen.getByLabelText('Flowchart connectors').querySelectorAll('line')).toHaveLength(1);
  });
});

describe('KanbanBoard', () => {
  it('creates, edits, and assigns tasks to board collaborators', () => {
    function Harness() {
      const [elements, setElements] = useState([]);
      return <KanbanBoard elements={elements} updateElements={setElements} user={{ id: 'u1', name: 'Alex' }} members={[{ userId: 'u2', name: 'Sam' }]} />;
    }
    render(<Harness />);
    fireEvent.change(screen.getByRole('textbox', { name: 'New task for To Do' }), { target: { value: 'Design API' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add task to To Do' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Description for Design API' }), { target: { value: 'Document endpoints' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Assignee for Design API' }), { target: { value: 'u2' } });
    expect(screen.getByRole('textbox', { name: 'Task title' })).toHaveValue('Design API');
    expect(screen.getByRole('textbox', { name: 'Description for Design API' })).toHaveValue('Document endpoints');
    expect(screen.getByRole('combobox', { name: 'Assignee for Design API' })).toHaveValue('u2');
  });
});
