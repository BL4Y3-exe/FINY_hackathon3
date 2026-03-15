import Link from "next/link";
import { ArrowRight, Network, Users, HelpCircle, BarChart3, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Network className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">PeerWeave</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/signin"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
          <Zap className="h-3 w-3" />
          Automatically build community relationships
        </span>
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Communities die when members{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            don't connect
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">
          PeerWeave is the relationship infrastructure layer for online communities. It
          automatically facilitates peer-to-peer connections through AI matchmaking, buddy
          onboarding, and expert help networks.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signin"
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-violet-700"
          >
            Start building relationships <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:border-gray-300"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {[
            { label: "Connections formed", value: "10k+" },
            { label: "Communities", value: "200+" },
            { label: "Help requests resolved", value: "5k+" },
            { label: "Avg health score", value: "78/100" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-violet-600">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Everything a community needs to thrive</h2>
          <p className="mt-3 text-gray-600">Five interconnected systems that run automatically.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.color}`}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="bg-violet-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">How it works</h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5 rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900">Ready to weave your community together?</h2>
        <p className="mb-8 text-gray-600">
          Sign up for free and create your first community in under two minutes.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-4 text-lg font-semibold text-white shadow hover:bg-violet-700"
        >
          Get started — it's free <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} PeerWeave. Built for communities.
      </footer>
    </div>
  );
}

const features = [
  {
    title: "AI Peer Matchmaking",
    description:
      "Automatically pairs members based on shared interests, complementary skills, and timezone — avoiding repeat matches.",
    icon: Users,
    color: "bg-violet-500",
  },
  {
    title: "Buddy Onboarding",
    description:
      "Every new member is assigned an active buddy who welcomes them and helps them integrate into the community.",
    icon: Zap,
    color: "bg-indigo-500",
  },
  {
    title: "Help Board & Expert Matching",
    description:
      "Members post problems with tags. The system surfaces the top 3 experts who can help, ranked by skill match.",
    icon: HelpCircle,
    color: "bg-sky-500",
  },
  {
    title: "Relationship Graph",
    description:
      "Visualise the entire community as a force-directed network graph. Spot clusters, bridges, and isolated members at a glance.",
    icon: Network,
    color: "bg-emerald-500",
  },
  {
    title: "Community Health Score",
    description:
      "A 0–100 score updated weekly based on activity, new connections, help resolved, and isolation ratio.",
    icon: BarChart3,
    color: "bg-amber-500",
  },
  {
    title: "Automated Cron Engine",
    description:
      "Weekly matchmaking and health calculations run automatically so community managers never have to think about it.",
    icon: ArrowRight,
    color: "bg-rose-500",
  },
];

const steps = [
  {
    title: "Create your community",
    description: "Sign up with your email, create a community, and invite members in seconds.",
  },
  {
    title: "Members build profiles",
    description: "Members add their skills, interests, and goals so the matching engine has signal.",
  },
  {
    title: "System activates automatically",
    description:
      "Buddy assignments happen on join. Weekly matchmaking runs every Monday. Health score recalculates on Sunday.",
  },
  {
    title: "Relationships form at scale",
    description:
      "Members connect, help each other, and the relationship graph grows richer over time.",
  },
];
