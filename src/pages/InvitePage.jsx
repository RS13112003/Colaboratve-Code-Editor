import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  createWorkspaceInvitation,
  getWorkspace,
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "../lib/api";
import { formatDateTime } from "../lib/utils";
import { useParams } from "react-router-dom";

export default function InvitePage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [form, setForm] = useState({ email: "", role: "editor" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [workspaceRow, invitationRows, memberRows] = await Promise.all([
        getWorkspace(workspaceId),
        listWorkspaceInvitations(workspaceId),
        listWorkspaceMembers(workspaceId),
      ]);

      setWorkspace(workspaceRow);
      setInvitations(invitationRows);
      setMembers(memberRows);
      setCurrentRole(memberRows.find((member) => member.user_id === user.id)?.role || null);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId, user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    setError("");

    try {
      await createWorkspaceInvitation({
        workspace_id: workspaceId,
        email: form.email,
        role: form.role,
        invited_by: user.id,
      });
      setForm({ email: "", role: "editor" });
      setStatus("Invitation created. The invited user will see it in their dashboard when they sign in.");
      await load();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Invite User"
      subtitle="Invite collaborators by email and keep track of the invitation pipeline for this workspace."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
          <h2 className="section-title text-2xl text-stone-950">Invite to {workspace?.name || "workspace"}</h2>
          <p className="mt-2 text-sm text-stone-500">
            Owners can invite by email and choose whether the incoming member joins as owner or editor.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Invitee email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                disabled={currentRole !== "owner"}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-stone-100"
                placeholder="teammate@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Role</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                disabled={currentRole !== "owner"}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-stone-100"
              >
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </select>
            </label>
          </div>

          {status ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting || currentRole !== "owner"}
            className="mt-5 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Create invitation"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
            <h2 className="section-title text-2xl text-stone-950">Current members</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {members.map((member) => (
                <span
                  key={member.id}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700"
                >
                  {member.profile?.email} • {member.role}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
            <h2 className="section-title text-2xl text-stone-950">Invitation history</h2>
            <div className="mt-5 space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="font-semibold text-stone-900">{invite.email}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {invite.role} • {invite.status} • Expires {formatDateTime(invite.expires_at)}
                  </p>
                </div>
              ))}

              {!invitations.length ? (
                <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
                  No invitations have been created yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
