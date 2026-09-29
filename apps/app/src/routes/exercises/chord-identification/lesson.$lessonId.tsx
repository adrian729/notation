import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { lessonById, LESSONS } from '@/exercises/chord-identification';
import { Runner } from './-Runner';

export const Route = createFileRoute('/exercises/chord-identification/lesson/$lessonId')({
  component: LessonPage,
  notFoundComponent: () => <LessonNotFound backTo="/exercises/chord-identification" />,
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
      onBack={() => navigate({ to: '/exercises/chord-identification' })}
      onOpenLesson={(lessonId) =>
        navigate({ to: '/exercises/chord-identification/lesson/$lessonId', params: { lessonId } })
      }
    />
  );
}
