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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Polyhymnia</h1>
        <p className="text-lg text-muted-foreground">
          Train your ear, one phrase at a time.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ear-training exercises on real notation</CardTitle>
          <CardDescription>
            Hear a melody and write it down, name the interval you heard,
            spot the note that was played wrong.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link to="/exercises/interval-comparison">Start training</Link>
          </Button>
          <a
            href={
              import.meta.env.DEV
                ? 'http://localhost:5174/'
                : `${import.meta.env.BASE_URL}demo/`
            }
            className="text-sm font-medium text-primary-strong underline-offset-4 hover:underline"
          >
            Notation demo
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
