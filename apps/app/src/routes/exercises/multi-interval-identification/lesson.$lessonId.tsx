import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { lessonById, LESSONS } from '@/exercises/multi-interval-identification';
import { Runner } from './-Runner';

export const Route = createFileRoute('/exercises/multi-interval-identification/lesson/$lessonId')({
  component: LessonPage,
  notFoundComponent: () => <LessonNotFound backTo="/exercises/multi-interval-identification" />,
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
      onBack={() => navigate({ to: '/exercises/multi-interval-identification' })}
      onOpenLesson={(lessonId) =>
        navigate({ to: '/exercises/multi-interval-identification/lesson/$lessonId', params: { lessonId } })
      }
    />
  );
}
