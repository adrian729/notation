import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { IntervalReveal } from '@polyhymnia/notation-react/presets';
import { TimerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createSound, unlockSound } from '@/lib/sound';
import {
  AUTO_NEXT_DELAY_MS,
  buildQuestionEvents,
  createLessonFlow,
  finishFlow,
  generateQuestion,
  passedLesson,
  progressSegments,
  recordAnswer,
  recordLessonResult,
  scoreOf,
  type Answer,
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

type Phase = 'playing' | 'answered' | 'summary' | 'error';

interface RunnerState {
  flow: LessonFlowState;
  question: Question | null;
  lastSignature: LastQuestionSignature | undefined;
  phase: Phase;
  selected: Answer | null;
  playCount: number;
}

type Action =
  | { type: 'answer'; choice: Answer }
  | { type: 'next'; options: ExerciseOptions }
  | { type: 'restart'; options: ExerciseOptions }
  | { type: 'retryGeneration'; options: ExerciseOptions }
  | { type: 'finish' };

function IntervalPair({ question }: { question: Question }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 [&_.pn-notation]:h-auto [&_.pn-notation]:w-full">
      {(['a', 'b'] as const).map((key) => {
        const tone = question[key];
        return (
          <div key={key} className="flex w-full max-w-[30rem] flex-col items-center gap-1">
            <span className="text-base font-medium text-muted-foreground">
              {key.toUpperCase()} — {tone.name}
            </span>
            <IntervalReveal
              className="pn-notation"
              from={tone.from}
              to={tone.to}
              clef={question.clef}
              mode={question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
            />
          </div>
        );
      })}
    </div>
  );
}

function LazyIntervalPair({ question }: { question: Question }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  if (visible) return <IntervalPair question={question} />;
  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-4">
      <div className="aspect-[3/1] w-full max-w-[30rem] rounded-md bg-muted" />
      <div className="aspect-[3/1] w-full max-w-[30rem] rounded-md bg-muted" />
    </div>
  );
}

function nextQuestionState(options: ExerciseOptions, flow: LessonFlowState, last?: LastQuestionSignature) {
  const question = generateQuestion(options, Math.random, last);
  return { question, signature: { mode: question.mode, sizeA: question.a.size, sizeB: question.b.size } };
}

function tryNextQuestionState(options: ExerciseOptions, flow: LessonFlowState, last?: LastQuestionSignature) {
  try {
    return { ok: true as const, ...nextQuestionState(options, flow, last) };
  } catch {
    return { ok: false as const };
  }
}

function reducer(state: RunnerState, action: Action, options: ExerciseOptions, lessonId: string | undefined): RunnerState {
  switch (action.type) {
    case 'answer': {
      if (state.phase !== 'playing' || !state.question) return state;
      const correct = action.choice === state.question.correct;
      const flow = recordAnswer(state.flow, state.question, correct);
      return { ...state, flow, phase: flow.finished ? 'summary' : 'answered', selected: action.choice };
    }
    case 'next': {
      if (state.phase !== 'answered' || state.flow.finished) return state;
      const result = tryNextQuestionState(action.options, state.flow, state.lastSignature);
      if (!result.ok) return { ...state, phase: 'error' };
      return {
        ...state,
        question: result.question,
        lastSignature: result.signature,
        phase: 'playing',
        selected: null,
        playCount: state.playCount + 1,
      };
    }
    case 'finish': {
      const flow = finishFlow(state.flow);
      if (flow === state.flow) return state;
      return { ...state, flow, phase: 'summary' };
    }
    case 'restart': {
      const flow = createLessonFlow({ questionCount: action.options.questionCount, graded: !!lessonId });
      const result = tryNextQuestionState(action.options, flow);
      if (!result.ok) return { ...state, flow, question: null, phase: 'error', playCount: state.playCount + 1 };
      return {
        flow,
        question: result.question,
        lastSignature: result.signature,
        phase: 'playing',
        selected: null,
        playCount: state.playCount + 1,
      };
    }
    case 'retryGeneration': {
      if (state.phase !== 'error') return state;
      const result = tryNextQuestionState(action.options, state.flow, state.lastSignature);
      if (!result.ok) return state;
      return {
        ...state,
        question: result.question,
        lastSignature: result.signature,
        phase: 'playing',
        selected: null,
        playCount: state.playCount + 1,
      };
    }
    default:
      return state;
  }
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  const [sound] = useState(createSound);
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [replaySignal, setReplaySignal] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const persistedRef = useRef(false);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const newQuestionRef = useRef<HTMLButtonElement>(null);

  const [state, dispatch] = useReducer(
    (s: RunnerState, a: Action) => reducer(s, a, options, lessonId),
    undefined,
    () => {
      const flow = createLessonFlow({ questionCount: options.questionCount, graded: !!lessonId });
      const result = tryNextQuestionState(options, flow);
      if (!result.ok) {
        return { flow, question: null, lastSignature: undefined, phase: 'error' as Phase, selected: null, playCount: 0 };
      }
      return {
        flow,
        question: result.question,
        lastSignature: result.signature,
        phase: 'playing' as Phase,
        selected: null,
        playCount: 0,
      };
    },
  );

  useEffect(() => {
    persistedRef.current = false;
  }, [options]);

  useEffect(() => {
    if (state.phase !== 'summary' || !lessonId || persistedRef.current) return;
    persistedRef.current = true;
    const percent = Math.round(scoreOf(state.flow.answered) * 100);
    recordLessonResult(lessonId, percent, passedLesson(state.flow));
  }, [state.phase, state.flow, lessonId]);

  useEffect(() => unlockSound(), []);

  const play = useCallback(() => {
    if (!state.question) return;
    setBlocked(false);
    setStarted(true);
    const playback = sound.playEvents(buildQuestionEvents(state.question, options.tempo));
    void playback.finished.then((result) => {
      if (result === 'blocked') setBlocked(true);
    });
  }, [sound, state.question, options.tempo]);

  const replay = useCallback(() => {
    if (state.phase === 'answered') setReplaySignal((n) => n + 1);
    play();
  }, [state.phase, play]);

  const replayQuestion = useCallback(
    (q: Question) => {
      sound.stop();
      setBlocked(false);
      const playback = sound.playEvents(buildQuestionEvents(q, options.tempo));
      void playback.finished.then((result) => {
        if (result === 'blocked') setBlocked(true);
      });
    },
    [sound, options.tempo],
  );

  useEffect(() => {
    if (!state.question) return;
    setStarted(false);
    setAutoPaused(false);
    play();
    playButtonRef.current?.focus();
    return () => {
      sound.stop();
    };
  }, [state.question, play, sound]);

  const answer = useCallback(
    (choice: Answer) => {
      if (state.phase !== 'playing') return;
      dispatch({ type: 'answer', choice });
    },
    [state.phase],
  );

  useEffect(() => {
    if (state.phase === 'answered' && !state.flow.finished) {
      newQuestionRef.current?.focus();
    }
  }, [state.phase, state.flow.finished]);

  useEffect(() => {
    if (state.phase !== 'playing') sound.stop();
  }, [state.phase, sound]);

  const goNext = useCallback(() => {
    if (state.phase !== 'answered' || state.flow.finished) return;
    dispatch({ type: 'next', options });
  }, [state.phase, state.flow.finished, options]);

  const autoNextArmed =
    state.phase === 'answered' &&
    !state.flow.finished &&
    options.autoNext &&
    !autoPaused &&
    state.selected === state.question?.correct;

  useEffect(() => {
    if (!autoNextArmed) return;
    const id = window.setTimeout(goNext, AUTO_NEXT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [autoNextArmed, goNext, replaySignal]);

  useEffect(() => {
    const isTextInput = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const isInteractiveControl = (el: EventTarget | null) =>
      el instanceof HTMLElement && !!el.closest('button, a, select, input, textarea, [contenteditable], [role="button"]');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (isInteractiveControl(e.target)) return;
        e.preventDefault();
        if (e.key === ' ') replay();
        else goNext();
        return;
      }
      if (isTextInput(e.target)) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        answer('A');
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        answer('B');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        answer('same');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [replay, answer, goNext]);

  const segments = useMemo(() => progressSegments(state.flow), [state.flow]);
  const answeredYet = state.phase !== 'playing';

  if (state.phase === 'error') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-base font-medium" role="status">
          Couldn&apos;t create a question.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => dispatch({ type: 'retryGeneration', options })}>Try again</Button>
        </div>
      </div>
    );
  }

  const question = state.question!;
  const correct = question.correct;
  const verdict = correct === 'same' ? 'A and B were the same size' : `${correct} was larger`;

  if (state.phase === 'summary') {
    const percent = Math.round(scoreOf(state.flow.answered) * 100);
    const passed = passedLesson(state.flow);
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">{title} — done</h2>
        <p className="text-lg">
          Score: <span className="font-semibold">{percent}%</span>
          {state.flow.graded && (
            <span className={cn('ml-2 font-medium', passed ? 'text-success-strong' : 'text-destructive')}>
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
        <div className="flex w-full flex-col gap-3 text-left">
          {state.flow.answered.map((a, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col gap-3 rounded-lg border-2 p-4',
                a.correct ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10',
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {i + 1} · {a.correct ? 'Correct' : 'Wrong'}
                </span>
                <Button size="sm" variant="outline" onClick={() => replayQuestion(a.question)}>
                  Replay
                </Button>
              </div>
              <LazyIntervalPair question={a.question} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto flex flex-col gap-6 px-4 py-8', answeredYet ? 'max-w-2xl' : 'max-w-lg')}>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <h2 className="text-lg font-medium">{title}</h2>
        {state.flow.endless ? (
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'finish' })}>
            Finish
          </Button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {!state.flow.endless && (
        <div className="flex gap-1">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full',
                seg === 'upcoming' && 'bg-muted',
                seg === 'right' && 'bg-success',
                seg === 'wrong' && 'bg-destructive',
                state.phase === 'playing' && i === state.flow.answered.length && 'bg-primary',
              )}
            />
          ))}
        </div>
      )}

      <p className="text-center text-base font-medium" role="status">
        {answeredYet
          ? state.selected === correct
            ? `Correct: ${verdict}`
            : `Wrong: ${verdict}`
          : 'Which interval is larger, or are they the same?'}
      </p>

      {blocked && (
        <p className="text-center text-sm text-muted-foreground" role="status">
          Tap Play question to enable sound.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(['A', 'same', 'B'] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={!answeredYet && !started}
            onClick={() => answer(choice)}
            className={cn(
              'flex h-24 items-center justify-center rounded-xl border-2 font-bold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              choice === 'same' ? 'text-xl' : 'text-3xl',
              !answeredYet && 'border-border bg-card hover:bg-muted',
              answeredYet && choice === correct && 'border-success bg-success text-success-foreground',
              answeredYet && choice !== correct && choice === state.selected && 'border-destructive bg-destructive/20 text-destructive',
              answeredYet && choice !== correct && choice !== state.selected && 'border-border bg-card opacity-60',
            )}
          >
            {choice === 'same' ? 'Same' : choice}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <Button ref={playButtonRef} variant="outline" onClick={replay}>
          Play question
        </Button>
        {answeredYet && (
          <Button ref={newQuestionRef} onClick={goNext}>
            Next question
          </Button>
        )}
        {autoNextArmed && (
          <Button
            variant="outline"
            className="relative overflow-hidden"
            aria-label="Stay on this question"
            onClick={() => setAutoPaused(true)}
          >
            <TimerOff />
            Stay
            <span
              key={replaySignal}
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-countdown bg-primary-strong"
              style={{ animationDuration: `${AUTO_NEXT_DELAY_MS}ms` }}
            />
          </Button>
        )}
      </div>

      {answeredYet && <IntervalPair question={question} />}
    </div>
  );
}
