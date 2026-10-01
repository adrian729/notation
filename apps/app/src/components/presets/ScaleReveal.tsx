import { useMemo } from 'react';
import type { JSX } from 'react';
import type { NoteValue } from '@polyhymnia/mnx';
import { parsePitch, scalePitches, type ScaleName } from '@polyhymnia/music-theory';
import type { ClefSpec } from '@polyhymnia/notation-engine';
import { Notation } from '@polyhymnia/notation-react';
import { durationKey, fittingMeter, scaleKey } from '@/components/presets/shared';
import type { RevealBaseProps } from '@/components/presets/shared';
import { buildMeasureScore, noteEventFromPitch } from '@/components/presets/mnxBuild';

export type { ScaleName } from '@polyhymnia/music-theory';

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
  glyphStyle,
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

  const options = useMemo(() => ({ style: glyphStyle }), [glyphStyle]);

  return <Notation score={doc} options={options} className={className} style={style} onLayout={onLayout} />;
}
