import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { lessonById, LESSONS } from '@/exercises/interval-comparison';
import { Runner } from './-Runner';

export const Route = createFileRoute('/exercises/interval-comparison/lesson/$lessonId')({
  component: LessonPage,
  notFoundComponent: () => <LessonNotFound backTo="/exercises/interval-comparison" />,
  loader: ({ params }) => {
    const lesson = lessonById(params.lessonId);
    if (!lesson) throw notFound();
    return lesson;
  },
});

function LessonPage() {
  const navigate = useNavigate();
  return (
    <LessonRoutePage
      lesson={Route.useLoaderData()}
      lessons={LESSONS}
      Runner={Runner}
      onBack={() => navigate({ to: '/exercises/interval-comparison' })}
      onOpenLesson={(lessonId) =>
        navigate({ to: '/exercises/interval-comparison/lesson/$lessonId', params: { lessonId } })
      }
    />
  );
}
