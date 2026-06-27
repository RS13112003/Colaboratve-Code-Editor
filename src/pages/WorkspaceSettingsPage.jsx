import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { deleteWorkspace, getWorkspace, listWorkspaceMembers, updateWorkspace } from "../lib/api";

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [memberRole, setMemberRole] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [workspaceRow, members] = await Promise.all([
          getWorkspace(workspaceId),
          listWorkspaceMembers(workspaceId),
        ]);
        setWorkspace(workspaceRow);
        setForm({
          name: workspaceRow.name,
          description: workspaceRow.description || "",
        });
        setMemberRole(members.find((member) => member.user_id === user.id)?.role || null);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    load();
  }, [workspaceId, user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    setError("");

    try {
      const updated = await updateWorkspace(workspaceId, form);
      setWorkspace(updated);
      setStatus("Workspace settings updated.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this workspace and all files?")) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      navigate("/dashboard");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <AppShell
      title="Workspace Settings"
      subtitle="Update the workspace identity and remove it permanently if the project has reached the end of the road."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
          <h2 className="section-title text-2xl text-stone-950">{workspace?.name || "Workspace"}</h2>
          <p className="mt-2 text-sm text-stone-500">Only owners can update settings or delete the workspace.</p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Workspace name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                disabled={memberRole !== "owner"}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-stone-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Description</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                disabled={memberRole !== "owner"}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-stone-100"
              />
            </label>
          </div>

          {status ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting || memberRole !== "owner"}
            className="mt-5 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save settings"}
          </button>
        </form>

        <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50/90 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Danger zone</p>
          <h2 className="section-title mt-3 text-2xl text-rose-900">Delete workspace</h2>
          <p className="mt-3 text-sm leading-7 text-rose-700">
            This removes every file, member record, and invitation attached to this workspace.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={memberRole !== "owner"}
            className="mt-5 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete workspace
          </button>
        </div>
      </div>
    </AppShell>
  );
}
