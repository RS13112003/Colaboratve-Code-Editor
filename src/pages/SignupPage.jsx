import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resendVerificationEmail, signUp, verifyEmail } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = `${window.location.origin}/login`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setSubmitting(true);

    try {
      const result = await signUp({
        ...form,
        redirectTo,
      });

      if (result.requireEmailVerification) {
        setAwaitingVerification(true);
        setStatus("We sent a verification code to your email. Enter it below to activate your account.");
      } else {
        await refreshAuth();
        navigate("/dashboard");
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setStatus("");

    try {
      await verifyEmail({
        email: form.email,
        otp,
      });
      await refreshAuth();
      navigate("/dashboard");
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setSubmitting(true);
    setError("");

    try {
      await resendVerificationEmail({
        email: form.email,
        redirectTo,
      });
      setStatus("A fresh verification code is on its way.");
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-panel w-full max-w-xl rounded-[2.2rem] p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Create account</p>
        <h1 className="section-title mt-3 text-4xl text-stone-950">Start your first collaborative room.</h1>
        <p className="mt-3 text-sm leading-7 text-stone-500">
          Build with InsForge auth, PostgreSQL storage, and realtime collaboration from day one.
        </p>

        <form onSubmit={awaitingVerification ? handleVerify : handleSubmit} className="mt-8 space-y-4">
          {!awaitingVerification ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">Display name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  placeholder="Ranit"
                />
              </label>

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
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  placeholder="At least 6 characters"
                />
              </label>
            </>
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Verification code</span>
              <input
                required
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="6-digit code"
              />
            </label>
          )}

          {status ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Working..." : awaitingVerification ? "Verify and continue" : "Create account"}
          </button>
        </form>

        {awaitingVerification ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={submitting}
            className="mt-3 text-sm font-semibold text-[var(--accent)]"
          >
            Resend code
          </button>
        ) : null}

        <p className="mt-6 text-sm text-stone-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-stone-900">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
