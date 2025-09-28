import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"

// RoleCard with Web3 gradients + glow
function RoleCard({
  title,
  description,
  href,
  accent,
}: {
  title: string
  description: string
  href: string
  accent: "owner" | "tenant"
}) {
  const accentBg =
    accent === "owner"
      ? "from-violet-600/25 via-fuchsia-500/15 to-indigo-600/25"
      : "from-cyan-500/25 via-teal-500/15 to-emerald-600/25"

  const accentRing =
    accent === "owner"
      ? "focus-visible:ring-fuchsia-400/60"
      : "focus-visible:ring-cyan-400/60"

  const borderColor =
    accent === "owner" ? "border-fuchsia-400/25" : "border-cyan-400/25"

  const glow =
    accent === "owner"
      ? "hover:shadow-[0_0_28px_rgba(217,70,239,0.35)]"
      : "hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"

  const dot =
    accent === "owner"
      ? "bg-fuchsia-400 shadow-[0_0_12px] shadow-fuchsia-400/60"
      : "bg-cyan-400 shadow-[0_0_12px] shadow-cyan-400/60"

  const cta =
    accent === "owner"
      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
      : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"

  return (
    <Card
      className={cn(
        "relative overflow-hidden group transition-all duration-300",
        "backdrop-blur-xl bg-slate-900/60 border",
        borderColor,
        glow,
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
        // inner gradient wash
        "bg-gradient-to-br",
        accentBg,
        // gradient border sheen using ::before
        "before:absolute before:inset-0 before:-z-10 before:rounded-xl",
        "before:bg-[conic-gradient(from_180deg,transparent_0%,rgba(255,255,255,0.18)_25%,transparent_50%,rgba(255,255,255,0.12)_75%,transparent_100%)]",
        "before:opacity-30",
        // subtle hover lift
        "hover:-translate-y-0.5"
      )}
      role="region"
      aria-label={`${title} role`}
    >
      <CardHeader className="relative">
        <CardTitle className="text-balance text-slate-100 tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-pretty text-slate-300">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3 pt-1">
        <div className={cn("h-2.5 w-2.5 rounded-full", dot)} aria-hidden="true" />

        <Button
          asChild
          className={cn(
            "font-medium px-4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            accentRing,
            cta
          )}
        >
          <Link href={href} aria-label={`Continue as ${title}`}>
            Continue
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


export default function Home() {
  return (
    <main
      className={cn(
        "min-h-dvh flex flex-col text-slate-200",
        // Layered Web3 background: dark base + radial mesh + subtle grid
        "bg-slate-950",
        "relative overflow-hidden"
      )}
    >
      {/* Radial mesh glow */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40 bg-fuchsia-600/40" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40 bg-cyan-500/40" />
      </div>
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background:linear-gradient(transparent_23px,rgba(255,255,255,0.08)_24px),linear-gradient(90deg,transparent_23px,rgba(255,255,255,0.08)_24px)] [background-size:24px_24px]" />

      {/* Header */}
      <header className="w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/">
          <h1 className="text-lg font-semibold cursor-pointer">
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              VisionLand
            </span>
          </h1>
        </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/tenant"
              className="text-sm underline underline-offset-4 text-cyan-300 hover:text-cyan-200"
            >
              Browse Rentals
            </Link>
            <Link
              href="/owner"
              className="text-sm underline underline-offset-4 text-fuchsia-300 hover:text-fuchsia-200"
            >
              Owner Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl w-full px-4 py-10 sm:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-cyan-300">
              On-chain Rentals • Filecoin Receipts • PYUSD
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-balance animate-in fade-in duration-700">
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                Rent smarter with verifiable receipts on VisionLand
              </span>
            </h2>
            <p className="text-pretty text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              Choose your role to continue. All flows are simulated locally for rapid prototyping and demos.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                asChild
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-medium"
              >
                <Link href="/tenant">Start as Tenant</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium"
              >
                <Link href="/owner">Go to Owner</Link>
              </Button>
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid gap-4 content-start">
            <RoleCard
              title="Property Owner"
              description="List properties, toggle availability, and review simulated rent receipts."
              href="/owner"
              accent="owner"
            />
            <RoleCard
              title="Tenant"
              description="Browse available rentals, simulate PYUSD payments, and get a verifiable receipt."
              href="/tenant"
              accent="tenant"
            />
          </div>
        </div>

        {/* Features */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card className="animate-in zoom-in-50 duration-700 border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200 shadow-[0_0_24px_rgba(56,189,248,0.15)]">
            <CardHeader>
              <CardTitle className="text-cyan-300">Local-first</CardTitle>
              <CardDescription className="text-slate-300">All data stored in your browser</CardDescription>
            </CardHeader>
          </Card>
          <Card className="animate-in zoom-in-50 duration-700 delay-100 border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200 shadow-[0_0_24px_rgba(217,70,239,0.15)]">
            <CardHeader>
              <CardTitle className="text-fuchsia-300">On-chain vibes</CardTitle>
              <CardDescription className="text-slate-300">Mock PYUSD & Filecoin CIDs</CardDescription>
            </CardHeader>
          </Card>
          <Card className="animate-in zoom-in-50 duration-700 delay-200 border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200 shadow-[0_0_24px_rgba(139,92,246,0.15)]">
            <CardHeader>
              <CardTitle className="text-violet-300">Fast iterating</CardTitle>
              <CardDescription className="text-slate-300">No setup, just demo</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </main>
  )
}
