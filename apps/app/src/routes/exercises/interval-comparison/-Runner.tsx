import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { IntervalReveal } from '@polyhymnia/notation-react/presets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createSound, unlockSound } from '@/lib/sound';
import {
  AUTO_NEXT_DELAY_MS,
  buildQuestionEvents,
  createLessonFlow,
  generateQuestion,
  progressSegments,
  recordAnswer,
  recordLessonResult,
  scoreOf,
  type ExerciseOptions,
  type LastQuestionSignature,
  type LessonFlowState,
  type Question,
} from '@/exercises/interval-comparison';

interface RunnerProps {
  options: ExerciseOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

type Phase = 'playing' | 'answered' | 'summary';

interface RunnerState {
  flow: LessonFlowState;
  question: Question;
  lastSignature: LastQuestionSignature;
  phase: Phase;
  selected: 'A' | 'B' | null;
  playCount: number;
}

type Action =
  | { type: 'answer'; choice: 'A' | 'B' }
  | { type: 'next'; options: ExerciseOptions }
  | { type: 'restart'; options: ExerciseOptions };

function nextQuestionState(options: ExerciseOptions, flow: LessonFlowState, last?: LastQuestionSignature) {
  const question = generateQuestion(options, Math.random, last);
  return { question, signature: { mode: question.mode, sizeA: question.a.size, sizeB: question.b.size } };
}

function reducer(state: RunnerState, action: Action, options: ExerciseOptions): RunnerState {
  switch (action.type) {
    case 'answer': {
      if (state.phase !== 'playing') return state;
      const correct = action.choice === state.question.correct;
      const flow = recordAnswer(state.flow, correct);
      return { ...state, flow, phase: flow.finished ? 'summary' : 'answered', selected: action.choice };
    }
    case 'next': {
      if (state.phase !== 'answered' || state.flow.finished) return state;
      const { question, signature } = nextQuestionState(action.options, state.flow, state.lastSignature);
      return {
        ...state,
        question,
        lastSignature: signature,
        phase: 'playing',
        selected: null,
        playCount: state.playCount + 1,
      };
    }
    case 'restart': {
      const flow = createLessonFlow({ questionCount: action.options.questionCount });
      const { question, signature } = nextQuestionState(action.options, flow);
      return { flow, question, lastSignature: signature, phase: 'playing', selected: null, playCount: state.playCount + 1 };
    }
    default:
      return state;
  }
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  const [sound] = useState(createSound);
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const persistedRef = useRef(false);

  const [state, dispatch] = useReducer(
    (s: RunnerState, a: Action) => reducer(s, a, options),
    undefined,
    () => {
      const flow = createLessonFlow({ questionCount: options.questionCount });
      const { question, signature } = nextQuestionState(options, flow);
      return { flow, question, lastSignature: signature, phase: 'playing' as Phase, selected: null, playCount: 0 };
    },
  );

  useEffect(() => {
    persistedRef.current = false;
  }, [options]);

  useEffect(() => {
    if (state.phase !== 'summary' || !lessonId || persistedRef.current) return;
    persistedRef.current = true;
    const percent = Math.round(scoreOf(state.flow.answered) * 100);
    recordLessonResult(lessonId, percent, percent >= 80);
  }, [state.phase, state.flow.answered, lessonId]);

  useEffect(() => sound.stop, [sound]);
  useEffect(() => unlockSound(), []);

  const play = useCallback(() => {
    setBlocked(false);
    setStarted(true);
    const playback = sound.playEvents(buildQuestionEvents(state.question, options.tempo));
    void playback.finished.then((result) => {
      if (result === 'blocked') setBlocked(true);
    });
  }, [sound, state.question, options.tempo]);

  const playedForQuestion = useRef<Question | null>(null);
  useEffect(() => {
    if (playedForQuestion.current === state.question) return;
    playedForQuestion.current = state.question;
    setStarted(false);
    play();
  }, [state.question, play]);

  const answer = useCallback(
    (choice: 'A' | 'B') => {
      if (state.phase !== 'playing') return;
      dispatch({ type: 'answer', choice });
    },
    [state.phase],
  );

  const goNext = useCallback(() => {
    if (state.phase !== 'answered' || state.flow.finished) return;
    dispatch({ type: 'next', options });
  }, [state.phase, state.flow.finished, options]);

  useEffect(() => {
    if (state.phase !== 'answered' || !options.autoNext || state.selected !== state.question.correct) return;
    const id = window.setTimeout(goNext, AUTO_NEXT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, options.autoNext, state.selected, state.question.correct, goNext]);

  useEffect(() => {
    const isTyping = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key === ' ') {
        e.preventDefault();
        play();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        answer('A');
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        answer('B');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [play, answer, goNext]);

  const segments = useMemo(() => progressSegments(state.flow), [state.flow]);
  const answeredYet = state.phase !== 'playing';
  const correct = state.question.correct;

  if (state.phase === 'summary') {
    const percent = Math.round(scoreOf(state.flow.answered) * 100);
    const passed = !state.flow.endless && percent >= 80;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">{title} — done</h2>
        <p className="text-lg">
          Score: <span className="font-semibold">{percent}%</span>
          {!state.flow.endless && (
            <span className={cn('ml-2 font-medium', passed ? 'text-green-700 dark:text-green-300' : 'text-destructive')}>
              {passed ? 'Passed' : 'Not passed'}
            </span>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={onBack}>
            Back to lessons
          </Button>
          <Button
            variant={passed ? 'secondary' : 'default'}
            onClick={() => {
              persistedRef.current = false;
              dispatch({ type: 'restart', options });
            }}
          >
            Retake
          </Button>
          {onNextLesson && (
            <Button variant={passed ? 'default' : 'outline'} onClick={onNextLesson}>
              Next lesson
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="w-12" />
      </div>

      {!state.flow.endless && (
        <div className="flex gap-1">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full',
                seg === 'upcoming' && 'bg-muted',
                seg === 'right' && 'bg-green-400 dark:bg-green-200',
                seg === 'wrong' && 'bg-destructive',
                i === state.flow.answered.length && seg === 'upcoming' && 'bg-blue-400',
              )}
            />
          ))}
        </div>
      )}

      <p className="text-center text-base font-medium" role="status">
        {answeredYet
          ? state.selected === correct
            ? `Correct: ${correct} was larger`
            : `Wrong: ${correct} was larger`
          : 'Which interval is larger?'}
      </p>

      {blocked && (
        <p className="text-center text-sm text-muted-foreground">Tap Play question to enable sound.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {(['A', 'B'] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={!answeredYet && !started}
            onClick={() => answer(choice)}
            className={cn(
              'flex h-24 items-center justify-center rounded-xl border-2 text-3xl font-bold transition-colors',
              !answeredYet && 'border-border bg-card hover:bg-muted',
              answeredYet &&
                choice === correct &&
                'border-green-400 bg-green-400 text-black dark:bg-green-200 dark:text-black',
              answeredYet && choice !== correct && choice === state.selected && 'border-destructive bg-destructive/20 text-destructive',
              answeredYet && choice !== correct && choice !== state.selected && 'border-border bg-card opacity-60',
            )}
          >
            {choice}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={play}>
          Play question
        </Button>
        {answeredYet && <Button onClick={goNext}>New question</Button>}
      </div>

      {answeredYet && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-muted-foreground">A — {state.question.a.name}</span>
            <IntervalReveal
              className="pn-notation"
              from={state.question.a.from}
              to={state.question.a.to}
              clef={state.question.clef}
              mode={state.question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-muted-foreground">B — {state.question.b.name}</span>
            <IntervalReveal
              className="pn-notation"
              from={state.question.b.from}
              to={state.question.b.to}
              clef={state.question.clef}
              mode={state.question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
