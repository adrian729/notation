import { createFileRoute, Link, useNavigate, notFound } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { lessonById, LESSONS } from '@/exercises/interval-identification';
import { Runner } from './-Runner';

export const Route = createFileRoute('/exercises/interval-identification/lesson/$lessonId')({
  component: LessonPage,
  notFoundComponent: NotFoundLesson,
  loader: ({ params }) => {
    const lesson = lessonById(params.lessonId);
    if (!lesson) throw notFound();
    return lesson;
  },
});

function LessonPage() {
  const lesson = Route.useLoaderData();
  const navigate = useNavigate();
  const index = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS[index + 1];

  return (
    <Runner
      key={lesson.id}
      options={lesson.options}
      title={lesson.title}
      lessonId={lesson.id}
      onBack={() => navigate({ to: '/exercises/interval-identification' })}
      onNextLesson={
        next ? () => navigate({ to: '/exercises/interval-identification/lesson/$lessonId', params: { lessonId: next.id } }) : undefined
      }
    />
  );
}

function NotFoundLesson() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <p>Lesson not found.</p>
      <Button asChild>
        <Link to="/exercises/interval-identification">Back to lessons</Link>
      </Button>
    </div>
  );
}
