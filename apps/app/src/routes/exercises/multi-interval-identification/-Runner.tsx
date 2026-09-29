import { NotesReveal } from '@polyhymnia/notation-react/presets';
import { RevealStaff } from '@/components/lesson/RevealStaff';
import { LessonRunner } from '@/components/lesson/LessonRunner';
import { writtenIntervalName, type AnsweredQuestion, type IntervalId } from '@/exercises/shared';
import {
  buildQuestionEvents,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  type MultiIntervalOptions,
  type Question,
} from '@/exercises/multi-interval-identification';
import { AnswerRows } from './-AnswerRows';

interface RunnerProps {
  options: MultiIntervalOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

type Answer = readonly IntervalId[];

function generate(options: MultiIntervalOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function isCorrect(question: Question, answer: Answer): boolean {
  return question.rows.every((row, i) => row.size === answer[i]);
}

function verdict({ question, correct }: AnsweredQuestion<Question, Answer>): string {
  const intervals = question.rows.map((row) => row.size).join(', ');
  return correct ? `Correct: ${intervals}` : `Wrong: the answer was ${intervals}, from the lowest note up`;
}

function captions(question: Question): string[] {
  const nameOf = new Map(question.rows.map((row) => [row.pitch, writtenIntervalName(question.reference, row.pitch)]));
  return question.sounding.map((pitch) => nameOf.get(pitch) ?? 'Lowest note');
}

function StackReveal({ question }: { question: Question }) {
  return (
    <RevealStaff className="box-content pb-8">
      <NotesReveal pitches={question.sounding} clef={question.clef} mode="melodic" labels={captions(question)} />
    </RevealStaff>
  );
}

const REVEAL_PLACEHOLDER = (
  <RevealStaff className="box-content pb-8">
    <div className="flex-1 rounded-md bg-muted" />
  </RevealStaff>
);

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  return (
    <LessonRunner<Question, Answer, MultiIntervalOptions>
      options={options}
      title={title}
      lessonId={lessonId}
      onBack={onBack}
      onNextLesson={onNextLesson}
      generate={generate}
      buildEvents={(question) => buildQuestionEvents(question, options.tempo)}
      isCorrect={isCorrect}
      saveResult={recordLessonResult}
      prompt="Name each note's interval above the lowest note."
      verdict={verdict}
      renderAnswers={(props) => <AnswerRows {...props} intervals={options.intervals} />}
      renderReveal={(question) => <StackReveal question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      summaryNote={(item) => ` — you answered ${item.answer.join(', ')}`}
    />
  );
}
