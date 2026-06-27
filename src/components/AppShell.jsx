import { Link, NavLink, useNavigate } from "react-router-dom";
import { FolderKanban, LogOut, Sparkles, UserCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: FolderKanban },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
];

export default function AppShell({ children, title, subtitle, actions }) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="app-grid min-h-screen px-4 py-4 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-[2rem] p-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-300 text-white shadow-lg shadow-orange-200">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="section-title text-lg">SyncSpace</p>
              <p className="text-sm text-stone-500">InsForge collaboration suite</p>
            </div>
          </Link>

          <div className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-stone-900 !text-white shadow-lg shadow-stone-200"
                        : "text-stone-600 hover:bg-white/70 hover:text-stone-900",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-stone-200/70 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Signed in</p>
            <p className="mt-3 text-lg font-semibold text-stone-900">
              {profile?.name || user?.profile?.name || user?.email?.split("@")[0]}
            </p>
            <p className="text-sm text-stone-500">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <main className="glass-panel rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-4 border-b border-stone-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Workspace control</p>
              <h1 className="section-title mt-2 text-3xl text-stone-950">{title}</h1>
              {subtitle ? <p className="mt-2 max-w-2xl text-sm text-stone-500">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          <div className="pt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
