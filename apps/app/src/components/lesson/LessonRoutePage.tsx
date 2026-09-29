import type { ComponentType } from 'react';

interface LessonLike<O> {
  id: string;
  title: string;
  options: O;
}

export interface LessonRunnerProps<O> {
  options: O;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

export interface LessonRoutePageProps<O> {
  lesson: LessonLike<O>;
  lessons: readonly LessonLike<O>[];
  Runner: ComponentType<LessonRunnerProps<O>>;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}

export function LessonRoutePage<O>({ lesson, lessons, Runner, onBack, onOpenLesson }: LessonRoutePageProps<O>) {
  const next = lessons[lessons.findIndex((l) => l.id === lesson.id) + 1];
  return (
    <Runner
      key={lesson.id}
      options={lesson.options}
      title={lesson.title}
      lessonId={lesson.id}
      onBack={onBack}
      onNextLesson={next ? () => onOpenLesson(next.id) : undefined}
    />
  );
}
