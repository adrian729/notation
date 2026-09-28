import { useMemo } from 'react';
import { IntervalReveal } from '@polyhymnia/notation-react/presets';
import { cn } from '@/lib/utils';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import { intervalById, intervalIdDisplayName, type IntervalId } from '@/exercises/shared';
import {
  buildQuestionEvents,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  type IdentificationOptions,
  type Question,
} from '@/exercises/interval-identification';

interface RunnerProps {
  options: IdentificationOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

function generate(options: IdentificationOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function correctAnswer(question: Question): IntervalId {
  return question.size;
}

function verdict(question: Question, correct: boolean): string {
  const correctName = intervalIdDisplayName(question.size);
  return correct ? `Correct: ${correctName}` : `Wrong: the answer was ${correctName}`;
}

function answerGridClass(count: number): string {
  if (count <= 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count === 5) return 'grid-cols-3 sm:grid-cols-5';
  return 'grid-cols-3 sm:grid-cols-4';
}

function IntervalSingle({ question }: { question: Question }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 [&_.pn-notation]:h-auto [&_.pn-notation]:w-full">
      <div className="flex w-full max-w-[30rem] flex-col items-center gap-1">
        <span className="text-base font-medium text-muted-foreground">{question.tones.name}</span>
        <IntervalReveal
          className="pn-notation"
          from={question.tones.from}
          to={question.tones.to}
          clef={question.clef}
          mode={question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
        />
      </div>
    </div>
  );
}

const REVEAL_PLACEHOLDER = <div className="aspect-[3/1] w-full max-w-[30rem] rounded-md bg-muted" />;

function AnswerGrid({
  question,
  selected,
  answered,
  disabled,
  answer,
  intervals,
}: AnswerRenderProps<Question, IntervalId> & { intervals: readonly IntervalId[] }) {
  const correct = question.size;
  return (
    <div className={cn('grid gap-2 sm:gap-3', answerGridClass(intervals.length))}>
      {intervals.map((id) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => answer(id)}
          className={cn(
            'flex h-16 items-center justify-center rounded-xl border-2 px-2 text-center text-sm font-semibold leading-tight sm:text-base',
            answerTileClass(answerTileState(id, correct, selected, answered)),
          )}
        >
          {intervalIdDisplayName(id)}
        </button>
      ))}
    </div>
  );
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  const sortedIntervals = useMemo(
    () => [...options.intervals].sort((a, b) => intervalById(a).semitones - intervalById(b).semitones),
    [options.intervals],
  );

  return (
    <LessonRunner<Question, IntervalId, IdentificationOptions>
      options={options}
      title={title}
      lessonId={lessonId}
      onBack={onBack}
      onNextLesson={onNextLesson}
      generate={generate}
      buildEvents={(question) => buildQuestionEvents(question, options.tempo)}
      correctAnswer={correctAnswer}
      saveResult={recordLessonResult}
      prompt="Which interval did you hear?"
      verdict={verdict}
      renderAnswers={(props) => <AnswerGrid {...props} intervals={sortedIntervals} />}
      renderReveal={(question) => <IntervalSingle question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      summaryNote={(item) => ` — you answered ${intervalIdDisplayName(item.answer)}`}
    />
  );
}
