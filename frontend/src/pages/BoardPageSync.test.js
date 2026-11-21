import { describe, expect, it } from 'vitest';
import { elementDelta, overlayLocalChanges } from './boardSync.js';

describe('board element synchronization', () => {
  it('sends only additions, updates, and removals', () => {
    const base = [{ id: 'keep', kind: 'rect' }, { id: 'edit', kind: 'text', text: 'old' }, { id: 'remove', kind: 'circle' }];
    const next = [{ id: 'keep', kind: 'rect' }, { id: 'edit', kind: 'text', text: 'new' }, { id: 'add', kind: 'sticky' }];
    expect(elementDelta(base, next)).toEqual({ upserts: [next[1], next[2]], removedIds: ['remove'] });
  });

  it('preserves unsaved local edits while applying remote changes to other elements', () => {
    const base = [{ id: 'local', kind: 'text', text: 'before' }, { id: 'shared', kind: 'rect' }];
    const local = [{ id: 'local', kind: 'text', text: 'my draft' }, { id: 'shared', kind: 'rect' }];
    const remote = [{ id: 'local', kind: 'text', text: 'before' }, { id: 'shared', kind: 'rect' }, { id: 'peer', kind: 'arrow' }];
    expect(overlayLocalChanges(base, local, remote)).toEqual([
      { id: 'local', kind: 'text', text: 'my draft' },
      { id: 'shared', kind: 'rect' },
      { id: 'peer', kind: 'arrow' },
    ]);
  });
});
