export function elementDelta(base = [], next = []) {
  const before = new Map(base.map(item => [item.id, item]));
  const after = new Map(next.map(item => [item.id, item]));
  return {
    upserts: [...after.values()].filter(item => JSON.stringify(before.get(item.id)) !== JSON.stringify(item)),
    removedIds: [...before.keys()].filter(id => !after.has(id)),
  };
}

export function overlayLocalChanges(base, local, remote) {
  const delta = elementDelta(base, local);
  const merged = new Map(remote.map(item => [item.id, item]));
  delta.removedIds.forEach(id => merged.delete(id));
  delta.upserts.forEach(item => merged.set(item.id, item));
  return [...merged.values()];
}
