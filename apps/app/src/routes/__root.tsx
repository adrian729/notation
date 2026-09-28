import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LOGO_URL } from '@/lib/logo';

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorFallback,
});

function SiteHeader() {
  return (
    <header className="border-b px-6 py-3">
      <Link
        to="/"
        className="inline-flex items-center gap-2.5 rounded-sm text-lg font-semibold outline-none transition-colors hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <img src={LOGO_URL} alt="" className="size-8" />
        Polyhymnia
      </Link>
    </header>
  );
}

function RootLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function RootErrorFallback() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <p>Something went wrong.</p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}
