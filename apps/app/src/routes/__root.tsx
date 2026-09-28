import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorFallback,
});

function RootLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <Link
          to="/"
          className="rounded-sm text-lg font-semibold outline-none transition-colors hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Polyhymnia
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function RootErrorFallback() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <Link
          to="/"
          className="rounded-sm text-lg font-semibold outline-none transition-colors hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Polyhymnia
        </Link>
      </header>
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <p>Something went wrong.</p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}
