import { IntervalReveal } from '@polyhymnia/notation-react/presets';
import { cn } from '@/lib/utils';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import {
  buildQuestionEvents,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  type Answer,
  type ExerciseOptions,
  type Question,
} from '@/exercises/interval-comparison';

interface RunnerProps {
  options: ExerciseOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

function generate(options: ExerciseOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function correctAnswer(question: Question): Answer {
  return question.correct;
}

function verdict(question: Question, correct: boolean): string {
  const correctText = question.correct === 'same' ? 'A and B were the same size' : `${question.correct} was larger`;
  return correct ? `Correct: ${correctText}` : `Wrong: ${correctText}`;
}

const ANSWER_KEYS: Record<string, Answer> = { a: 'A', b: 'B', s: 'same' };

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

const REVEAL_PLACEHOLDER = (
  <>
    <div className="aspect-[3/1] w-full max-w-[30rem] rounded-md bg-muted" />
    <div className="aspect-[3/1] w-full max-w-[30rem] rounded-md bg-muted" />
  </>
);

function AnswerGrid({ question, selected, answered, disabled, answer }: AnswerRenderProps<Question, Answer>) {
  const correct = question.correct;
  return (
    <div className="mx-auto w-full max-w-lg grid grid-cols-3 gap-3 sm:gap-4">
      {(['A', 'same', 'B'] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          disabled={disabled}
          onClick={() => answer(choice)}
          className={cn(
            'flex h-24 items-center justify-center rounded-xl border-2 font-bold',
            choice === 'same' ? 'text-xl' : 'text-3xl',
            answerTileClass(answerTileState(choice, correct, selected, answered)),
          )}
        >
          {choice === 'same' ? 'Same' : choice}
        </button>
      ))}
    </div>
  );
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  return (
    <LessonRunner<Question, Answer, ExerciseOptions>
      options={options}
      title={title}
      lessonId={lessonId}
      onBack={onBack}
      onNextLesson={onNextLesson}
      generate={generate}
      buildEvents={(question) => buildQuestionEvents(question, options.tempo)}
      correctAnswer={correctAnswer}
      saveResult={recordLessonResult}
      prompt="Which interval is larger, or are they the same?"
      verdict={verdict}
      renderAnswers={(props) => <AnswerGrid {...props} />}
      renderReveal={(question) => <IntervalPair question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      answerKeys={ANSWER_KEYS}
    />
  );
}
