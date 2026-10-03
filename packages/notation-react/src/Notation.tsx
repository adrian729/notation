import { Children, isValidElement, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import type {
  CSSProperties,
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  Ref,
} from 'react';
import {
  DEFAULT_FONTS,
  DEFAULT_STYLE,
  HIT_STAFF_MARGIN,
  hitTest,
  positionAtTick,
  previewShapes,
} from '@polyhymnia/notation-engine';
import { performance } from '@polyhymnia/mnx-score';
import type { Performance, Timeline } from '@polyhymnia/mnx-score';
import { fontFaceCss } from '@polyhymnia/notation-fonts';
import type { GlyphStyleName, NotationFont } from '@polyhymnia/notation-fonts';
import type {
  ElementBox,
  GlyphRun,
  HitResult,
  LayoutResult,
  NotationOptions,
  RectShape,
  ViewBox,
} from '@polyhymnia/notation-engine';
import type { MnxDocument, NoteId } from '@polyhymnia/mnx';
import { InteractionChild, clientToLayoutPoint, hitIdentity, resolveHitOptions } from './Interaction.js';
import type { NotationInteractionProps, NotationIntent } from './Interaction.js';
import { memoLayout } from './layoutMemo.js';
import { MarksChild } from './Marks.js';
import type { NotationMarksProps } from './Marks.js';

export type PlaybackView =
  | { mode: 'off' }
  | { mode: 'notes'; activeIds: readonly string[] }
  | {
      mode: 'cursor';
      position?: { tick: number } | { seconds: number };
      highlightActive?: boolean;
    }
  | { mode: 'manual' };

export interface NotationPlaybackProps {
  view: PlaybackView;
}

function PlaybackChild(_props: NotationPlaybackProps): null {
  return null;
}

export interface NotationHandle {
  getLayout(): LayoutResult;
  getTimeline(): Timeline;
  exportSVG(): string;
  setPlaybackTick(tick: number): void;
  focus(id: NoteId): void;
}

export interface NotationProps {
  score: MnxDocument;
  options?: NotationOptions;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onLayout?: (layout: LayoutResult) => void;
  ref?: Ref<NotationHandle>;
}

const GLYPH_FONT_SIZE = 4;
const CURSOR_WIDTH = 0.3;

export function Notation({ score, options, children, className, style, onLayout, ref }: NotationProps): JSX.Element {
  const layout = useMemo(() => memoLayout(score, options), [score, options]);
  const customFonts = customFontsOf(options?.font);
  const glyphStyle: GlyphStyleName = options?.style ?? DEFAULT_STYLE;
  const fontFamily = customFonts?.[0]?.name ?? DEFAULT_FONTS[glyphStyle].name;
  const fontCss = useMemo(() => (customFonts ? fontFaceCss(customFonts) : undefined), [options?.font]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const elementRefs = useRef(new Map<string, SVGGElement>());
  const cursorRef = useRef<SVGGElement | null>(null);
  const lastHoverRef = useRef<string | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerEventRef = useRef<MouseEvent | null>(null);
  const playbackView = extractChildProps<NotationPlaybackProps>(children, PlaybackChild)?.view;
  const imperativeTickRef = useRef<number | null>(null);
  const viewRef = useRef<PlaybackView | undefined>(playbackView);
  viewRef.current = playbackView;
  const interaction = extractChildProps<NotationInteractionProps>(children, InteractionChild);
  const marks = extractChildProps<NotationMarksProps>(children, MarksChild);
  const targets = interaction?.targets ?? EMPTY_TARGETS;

  useEffect(() => {
    onLayout?.(layout);
  }, [layout, onLayout]);

  const playbackMode = playbackView?.mode;

  useLayoutEffect(() => {
    imperativeTickRef.current = null;
  }, [layout, playbackMode]);

  useLayoutEffect(() => {
    const view = playbackView;
    const tick = imperativeTickRef.current;
    if (view?.mode === 'notes') setPlaying(elementRefs.current, new Set(view.activeIds), layout);
    else if (view?.mode === 'off') setPlaying(elementRefs.current, EMPTY_IDS, layout);
    else if (view === undefined && tick === null) setPlaying(elementRefs.current, EMPTY_IDS, layout);
    else {
      const at = tick ?? (view?.mode === 'cursor' ? declaredTick(layout.timeline, view.position) : 0);
      if (view?.mode === 'cursor' && !view.highlightActive) setPlaying(elementRefs.current, EMPTY_IDS, layout);
      applyTick(view, at, layout, elementRefs.current, cursorRef.current);
    }
  }, [playbackView, layout]);

  useEffect(() => {
    setStates(elementRefs.current, marks?.states);
    setSelection(elementRefs.current, marks?.selection);
  }, [marks?.states, marks?.selection, layout]);

  const notifyHover = (hit: HitResult | null, nativeEvent: MouseEvent): void => {
    if (!interaction?.onIntent || targets.length === 0) return;
    lastHoverRef.current = hit ? hitIdentity(hit) : null;
    interaction.onIntent({ type: 'hover', target: hit }, { layout, nativeEvent });
  };

  useEffect(() => {
    if (!interaction?.onIntent || lastHoverRef.current === null) return;
    const pointer = lastPointerRef.current;
    const point = pointer && svgRef.current ? clientToLayoutPoint(svgRef.current, pointer.x, pointer.y) : null;
    const hit = point ? hitTest(layout, point, resolveHitOptions(interaction, options)) : null;
    notifyHover(hit, lastPointerEventRef.current ?? new MouseEvent('pointermove'));
  }, [layout]);

  useImperativeHandle(
    ref,
    (): NotationHandle => ({
      getLayout: () => layout,
      getTimeline: () => layout.timeline,
      exportSVG: () => serialize(svgRef.current),
      setPlaybackTick: (tick) => {
        const view = viewRef.current;
        if (view?.mode === 'notes' || view?.mode === 'off') return;
        imperativeTickRef.current = tick;
        applyTick(view, tick, layout, elementRefs.current, cursorRef.current);
      },
      focus: (id) => elementRefs.current.get(id)?.focus(),
    }),
    [layout],
  );

  const handleClick = (event: ReactMouseEvent<SVGSVGElement>): void => {
    if (!interaction?.onIntent || targets.length === 0 || !svgRef.current) return;
    const point = clientToLayoutPoint(svgRef.current, event.clientX, event.clientY);
    if (!point) return;
    const hit = hitTest(layout, point, resolveHitOptions(interaction, options));
    if (hit) {
      interaction.onIntent({ type: 'activate', target: hit }, { layout, nativeEvent: event.nativeEvent });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>): void => {
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    lastPointerEventRef.current = event.nativeEvent;
    if (!interaction?.onIntent || targets.length === 0 || !svgRef.current) return;
    const point = clientToLayoutPoint(svgRef.current, event.clientX, event.clientY);
    const hit = point ? hitTest(layout, point, resolveHitOptions(interaction, options)) : null;
    const identity = hit ? hitIdentity(hit) : null;
    if (identity === lastHoverRef.current) return;
    notifyHover(hit, event.nativeEvent);
  };

  const handlePointerLeave = (event: ReactPointerEvent<SVGSVGElement>): void => {
    lastPointerRef.current = null;
    if (!interaction?.onIntent || lastHoverRef.current === null) return;
    lastHoverRef.current = null;
    interaction.onIntent({ type: 'hover', target: null }, { layout, nativeEvent: event.nativeEvent });
  };

  const isElementKeyboardTarget = (id: string): boolean =>
    targets.includes('element') &&
    layout.elements[id] !== undefined &&
    (interaction?.voice === undefined ||
      !layout.elements[id]?.eventId ||
      layout.elements[id]?.voice === interaction.voice);

  const handleElementKeyDown =
    (id: NoteId) =>
    (event: ReactKeyboardEvent<SVGGElement>): void => {
      if (!interaction?.onIntent || !isElementKeyboardTarget(id)) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const box = layout.elements[id];
      if (!box) return;
      event.preventDefault();
      const center = { x: box.hitBox.x + box.hitBox.w / 2, y: box.hitBox.y + box.hitBox.h / 2 };
      const hit = hitTest(layout, center, { ...resolveHitOptions(interaction, options), kinds: ['element'] });
      if (hit) interaction.onIntent({ type: 'activate', target: hit }, { layout, nativeEvent: event.nativeEvent });
    };

  return (
    <>
      {fontCss !== undefined && (
        <style href={`pn-fonts:${fontCss}`} precedence="pn-fonts">
          {fontCss}
        </style>
      )}
      <svg
        ref={svgRef}
        className={classNames('pn-notation', className)}
        data-pn-style={glyphStyle}
        style={style}
        viewBox={viewBoxAttr(layout.viewBox)}
        role="img"
        aria-label={describeScore(layout)}
        data-pn-interactive={targets.length > 0 ? '' : undefined}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <g data-pn="rules">
          {layout.rects.map((r, i) => (
            <Rect key={`r${i}`} shape={r} />
          ))}
        </g>
        {targets.length > 0 && (
          <g data-pn="hit-overlays">
            {layout.systems.map((s) => (
              <rect
                key={`hit-${s.index}`}
                data-pn="hit-overlay"
                x={s.x}
                y={s.y - HIT_STAFF_MARGIN}
                width={s.w}
                height={s.h + HIT_STAFF_MARGIN * 2}
                fill="transparent"
                pointerEvents="all"
              />
            ))}
          </g>
        )}
        <g data-pn="curves">
          {layout.paths.map((p, i) => {
            const shape = <path d={p.d} data-pn={p.cls} data-pn-el={p.el} fill="currentColor" stroke="none" />;
            return p.el && layout.elements[p.el] ? (
              <g
                key={`p${i}`}
                ref={elementRef(elementRefs.current, p.el)}
                data-pn="element"
                data-pn-el={p.el}
                role={isElementKeyboardTarget(p.el) ? 'button' : 'img'}
                tabIndex={isElementKeyboardTarget(p.el) ? 0 : undefined}
                aria-label={layout.elements[p.el]!.label}
                onKeyDown={isElementKeyboardTarget(p.el) ? handleElementKeyDown(p.el) : undefined}
              >
                {shape}
              </g>
            ) : (
              <path key={`p${i}`} d={p.d} data-pn={p.cls} data-pn-el={p.el} fill="currentColor" stroke="none" />
            );
          })}
        </g>
        <g data-pn="glyphs" fontSize={GLYPH_FONT_SIZE} fontFamily={fontFamily}>
          {groupGlyphs(layout.glyphs).map((group, i) =>
            group.el === undefined ? (
              group.glyphs.map((g, j) => (
                <Glyph key={`g${i}-${j}`} glyph={g} fonts={layout.fonts} primary={fontFamily} />
              ))
            ) : (
              <g
                key={group.el}
                ref={elementRef(elementRefs.current, group.el)}
                role={isElementKeyboardTarget(group.el) ? 'button' : 'img'}
                tabIndex={isElementKeyboardTarget(group.el) ? 0 : undefined}
                aria-label={layout.elements[group.el]?.label ?? group.el}
                data-pn="element"
                data-pn-el={group.el}
                onKeyDown={isElementKeyboardTarget(group.el) ? handleElementKeyDown(group.el) : undefined}
              >
                {group.glyphs.map((g, j) => (
                  <Glyph key={`g${i}-${j}`} glyph={g} fonts={layout.fonts} primary={fontFamily} />
                ))}
              </g>
            ),
          )}
        </g>
        {playbackView?.mode === 'cursor' && (
          <CursorGroup groupRef={cursorRef} layout={layout} position={playbackView.position} />
        )}
        {marks?.preview != null && (
          <PreviewGroup layout={layout} preview={marks.preview} fontFamily={fontFamily} options={options} />
        )}
        {children}
      </svg>
    </>
  );
}

export namespace Notation {
  export const Playback = PlaybackChild;
  export const Interaction = InteractionChild;
  export const Marks = MarksChild;
}

const performances = new WeakMap<Timeline, Performance>();

function performanceOf(timeline: Timeline): Performance {
  let performed = performances.get(timeline);
  if (!performed) {
    performed = performance(timeline);
    performances.set(timeline, performed);
  }
  return performed;
}

function declaredTick(timeline: Timeline, position: { tick: number } | { seconds: number } | undefined): number {
  if (!position) return 0;
  return 'tick' in position ? position.tick : performanceOf(timeline).tickAtSeconds(position.seconds);
}

function applyTick(
  view: PlaybackView | undefined,
  tick: number,
  layout: LayoutResult,
  refs: Map<string, SVGGElement>,
  cursorGroup: SVGGElement | null,
): void {
  if (view?.mode === 'cursor') {
    placeCursor(cursorGroup, layout, tick);
    if (view.highlightActive) setPlaying(refs, new Set(layout.timeline.activeAt(tick)), layout);
  } else {
    setPlaying(refs, new Set(layout.timeline.activeAt(tick)), layout);
  }
}

function CursorGroup({
  groupRef,
  layout,
  position,
}: {
  groupRef: Ref<SVGGElement>;
  layout: LayoutResult;
  position: { tick: number } | { seconds: number } | undefined;
}): JSX.Element {
  const pos = positionAtTick(layout, declaredTick(layout.timeline, position));
  return (
    <g
      ref={groupRef}
      data-pn="cursor"
      data-pn-cursor=""
      data-pn-system={pos ? pos.systemIndex : undefined}
      pointerEvents="none"
      visibility={pos ? 'visible' : 'hidden'}
    >
      <rect
        width={CURSOR_WIDTH}
        x={pos ? pos.x - CURSOR_WIDTH / 2 : undefined}
        y={pos?.yTop}
        height={pos ? pos.yBottom - pos.yTop : undefined}
      />
    </g>
  );
}

function PreviewGroup({
  layout,
  preview,
  fontFamily,
  options,
}: {
  layout: LayoutResult;
  preview: NonNullable<NotationMarksProps['preview']>;
  fontFamily: string;
  options: NotationOptions | undefined;
}): JSX.Element {
  const { glyphs, rects } = previewShapes(layout, preview, { font: options?.font, style: options?.style });
  return (
    <g data-pn="preview" fontSize={GLYPH_FONT_SIZE} fontFamily={fontFamily}>
      {rects.map((r, i) => (
        <Rect key={`pr${i}`} shape={r} />
      ))}
      {glyphs.map((g, i) => (
        <Glyph key={`pg${i}`} glyph={g} fonts={layout.fonts} primary={fontFamily} />
      ))}
    </g>
  );
}

function Rect({ shape }: { shape: RectShape }): JSX.Element {
  if (shape.outline) {
    return (
      <path
        d={shape.outline}
        transform={shape.rot ? `rotate(${shape.rot} ${shape.x} ${shape.y})` : undefined}
        data-pn={shape.cls}
        data-pn-el={shape.el}
        fill="currentColor"
        stroke="none"
      />
    );
  }
  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={shape.w}
      height={shape.h}
      transform={shape.rot ? `rotate(${shape.rot} ${shape.x} ${shape.y})` : undefined}
      data-pn={shape.cls}
      data-pn-el={shape.el}
      fill="currentColor"
      stroke="none"
    />
  );
}

function customFontsOf(font: NotationOptions['font']): readonly NotationFont[] | undefined {
  if (font === undefined) return undefined;
  const list: readonly NotationFont[] = Array.isArray(font) ? font : [font as NotationFont];
  return list.length > 0 ? list : undefined;
}

function Glyph({
  glyph,
  fonts,
  primary,
}: {
  glyph: GlyphRun;
  fonts: readonly string[] | undefined;
  primary: string;
}): JSX.Element {
  const family = glyph.font === undefined ? undefined : fonts?.[glyph.font];
  return (
    <text
      x={glyph.x}
      y={glyph.y}
      fontSize={glyph.scale !== undefined ? GLYPH_FONT_SIZE * glyph.scale : undefined}
      transform={
        glyph.scaleY !== undefined
          ? `translate(${glyph.x} ${glyph.y}) scale(1 ${glyph.scaleY}) translate(${-glyph.x} ${-glyph.y})`
          : undefined
      }
      fontFamily={family !== undefined && family !== primary ? family : undefined}
      data-pn={glyph.cls}
      data-pn-el={glyph.el}
      fill="currentColor"
      stroke="none"
    >
      {String.fromCodePoint(glyph.cp)}
    </text>
  );
}

interface GlyphGroup {
  el: string | undefined;
  glyphs: GlyphRun[];
}

function groupGlyphs(glyphs: readonly GlyphRun[]): GlyphGroup[] {
  const groups: GlyphGroup[] = [];
  for (const g of glyphs) {
    const last = groups[groups.length - 1];
    if (last && last.el === g.el) last.glyphs.push(g);
    else groups.push({ el: g.el, glyphs: [g] });
  }
  return groups;
}

export function viewBoxAttr(vb: ViewBox): string {
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
}

export function describeScore(layout: LayoutResult): string {
  const boxes: ElementBox[] = Object.values(layout.elements);
  const notes = boxes.filter((b) => b.kind === 'note' || b.kind === 'chord' || b.kind === 'grace').length;
  const rests = boxes.filter((b) => b.kind === 'rest').length;
  const measures = layout.timeline.measures.length;
  return `Music notation: ${count(measures, 'measure')}, ${count(notes, 'note')}, ${count(rests, 'rest')}`;
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

function classNames(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const EMPTY_IDS: ReadonlySet<string> = new Set();
const EMPTY_TARGETS: readonly [] = [];

function extractChildProps<P>(children: ReactNode, type: (props: P) => unknown): P | undefined {
  let props: P | undefined;
  Children.forEach(children, (child) => {
    if (isValidElement<P>(child) && child.type === type) props = child.props;
  });
  return props;
}

function setStates(refs: Map<string, SVGGElement>, states: NotationMarksProps['states'] | undefined): void {
  for (const [id, el] of refs) {
    const value = states?.[id];
    if (value !== undefined) el.setAttribute('data-pn-state', value);
    else el.removeAttribute('data-pn-state');
  }
}

function setSelection(refs: Map<string, SVGGElement>, selection: NotationMarksProps['selection'] | undefined): void {
  const set = selection ? new Set(selection) : EMPTY_IDS;
  for (const [id, el] of refs) {
    if (set.has(id)) el.setAttribute('data-pn-selected', 'true');
    else el.removeAttribute('data-pn-selected');
  }
}

function elementRef(refs: Map<string, SVGGElement>, id: string) {
  return (el: SVGGElement | null): void => {
    if (el) refs.set(id, el);
    else refs.delete(id);
  };
}

function setPlaying(refs: Map<string, SVGGElement>, ids: ReadonlySet<string>, layout: LayoutResult): void {
  for (const [id, el] of refs) {
    const owner = layout.elements[id]?.eventId;
    const playing =
      ids.has(id) ||
      (owner !== undefined && (ids.has(owner) || layout.timeline.byId(owner)?.notes.some((n) => ids.has(n.id))));
    if (playing) el.setAttribute('data-pn-playing', 'true');
    else el.removeAttribute('data-pn-playing');
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function serialize(svg: SVGSVGElement | null): string {
  if (!svg) throw new Error('exportSVG(): the component is not mounted.');
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  return new XMLSerializer().serializeToString(clone);
}

function placeCursor(group: SVGGElement | null, layout: LayoutResult, tick: number): void {
  if (!group) return;
  const pos = positionAtTick(layout, tick);
  const rect = group.firstElementChild;
  if (!pos || !rect) {
    group.setAttribute('visibility', 'hidden');
    return;
  }
  rect.setAttribute('x', String(pos.x - CURSOR_WIDTH / 2));
  rect.setAttribute('y', String(pos.yTop));
  rect.setAttribute('height', String(pos.yBottom - pos.yTop));
  group.setAttribute('data-pn-system', String(pos.systemIndex));
  group.setAttribute('visibility', 'visible');
}
