import { ArrowRight, CheckCircle2, LayoutPanelTop, Users2, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Shared workspaces",
    description: "Organize live projects with owners, editors, and invitation-driven collaboration.",
    icon: Users2,
  },
  {
    title: "Instant preview",
    description: "Write HTML, CSS, and JavaScript in Monaco Editor and preview changes side by side.",
    icon: LayoutPanelTop,
  },
  {
    title: "Realtime flow",
    description: "Broadcast file changes, cursor presence, and online collaborators through InsForge realtime channels.",
    icon: Zap,
  },
];

export default function LandingPage() {
  return (
    <div className="app-grid min-h-screen px-4 py-4 sm:px-6">
      <div className="glass-panel mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2.4rem]">
        <header className="flex flex-col gap-5 border-b border-stone-200/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="section-title text-2xl">SyncSpace</p>
            <p className="text-sm text-stone-500">Collaborative coding, powered by InsForge.</p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Log in
            </Link>
            <Link
  to="/signup"
  style={{
    backgroundColor: "black",
    color: "white",
    padding: "10px 20px",
    borderRadius: "9999px",
    border: "2px solid white",
    fontWeight: "bold",
  }}
>
  Start building
</Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
              <CheckCircle2 className="h-4 w-4" />
              Ship together
            </p>
            <h1 className="section-title mt-6 max-w-4xl text-5xl leading-[0.95] text-stone-950 sm:text-6xl">
              Turn every workspace into a live coding room.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              Create collaborative workspaces, invite teammates by email, edit HTML/CSS/JS files in real
              time, and preview every change instantly from one modern dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5"
              >
                Create free workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Explore your dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[1.8rem] border border-stone-200/70 bg-white/75 p-6 transition hover:-translate-y-1 hover:shadow-xl"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-200 to-rose-200 text-stone-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="section-title mt-5 text-2xl text-stone-900">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
