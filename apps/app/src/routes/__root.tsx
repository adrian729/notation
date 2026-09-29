import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorFallback,
});

function RootLayout() {
  return (
    <div className="min-h-svh text-foreground">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function RootErrorFallback() {
  return (
    <div className="min-h-svh text-foreground">
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <p>Something went wrong.</p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}
