import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderPlus, Trash2, Users, WandSparkles } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  acceptWorkspaceInvitation,
  createWorkspace,
  declineWorkspaceInvitation,
  deleteWorkspace,
  listMyWorkspaces,
  listPendingInvitations,
} from "../lib/api";
import { formatDateTime, getWorkspaceAccent } from "../lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [invites, setInvites] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const [workspaceRows, invitationRows] = await Promise.all([
        listMyWorkspaces(user.id),
        listPendingInvitations(user.email),
      ]);
      setWorkspaces(workspaceRows);
      setInvites(invitationRows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleCreateWorkspace = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createWorkspace({
        ...form,
      });
      setForm({ name: "", description: "" });
      await loadDashboard();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Delete this workspace and all of its files?")) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      await loadDashboard();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleAcceptInvite = async (invitationId) => {
    try {
      await acceptWorkspaceInvitation(invitationId);
      await loadDashboard();
    } catch (inviteError) {
      setError(inviteError.message);
    }
  };

  const handleDeclineInvite = async (invitationId) => {
    try {
      await declineWorkspaceInvitation(invitationId);
      await loadDashboard();
    } catch (inviteError) {
      setError(inviteError.message);
    }
  };

  return (
    <AppShell
      title="Dashboard"
      subtitle="Create workspaces, review invitations, and jump back into the projects you share with your team."
      actions={
        <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
          InsForge + PostgreSQL
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title text-2xl text-stone-950">Your workspaces</h2>
              <p className="text-sm text-stone-500">Every collaborative room you own or edit lives here.</p>
            </div>
          </div>

          {loading ? <p className="text-sm text-stone-500">Loading workspaces...</p> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace, index) => (
              <div
                key={workspace.id}
                className="overflow-hidden rounded-[1.8rem] border border-stone-200/70 bg-white/75"
              >
                <div className={`h-2 bg-gradient-to-r ${getWorkspaceAccent(index)}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                        {workspace.membership?.role}
                      </p>
                      <h3 className="section-title mt-3 text-2xl text-stone-950">{workspace.name}</h3>
                      <p className="mt-3 text-sm leading-7 text-stone-500">{workspace.description || "No description yet."}</p>
                    </div>

                    {workspace.membership?.role === "owner" ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkspace(workspace.id)}
                        className="rounded-full border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-stone-400">
                    <span>Updated {formatDateTime(workspace.updated_at)}</span>
                    <Link to={`/workspaces/${workspace.id}`} className="font-semibold text-stone-900">
                      Open workspace
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {!loading && !workspaces.length ? (
              <div className="rounded-[1.8rem] border border-dashed border-stone-300 bg-white/55 p-6 text-sm text-stone-500">
                No workspaces yet. Create one to get your starter HTML, CSS, and JavaScript files instantly.
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <form onSubmit={handleCreateWorkspace} className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <FolderPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title text-xl text-stone-950">Create workspace</h2>
                <p className="text-sm text-stone-500">Bootstrap a new collaborative coding room.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="Workspace name"
              />
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                placeholder="What are you building here?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Create workspace"}
            </button>
          </form>

          <div className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title text-xl text-stone-950">Pending invitations</h2>
                <p className="text-sm text-stone-500">Accept shared workspaces addressed to your email.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="font-semibold text-stone-900">{invite.workspace?.name || "Workspace invite"}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Role: {invite.role} • Expires {formatDateTime(invite.expires_at)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptInvite(invite.id)}
                      className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineInvite(invite.id)}
                      className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {!invites.length ? (
                <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
                  No invitations waiting for you right now.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-stone-200/70 bg-gradient-to-br from-stone-900 to-stone-700 p-5 text-white">
            <div className="flex items-center gap-3">
              <WandSparkles className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Built-in starter kit</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-200">
              Every new workspace gets `index.html`, `styles.css`, and `script.js` automatically so teammates can start collaborating immediately.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
