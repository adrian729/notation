import { NotesReveal } from '@polyhymnia/notation-react/presets';
import { cn } from '@/lib/utils';
import { RevealStaff } from '@/components/lesson/RevealStaff';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import type { AnsweredQuestion } from '@/exercises/shared';
import {
  buildQuestionEvents,
  chordById,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  type ChordId,
  type ChordOptions,
  type Question,
} from '@/exercises/chord-identification';

interface RunnerProps {
  options: ChordOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

function generate(options: ChordOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function isCorrect(question: Question, answer: ChordId): boolean {
  return answer === question.quality;
}

function verdict({ question, correct }: AnsweredQuestion<Question, ChordId>): string {
  const name = chordById(question.quality).name;
  return correct ? `Correct: ${name}` : `Wrong: the answer was ${name}`;
}

function answerGridClass(count: number): string {
  if (count <= 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  return 'grid-cols-2 sm:grid-cols-4';
}

function ChordReveal({ question }: { question: Question }) {
  const chord = chordById(question.quality);
  return (
    <div className="flex w-full max-w-[30rem] flex-col items-center gap-1">
      <span className="min-h-6 text-center text-base font-medium text-muted-foreground">
        {question.noteNames[0]} {chord.name.toLowerCase()} — {question.noteNames.join(' ')}
      </span>
      <RevealStaff>
        <NotesReveal pitches={question.pitches} clef={question.clef} mode="harmonic" />
      </RevealStaff>
    </div>
  );
}

const REVEAL_PLACEHOLDER = (
  <div className="flex w-full max-w-[30rem] flex-col items-center gap-1">
    <span className="min-h-6" />
    <RevealStaff className="rounded-md bg-muted" />
  </div>
);

function AnswerGrid({
  question,
  selected,
  answered,
  disabled,
  answer,
  chords,
}: AnswerRenderProps<Question, ChordId> & { chords: readonly ChordId[] }) {
  return (
    <div className={cn('grid auto-rows-fr gap-2 sm:gap-3', answerGridClass(chords.length))}>
      {chords.map((id) => {
        const chord = chordById(id);
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => answer(id)}
            className={cn(
              'flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-2 py-1 text-center leading-tight',
              answerTileClass(answerTileState(id, question.quality, selected, answered)),
            )}
          >
            <span className="min-w-0 max-w-full text-sm font-semibold sm:text-base">{chord.name}</span>
            <span className="text-xs opacity-75">{chord.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  return (
    <LessonRunner<Question, ChordId, ChordOptions>
      options={options}
      title={title}
      lessonId={lessonId}
      onBack={onBack}
      onNextLesson={onNextLesson}
      generate={generate}
      buildEvents={(question) => buildQuestionEvents(question, options.tempo)}
      isCorrect={isCorrect}
      saveResult={recordLessonResult}
      prompt="Which chord did you hear?"
      verdict={verdict}
      renderAnswers={(props) => <AnswerGrid {...props} chords={options.chords} />}
      renderReveal={(question) => <ChordReveal question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      summaryNote={(item) => ` — you answered ${chordById(item.answer).name}`}
    />
  );
}
