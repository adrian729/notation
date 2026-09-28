import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LOGO_URL } from '@/lib/logo';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-12 px-6 py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src={LOGO_URL} alt="" className="mb-3 size-32" />
        <h1 className="text-4xl font-semibold tracking-tight text-teal-800">Polyhymnia</h1>
        <p className="text-lg text-teal-600">
          Train your ear, one phrase at a time.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
          Exercises
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interval Comparison</CardTitle>
            <CardDescription>
              Hear two intervals and tell which is larger, or whether they are
              the same. No theory needed —
              the recommended first exercise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/exercises/interval-comparison">Start training</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
