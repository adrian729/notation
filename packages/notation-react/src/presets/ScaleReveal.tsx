import { useMemo } from 'react';
import type { JSX } from 'react';
import { parsePitch } from '@polyhymnia/notation-model';
import type { NoteValue } from '@polyhymnia/notation-model';
import type { ClefSpec } from '@polyhymnia/notation-engine';
import { Notation } from '../Notation.js';
import { durationKey, fittingMeter, scaleKey, scalePitches } from './shared.js';
import type { RevealBaseProps, ScaleName } from './shared.js';
import { buildMeasureScore, noteEventFromPitch } from './mnxBuild.js';

export type { ScaleName } from './shared.js';

const QUARTER: NoteValue = { base: 'quarter' };

export interface ScaleRevealProps extends RevealBaseProps {
  root: string;
  scale: ScaleName;
  clef: ClefSpec['kind'];
  descending?: boolean;
  duration?: NoteValue;
}

export function ScaleReveal({
  root,
  scale,
  clef,
  descending = false,
  duration = QUARTER,
  font,
  className,
  style,
  onLayout,
}: ScaleRevealProps): JSX.Element {
  const doc = useMemo(() => {
    const rootPitch = parsePitch(root);
    const pitches = scalePitches(rootPitch, scale, descending);
    return buildMeasureScore(
      clef,
      fittingMeter(duration, pitches.length),
      pitches.map((p) => noteEventFromPitch(p, duration)),
      scaleKey(rootPitch, scale).fifths,
    );
  }, [root, scale, clef, descending, durationKey(duration)]);

  const options = useMemo(() => ({ font }), [font]);

  return <Notation score={doc} options={options} className={className} style={style} onLayout={onLayout} />;
}
