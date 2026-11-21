import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBoard } from './useBoard.js';

describe('useBoard history', () => {
  it('undoes and redoes element updates', () => {
    const { result } = renderHook(() => useBoard([]));
    const shape = { id: 'shape-1', kind: 'rect' };
    act(() => result.current.setElements([shape]));
    expect(result.current.elements).toEqual([shape]);
    act(() => result.current.undo());
    expect(result.current.elements).toEqual([]);
    act(() => result.current.redo());
    expect(result.current.elements).toEqual([shape]);
  });
});
