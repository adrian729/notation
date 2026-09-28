import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-12 px-6 py-24">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Polyhymnia</h1>
        <p className="text-lg text-muted-foreground">
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
              Hear two intervals and choose the larger one. No theory needed —
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
