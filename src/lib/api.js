import { insforge } from "./insforge";

const ensure = ({ data, error }) => {
  if (error) {
    throw new Error(error.message || "Something went wrong");
  }

  return data;
};

export const signUp = async ({ email, password, name, redirectTo }) => {
  return ensure(
    await insforge.auth.signUp({
      email,
      password,
      name,
      redirectTo,
    }),
  );
};

export const verifyEmail = async ({ email, otp }) => {
  return ensure(await insforge.auth.verifyEmail({ email, otp }));
};

export const resendVerificationEmail = async ({ email, redirectTo }) => {
  return ensure(await insforge.auth.resendVerificationEmail({ email, redirectTo }));
};

export const signIn = async ({ email, password }) => {
  return ensure(await insforge.auth.signInWithPassword({ email, password }));
};

export const signOut = async () => {
  const { error } = await insforge.auth.signOut();

  if (error) {
    throw new Error(error.message || "Unable to sign out");
  }
};

export const getCurrentUser = async () => {
  const data = ensure(await insforge.auth.getCurrentUser());
  return data.user;
};

export const getProfile = async (userId) => {
  return ensure(
    await insforge.database.from("profiles").select("*").eq("id", userId).maybeSingle(),
  );
};

export const updateProfile = async (userId, profile) => {
  await ensure(
    await insforge.auth.setProfile({
      name: profile.name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
    }),
  );

  return ensure(
    await insforge.database
      .from("profiles")
      .update(profile)
      .eq("id", userId)
      .select("*")
      .single(),
  );
};

export const listMyWorkspaces = async (userId) => {
  const memberships = ensure(
    await insforge.database
      .from("workspace_members")
      .select("*")
      .eq("user_id", userId),
  );

  if (!memberships.length) {
    return [];
  }

  const workspaceIds = memberships.map((membership) => membership.workspace_id);
  const workspaces = ensure(
    await insforge.database
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
      .order("updated_at", { ascending: false }),
  );

  return workspaces.map((workspace) => ({
    ...workspace,
    membership: memberships.find((membership) => membership.workspace_id === workspace.id),
  }));
};

export const listPendingInvitations = async (email) => {
  const invitations = ensure(
    await insforge.database
      .from("workspace_invitations")
      .select("*")
      .eq("status", "pending")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false }),
  );

  if (!invitations.length) {
    return [];
  }

  const workspaceIds = invitations.map((invite) => invite.workspace_id);
  const workspaces = ensure(
    await insforge.database.from("workspaces").select("*").in("id", workspaceIds),
  );

  return invitations.map((invite) => ({
    ...invite,
    workspace: workspaces.find((workspace) => workspace.id === invite.workspace_id) || null,
  }));
};

export const createWorkspace = async ({ name, description }) => {
  return ensure(
    await insforge.database.rpc("create_workspace", {
      workspace_name: name,
      workspace_description: description,
    }),
  );
};

export const getWorkspace = async (workspaceId) => {
  return ensure(
    await insforge.database.from("workspaces").select("*").eq("id", workspaceId).single(),
  );
};

export const updateWorkspace = async (workspaceId, payload) => {
  return ensure(
    await insforge.database
      .from("workspaces")
      .update(payload)
      .eq("id", workspaceId)
      .select("*")
      .single(),
  );
};

export const deleteWorkspace = async (workspaceId) => {
  ensure(await insforge.database.from("workspaces").delete().eq("id", workspaceId));
};

export const listWorkspaceFiles = async (workspaceId) => {
  return ensure(
    await insforge.database
      .from("workspace_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true }),
  );
};

export const createWorkspaceFile = async (payload) => {
  return ensure(
    await insforge.database.from("workspace_files").insert([payload]).select("*").single(),
  );
};

export const updateWorkspaceFile = async (fileId, payload) => {
  return ensure(
    await insforge.database
      .from("workspace_files")
      .update(payload)
      .eq("id", fileId)
      .select("*")
      .single(),
  );
};

export const deleteWorkspaceFile = async (fileId) => {
  ensure(await insforge.database.from("workspace_files").delete().eq("id", fileId));
};

export const listWorkspaceMembers = async (workspaceId) => {
  const members = ensure(
    await insforge.database
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
  );

  if (!members.length) {
    return [];
  }

  const profileIds = members.map((member) => member.user_id);
  const profiles = ensure(
    await insforge.database.from("profiles").select("*").in("id", profileIds),
  );

  return members.map((member) => ({
    ...member,
    profile: profiles.find((profile) => profile.id === member.user_id) || null,
  }));
};

export const updateWorkspaceMemberRole = async (memberId, role) => {
  return ensure(
    await insforge.database
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId)
      .select("*")
      .single(),
  );
};

export const removeWorkspaceMember = async (memberId) => {
  ensure(await insforge.database.from("workspace_members").delete().eq("id", memberId));
};

export const listWorkspaceInvitations = async (workspaceId) => {
  return ensure(
    await insforge.database
      .from("workspace_invitations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  );
};

export const createWorkspaceInvitation = async (payload) => {
  return ensure(
    await insforge.database
      .from("workspace_invitations")
      .insert([
        {
          ...payload,
          email: payload.email.toLowerCase(),
        },
      ])
      .select("*")
      .single(),
  );
};

export const acceptWorkspaceInvitation = async (invitationId) => {
  return ensure(
    await insforge.database.rpc("accept_workspace_invitation", {
      invitation_id: invitationId,
    }),
  );
};

export const declineWorkspaceInvitation = async (invitationId) => {
  return ensure(
    await insforge.database.rpc("decline_workspace_invitation", {
      invitation_id: invitationId,
    }),
  );
};
