import { useState } from 'react';
import type { MnxDocument } from '@polyhymnia/mnx';
import type { LayoutResult } from '@polyhymnia/notation-engine';
import { FontNotation } from './font.js';

export function MarksExample({ score, onLayout }: { score: MnxDocument; onLayout: (layout: LayoutResult) => void }) {
  const [selected, setSelected] = useState<string>();
  const [description, setDescription] = useState(
    'Click a note, articulation, fermata, dynamic or hairpin. You can also use Tab and Enter.',
  );
  return (
    <>
      <FontNotation score={score} onLayout={onLayout}>
        <FontNotation.Interaction
          targets={['element']}
          onIntent={(intent) => {
            if (intent.type !== 'activate' || intent.target.kind !== 'element') return;
            setSelected(intent.target.id);
            setDescription(`${intent.target.box.label} (${intent.target.part})`);
          }}
        />
        <FontNotation.Marks selection={selected ? [selected] : []} />
      </FontNotation>
      <p className="caption" aria-live="polite">
        {description}
      </p>
    </>
  );
}
