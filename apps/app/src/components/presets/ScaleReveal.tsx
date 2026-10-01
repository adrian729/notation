import { useMemo } from 'react';
import type { JSX } from 'react';
import { parsePitch } from '@polyhymnia/mnx';
import type { NoteValue } from '@polyhymnia/mnx';
import type { ClefSpec } from '@polyhymnia/notation-engine';
import { Notation } from '@polyhymnia/notation-react';
import { durationKey, fittingMeter, scaleKey, scalePitches } from '@/components/presets/shared';
import type { RevealBaseProps, ScaleName } from '@/components/presets/shared';
import { buildMeasureScore, noteEventFromPitch } from '@/components/presets/mnxBuild';

export type { ScaleName } from '@/components/presets/shared';

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
