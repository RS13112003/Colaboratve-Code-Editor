import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  getWorkspace,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../lib/api";

export default function MembersPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [workspaceRow, memberRows] = await Promise.all([
        getWorkspace(workspaceId),
        listWorkspaceMembers(workspaceId),
      ]);

      setWorkspace(workspaceRow);
      setMembers(memberRows);
      setCurrentRole(memberRows.find((member) => member.user_id === user.id)?.role || null);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId, user?.id]);

  const handleRoleChange = async (memberId, role) => {
    try {
      await updateWorkspaceMemberRole(memberId, role);
      await load();
    } catch (roleError) {
      setError(roleError.message);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this member from the workspace?")) {
      return;
    }

    try {
      await removeWorkspaceMember(memberId);
      await load();
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  return (
    <AppShell
      title="Members Management"
      subtitle="Review who has access, promote owners, and keep editor permissions tidy."
      actions={
        <Link
          to={`/workspaces/${workspaceId}/invite`}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Invite user
        </Link>
      }
    >
      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="rounded-[1.8rem] border border-stone-200/70 bg-white/80 p-6">
        <h2 className="section-title text-2xl text-stone-950">{workspace?.name || "Workspace"} members</h2>
        <p className="mt-2 text-sm text-stone-500">Owners can change roles and remove access for teammates.</p>

        <div className="mt-6 space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-lg font-semibold text-stone-900">
                  {member.profile?.name || member.profile?.email || member.user_id}
                </p>
                <p className="text-sm text-stone-500">{member.profile?.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={member.role}
                  disabled={currentRole !== "owner" || member.user_id === user.id}
                  onChange={(event) => handleRoleChange(member.id, event.target.value)}
                  className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="owner">Owner</option>
                  <option value="editor">Editor</option>
                </select>

                {member.user_id !== user.id ? (
                  <button
                    type="button"
                    disabled={currentRole !== "owner"}
                    onClick={() => handleRemove(member.id)}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    You
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
