import { NotesReveal } from '@polyhymnia/notation-react/presets';
import { cn } from '@/lib/utils';
import { RevealStaff } from '@/components/lesson/RevealStaff';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import type { AnsweredQuestion, Tempo } from '@/exercises/shared';
import {
  buildQuestionEvents,
  choiceEvents,
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

function isCorrect(question: Question, answer: Answer): boolean {
  return answer === question.correct;
}

function verdict({ question, correct }: AnsweredQuestion<Question, Answer>): string {
  const correctText = question.correct === 'same' ? 'A and B were the same size' : `${question.correct} was larger`;
  return correct ? `Correct: ${correctText}` : `Wrong: ${correctText}`;
}

const ANSWER_KEYS: Record<string, Answer> = { a: 'A', b: 'B', s: 'same' };

function IntervalPair({ question }: { question: Question }) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {(['a', 'b'] as const).map((key) => {
        const tone = question[key];
        return (
          <div key={key} className="flex w-full max-w-[30rem] flex-col items-center gap-1">
            <span className="text-base font-medium text-muted-foreground">
              {key.toUpperCase()} — {tone.name}
            </span>
            <RevealStaff>
              <NotesReveal
                pitches={[tone.from, tone.to]}
                clef={question.clef}
                mode={question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
              />
            </RevealStaff>
          </div>
        );
      })}
    </div>
  );
}

const REVEAL_PLACEHOLDER = (
  <>
    {[0, 1].map((i) => (
      <div key={i} className="flex w-full max-w-[30rem] flex-col items-center gap-1">
        <span className="min-h-6" />
        <RevealStaff className="rounded-md bg-muted" />
      </div>
    ))}
  </>
);

const HEAR_LABEL: Record<Answer, string> = { A: 'Hear A', B: 'Hear B', same: 'Hear both' };

function AnswerGrid({
  question,
  selected,
  answered,
  disabled,
  answer,
  hear,
  tempo,
}: AnswerRenderProps<Question, Answer> & { tempo: Tempo }) {
  const correct = question.correct;
  return (
    <div className="mx-auto w-full max-w-lg grid grid-cols-3 gap-3 sm:gap-4">
      {(['A', 'same', 'B'] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          disabled={disabled}
          aria-label={answered ? HEAR_LABEL[choice] : undefined}
          onClick={() => (answered ? hear(choiceEvents(question, choice, tempo)) : answer(choice))}
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
      isCorrect={isCorrect}
      saveResult={recordLessonResult}
      prompt="Which interval is larger, or are they the same?"
      verdict={verdict}
      renderAnswers={(props) => <AnswerGrid {...props} tempo={options.tempo} />}
      renderReveal={(question) => <IntervalPair question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      answerKeys={ANSWER_KEYS}
    />
  );
}
