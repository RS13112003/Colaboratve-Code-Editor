import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { signIn } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { refreshAuth } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const status = params.get("insforge_status");
  const type = params.get("insforge_type");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signIn(form);
      await refreshAuth();
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-panel w-full max-w-xl rounded-[2.2rem] p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Welcome back</p>
        <h1 className="section-title mt-3 text-4xl text-stone-950">Jump back into your workspaces.</h1>
        <p className="mt-3 text-sm leading-7 text-stone-500">
          Use your email and password to reconnect with your collaborative projects.
        </p>

        {status === "success" && type === "verify_email" ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Email verified successfully. You can log in now.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              placeholder="Your secure password"
            />
          </label>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-stone-500">
          Need an account?{" "}
          <Link to="/signup" className="font-semibold text-stone-900">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
