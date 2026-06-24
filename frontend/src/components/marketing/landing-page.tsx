import Link from 'next/link';
import {
  ArrowLeftRight,
  BarChart3,
  CandlestickChart,
  LineChart,
  Shield,
  Wallet,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: CandlestickChart,
    title: 'Live Market Terminal',
    description:
      'Browse 50+ Indian equities with real-time price updates, candlestick charts, and order book depth.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Real Matching Engine',
    description:
      'Price-time priority order matching for LIMIT and MARKET orders — not fake instant fills.',
  },
  {
    icon: Wallet,
    title: 'Wallet & Portfolio',
    description:
      'Track available balance, locked funds, holdings, average buy price, and realized/unrealized P&L.',
  },
  {
    icon: LineChart,
    title: 'Trading Dashboard',
    description:
      'Net worth overview, allocation charts, recent orders, trades, and portfolio performance at a glance.',
  },
  {
    icon: Zap,
    title: 'WebSocket Updates',
    description:
      'Live feed for stock prices, order book changes, trade executions, and wallet updates.',
  },
  {
    icon: Shield,
    title: 'Admin Controls',
    description:
      'User management, wallet oversight, market liquidity tools, audit logs, and CSV stock imports.',
  },
];

const stats = [
  { label: 'Starting capital', value: '₹10,00,000' },
  { label: 'Indian stocks', value: '50+' },
  { label: 'Order types', value: '4' },
  { label: 'Simulated traders', value: '60' },
];

export function LandingPage() {
  return (
    <div className="trading-theme min-h-screen bg-background text-foreground">
      <MarketingNav />

      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-gain animate-pulse" />
                Simulated NSE trading platform
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                Trade Indian equities with a{' '}
                <span className="text-primary">professional terminal</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                TradeNest is a full-stack simulated broker for learning and demo trading. Place real
                limit and market orders, match against a live order book, and manage your portfolio
                — all without real money.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start Trading
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-md border border-border bg-card/60 px-6 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Sign In
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Demo: <code className="text-primary">trader_01</code> /{' '}
                <code className="text-primary">TradeNest@123</code>
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-card/30">
          <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold font-mono tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Built like a real trading app</h2>
            <p className="text-muted-foreground mt-3">
              Everything you need to practice equity trading — from order placement to portfolio
              analytics.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="trading-panel p-5 hover:border-primary/30 transition-colors">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border/60 bg-card/20">
          <div className="mx-auto max-w-6xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <ol className="mt-8 space-y-6">
                {[
                  'Sign in with a seeded trader or admin account',
                  'Explore markets, charts, and live order book depth',
                  'Place LIMIT or MARKET buy/sell orders',
                  'Watch the matching engine execute trades in real time',
                  'Track P&L, holdings, and wallet balance on your dashboard',
                ].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-muted-foreground pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="trading-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">RELIANCE</span>
                <span className="font-mono text-gain font-semibold">+1.05%</span>
              </div>
              <div className="h-32 rounded-md bg-gradient-to-t from-gain/10 to-transparent border border-border/40 flex items-end p-3">
                <BarChart3 className="h-full w-full text-primary/40" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md bg-gain/10 p-3 border border-gain/20">
                  <p className="text-gain font-semibold">BUY · 10 @ ₹2,450</p>
                  <p className="text-muted-foreground mt-1">Limit order placed</p>
                </div>
                <div className="rounded-md bg-loss/10 p-3 border border-loss/20">
                  <p className="text-loss font-semibold">SELL · 5 @ ₹2,455</p>
                  <p className="text-muted-foreground mt-1">Matched instantly</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Ready to open your terminal?</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              No registration required. Use seeded accounts and start trading in seconds.
            </p>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-md bg-gain px-8 text-sm font-semibold text-white hover:bg-gain/90 transition-colors mt-8"
            >
              Launch TradeNest
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} TradeNest · Simulated trading only. No real money involved.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
          Trade<span className="text-primary">Nest</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex md:hidden items-center gap-3 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 sm:px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
