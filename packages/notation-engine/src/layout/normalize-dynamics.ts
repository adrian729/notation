import { positionTick, type Timeline } from '@polyhymnia/mnx-score';
import type { DynamicPlacement, NormalizedDynamic, NormalizedHairpin } from './records.js';
import { asObject, markingId, type Reader } from './normalize-reader.js';

const VALUES = new Set([
  'pppppp',
  'ppppp',
  'pppp',
  'ppp',
  'pp',
  'p',
  'mp',
  'mf',
  'f',
  'ff',
  'fff',
  'ffff',
  'fffff',
  'ffffff',
  'n',
]);

const PLACEMENTS = new Set<unknown>(['above', 'below', 'between', 'auto']);

export interface DynamicsContext {
  timeline: Timeline;
  reader: Reader;
  staffCount: number;
  measureIndexById: ReadonlyMap<string, number>;
}

export function readDynamics(
  entries: readonly unknown[],
  measureIndex: number,
  ctx: DynamicsContext,
): NormalizedDynamic[] {
  const { reader } = ctx;
  const dynamics: NormalizedDynamic[] = [];
  entries.forEach((raw, k) => {
    const dynamic = asObject(raw);
    if (!dynamic) return;
    const type = dynamic.type;
    if (type === 'relative') {
      reader.unsupported('relative dynamic', measureIndex, 'not drawn');
      return;
    }
    if (type !== 'immediate' && type !== 'accent' && type !== 'gradual') {
      reader.unsupported(`dynamic of type ${JSON.stringify(type)}`, measureIndex, 'not drawn');
      return;
    }
    const staffIndex = staffIndexOf(dynamic.staff, measureIndex, ctx);
    if (staffIndex === null) return;
    reportDynamicConstructs(dynamic, measureIndex, reader);
    const tick = positionOf(dynamic.position, measureIndex, ctx);
    if (tick === null) return;

    const text = textOf(dynamic, measureIndex, reader);
    const hairpin = type === 'gradual' ? hairpinOf(dynamic, tick, measureIndex, ctx) : undefined;
    if (text === undefined && hairpin === undefined) return;
    dynamics.push({
      id: markingId(dynamic.id, `m${measureIndex}.dyn${k}`, measureIndex, reader),
      measureIndex,
      tick,
      ...(staffIndex !== undefined ? { staffIndex } : {}),
      placement: placementOf(dynamic.placement, measureIndex, ctx),
      ...(text !== undefined ? { text } : {}),
      ...(hairpin ? { hairpin } : {}),
    });
  });
  return dynamics;
}

function staffIndexOf(staff: unknown, measureIndex: number, ctx: DynamicsContext): number | undefined | null {
  if (staff === undefined) return undefined;
  if (typeof staff === 'number' && Number.isInteger(staff) && staff >= 1 && staff <= ctx.staffCount) return staff - 1;
  ctx.reader.unsupported(`dynamic on staff ${String(staff)}`, measureIndex, 'not drawn');
  return null;
}

function reportDynamicConstructs(dynamic: Record<string, unknown>, measureIndex: number, reader: Reader): void {
  if (dynamic.prefix !== undefined || dynamic.suffix !== undefined) {
    reader.unsupported('dynamic prefix or suffix text', measureIndex, 'the text is not drawn');
  }
  if (dynamic.glyphs !== undefined) reader.unsupported('dynamic glyphs', measureIndex, 'drawn from its value');
  if (dynamic.visuallyContinues !== undefined) {
    reader.unsupported('dynamic visuallyContinues', measureIndex, 'drawn as a separate dynamic');
  }
  if (dynamic.staffEnd !== undefined && dynamic.staffEnd !== dynamic.staff) {
    reader.unsupported('cross-staff hairpin', measureIndex, 'drawn on one staff');
  }
}

function positionOf(position: unknown, measureIndex: number, ctx: DynamicsContext): number | null {
  if (asObject(position)?.graceIndex !== undefined) {
    ctx.reader.unsupported('graceIndex in a dynamic position', measureIndex, 'grace positioning ignored');
  }
  const { tick, measureTick, diagnostic } = positionTick(ctx.timeline, measureIndex, position);
  if (!diagnostic) return tick;
  ctx.reader.diagnostics.push(diagnostic);
  return measureTick === 0 ? null : tick;
}

function placementOf(placement: unknown, measureIndex: number, ctx: DynamicsContext): DynamicPlacement {
  if (!PLACEMENTS.has(placement)) return 'auto';
  if (placement === 'between' && ctx.staffCount === 1) {
    ctx.reader.unsupported('dynamic placed between staves of a single staff', measureIndex, 'drawn below the staff');
    return 'auto';
  }
  return placement as DynamicPlacement;
}

function valueOf(value: unknown, measureIndex: number, reader: Reader): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string' && VALUES.has(value)) return value;
  reader.unsupported(`dynamic value ${JSON.stringify(value)}`, measureIndex, 'not drawn');
  return undefined;
}

function textOf(dynamic: Record<string, unknown>, measureIndex: number, reader: Reader): string | undefined {
  const value = valueOf(dynamic.value, measureIndex, reader);
  if (value === undefined || dynamic.type !== 'accent') return value;
  const prefix = dynamic.accentPrefix === 'r' || dynamic.accentPrefix === '' ? dynamic.accentPrefix : 's';
  const suffix = dynamic.accentSuffix === '' ? '' : 'z';
  return `${prefix}${value}${suffix}${valueOf(dynamic.residualValue, measureIndex, reader) ?? ''}`;
}

function hairpinOf(
  dynamic: Record<string, unknown>,
  tick: number,
  measureIndex: number,
  ctx: DynamicsContext,
): NormalizedHairpin | undefined {
  const wedge = dynamic.wedgeType;
  const end = asObject(dynamic.end);
  const endIndex = typeof end?.measure === 'string' ? ctx.measureIndexById.get(end.measure) : undefined;
  const endPosition = endIndex === undefined ? undefined : positionTick(ctx.timeline, endIndex, end?.position);
  if (endPosition?.diagnostic) ctx.reader.diagnostics.push(endPosition.diagnostic);
  if ((wedge === 'increasing' || wedge === 'decreasing') && endPosition && endPosition.tick > tick) {
    return { wedge, endTick: endPosition.tick };
  }
  ctx.reader.diagnostics.push({
    severity: 'warning',
    code: 'hairpin-end-unresolved',
    message: `Measure ${measureIndex}: hairpin with wedge ${JSON.stringify(wedge)} ends at ${JSON.stringify(dynamic.end)}, which is not a later position in a global measure; not drawn.`,
    measureIndex,
  });
  return undefined;
}
