function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Record<string, any> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}

function cleanNote(note: unknown, tieStaleIds: ReadonlySet<string>): unknown {
  const obj = asObject(note);
  if (!obj || !Array.isArray(obj.ties)) return note;
  const ties = obj.ties.filter((t: unknown) => {
    const target = asObject(t)?.target;
    return typeof target !== 'string' || !tieStaleIds.has(target);
  });
  if (ties.length === obj.ties.length) return note;
  return { ...obj, ties };
}

function cleanEvent(
  event: Record<string, any>,
  tieStaleIds: ReadonlySet<string>,
  slurGoneIds: ReadonlySet<string>,
): Record<string, any> {
  let next = event;
  if (Array.isArray(event.notes)) {
    let changed = false;
    const notes = event.notes.map((n: unknown) => {
      const cleaned = cleanNote(n, tieStaleIds);
      if (cleaned !== n) changed = true;
      return cleaned;
    });
    if (changed) next = { ...next, notes };
  }
  if (Array.isArray(event.slurs)) {
    const slurs = event.slurs.filter((raw: unknown) => {
      const s = asObject(raw);
      if (!s) return true;
      if (typeof s.target === 'string' && slurGoneIds.has(s.target)) return false;
      if (typeof s.startNote === 'string' && slurGoneIds.has(s.startNote)) return false;
      if (typeof s.endNote === 'string' && slurGoneIds.has(s.endNote)) return false;
      return true;
    });
    if (slurs.length !== event.slurs.length) next = { ...next, slurs };
  }
  return next;
}

function cleanContent(
  content: readonly unknown[],
  tieStaleIds: ReadonlySet<string>,
  slurGoneIds: ReadonlySet<string>,
): readonly unknown[] {
  let changed = false;
  const out = content.map((raw) => {
    const item = asObject(raw);
    if (!item) return raw;
    if (item.type === 'tuplet' && Array.isArray(item.content)) {
      const inner = cleanContent(item.content, tieStaleIds, slurGoneIds);
      if (inner === item.content) return raw;
      changed = true;
      return { ...item, content: inner };
    }
    if (item.type === undefined || item.type === 'event') {
      const cleaned = cleanEvent(item, tieStaleIds, slurGoneIds);
      if (cleaned === item) return raw;
      changed = true;
      return cleaned;
    }
    return raw;
  });
  return changed ? out : content;
}

export function cleanupPartMeasure(
  pm: unknown,
  tieStaleIds: ReadonlySet<string>,
  slurGoneIds: ReadonlySet<string>,
): unknown {
  if (tieStaleIds.size === 0 && slurGoneIds.size === 0) return pm;
  const measure = asObject(pm);
  if (!measure || !Array.isArray(measure.sequences)) return pm;
  let changed = false;
  const sequences = measure.sequences.map((raw: unknown) => {
    const sequence = asObject(raw);
    if (!sequence || !Array.isArray(sequence.content)) return raw;
    const content = cleanContent(sequence.content, tieStaleIds, slurGoneIds);
    if (content === sequence.content) return raw;
    changed = true;
    return { ...sequence, content };
  });
  return changed ? { ...measure, sequences } : pm;
}
