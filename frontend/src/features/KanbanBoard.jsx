import React, { useState } from 'react';
import './BoardModes.css';

const COLUMNS = [['TODO', 'To Do'], ['IN_PROGRESS', 'In Progress'], ['DONE', 'Done']];

export default function KanbanBoard({ elements, updateElements, members, user, disabled = false }) {
  const tasks = elements.filter(item => item.kind === 'kanban-task');
  const [drafts, setDrafts] = useState({});

  const addTask = status => {
    if (disabled) return;
    const title = (drafts[status] || '').trim();
    if (!title) return;
    updateElements([...elements, { id: crypto.randomUUID(), kind: 'kanban-task', title, description: '', status, assigneeId: '', assigneeName: '' }]);
    setDrafts(current => ({ ...current, [status]: '' }));
  };

  const updateTask = (id, patch) => updateElements(elements.map(item => item.id === id ? { ...item, ...patch } : item));
  const dropTask = (event, status) => {
    event.preventDefault();
    if (disabled) return;
    const id = event.dataTransfer.getData('text/plain');
    if (id) updateTask(id, { status });
  };
  const assign = (task, value) => {
    const member = members.find(candidate => candidate.userId === value) || (user.id === value ? user : null);
    updateTask(task.id, { assigneeId: member?.userId || '', assigneeName: member?.name || '' });
  };

  return <section className="kanban-board" aria-label="Kanban task board">
    {COLUMNS.map(([status, label]) => <div key={status} className={`kanban-column column-${status.toLowerCase()}`} onDragOver={event => event.preventDefault()} onDrop={event => dropTask(event, status)}>
      <header className="kanban-column-header"><h2>{label}</h2><span>{tasks.filter(task => task.status === status).length}</span></header>
      <form className="kanban-add-form" onSubmit={event => { event.preventDefault(); addTask(status); }}>
        <input disabled={disabled} aria-label={`New task for ${label}`} placeholder="Add a task…" value={drafts[status] || ''} onChange={event => setDrafts(current => ({ ...current, [status]: event.target.value }))} />
        <button type="submit" aria-label={`Add task to ${label}`} disabled={disabled || !(drafts[status] || '').trim()}>＋</button>
      </form>
      <div className="kanban-task-list">
        {tasks.filter(task => task.status === status).map(task => <article key={task.id} className="kanban-task" draggable={!disabled} onDragStart={event => { if(disabled)return;event.dataTransfer.setData('text/plain', task.id); event.dataTransfer.effectAllowed = 'move'; }}>
          <div className="kanban-task-top"><input disabled={disabled} className="kanban-task-title" aria-label="Task title" value={task.title} onChange={event => updateTask(task.id, { title: event.target.value })} /><button type="button" disabled={disabled} aria-label={`Delete task ${task.title}`} onClick={() => updateElements(elements.filter(item => item.id !== task.id))}>×</button></div>
          <textarea disabled={disabled} aria-label={`Description for ${task.title}`} placeholder="Add a description…" value={task.description || ''} onChange={event => updateTask(task.id, { description: event.target.value })} />
          <label className="kanban-assignee"><span>Assign to</span><select disabled={disabled} aria-label={`Assignee for ${task.title}`} value={task.assigneeId || ''} onChange={event => assign(task, event.target.value)}><option value="">Unassigned</option>{user?.id && <option value={user.id}>{user.name} (you)</option>}{members.filter(member => member.userId !== user?.id).map(member => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
        </article>)}
        {!tasks.some(task => task.status === status) && <p className="kanban-drop-hint">Drop tasks here</p>}
      </div>
    </div>)}
  </section>;
}
