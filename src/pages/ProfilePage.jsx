import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../lib/api";

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    avatar_url: "",
    bio: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const currentProfile = profile || (await getProfile(user.id));
      setForm({
        name: currentProfile?.name || user.profile?.name || "",
        avatar_url: currentProfile?.avatar_url || "",
        bio: currentProfile?.bio || "",
      });
    };

    load();
  }, [user, profile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    setError("");

    try {
      const updated = await updateProfile(user.id, form);
      setProfile(updated);
      setStatus("Profile updated successfully.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="User Profile"
      subtitle="Manage the public identity your collaborators see inside workspaces and invitation views."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Identity card</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-orange-300 to-rose-300 text-2xl font-bold text-white">
              {(form.name || user?.email || "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="section-title text-2xl text-stone-950">{form.name || "Your name"}</h2>
              <p className="text-sm text-stone-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-600">
            {form.bio || "Add a short bio so teammates know what you bring into the room."}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
          <h2 className="section-title text-2xl text-stone-950">Edit profile</h2>
          <div className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Display name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="Your name"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Avatar URL</span>
              <input
                value={form.avatar_url}
                onChange={(event) => setForm((current) => ({ ...current, avatar_url: event.target.value }))}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="https://example.com/avatar.png"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Bio</span>
              <textarea
                rows={5}
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="Collaborative frontend engineer, design systems fan, and debugging partner."
              />
            </label>
          </div>

          {status ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
