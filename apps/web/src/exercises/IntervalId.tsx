import { useCallback, useEffect, useState } from 'react';
import { NotesReveal } from '@polyhymnia/notation-react/presets';
import { melodic } from '@polyhymnia/audio';
import { createSound } from '../sound.js';

interface Question {
  label: string;
  from: string;
  to: string;
}

const QUESTIONS: readonly Question[] = [
  { label: 'Minor 3rd', from: 'C4', to: 'Eb4' },
  { label: 'Major 3rd', from: 'C4', to: 'E4' },
  { label: 'Perfect 4th', from: 'C4', to: 'F4' },
  { label: 'Perfect 5th', from: 'C4', to: 'G4' },
];

const PROMPT = 'Press "Play", then click the interval you heard.';

export function IntervalId() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState(PROMPT);

  const [sound] = useState(createSound);

  useEffect(() => sound.stop, [sound]);

  const play = useCallback(() => {
    const next = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]!;
    setQuestion(next);
    setChecked(false);
    setMessage('Which interval did you hear?');
    sound.playEvents(melodic([next.from, next.to], { noteDuration: 0.5 }));
  }, [sound]);

  const answer = useCallback(
    (label: string) => {
      if (question === null) return;
      setChecked(true);
      setMessage(label === question.label ? 'Correct!' : `Incorrect — that was ${question.label}.`);
    },
    [question],
  );

  return (
    <section className="exercise">
      <h3>Identify the interval</h3>
      <p className="caption">Two notes played ascending. Click the interval you heard.</p>
      <div className="exercise-controls">
        <button type="button" onClick={play}>
          Play
        </button>
        {QUESTIONS.map((q) => (
          <button key={q.label} type="button" disabled={question === null} onClick={() => answer(q.label)}>
            {q.label}
          </button>
        ))}
      </div>
      {checked && question !== null && (
        <NotesReveal pitches={[question.from, question.to]} clef="treble" mode="melodic" />
      )}
      <p className="exercise-feedback" role="status">
        {message}
      </p>
    </section>
  );
}
