import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">TradeNest</h1>
        <p className="text-muted-foreground text-lg">
          Simulated Indian stock trading platform — Phase 1 scaffold complete.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          API health: <code className="text-xs">GET /api/health</code>
        </p>
      </div>
    </main>
  );
}
