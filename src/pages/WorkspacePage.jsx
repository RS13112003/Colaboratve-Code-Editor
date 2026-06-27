import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Eye,
  EyeOff,
  FilePlus2,
  FolderCog,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  createWorkspaceFile,
  getWorkspace,
  listWorkspaceFiles,
  listWorkspaceMembers,
  updateWorkspaceFile,
  deleteWorkspaceFile,
} from "../lib/api";
import { insforge } from "../lib/insforge";
import {
  buildPreviewDocument,
  formatDateTime,
  getLanguageLabel,
  normalizeFileName,
} from "../lib/utils";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { user, profile } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [editorValue, setEditorValue] = useState("");
  const [previewVisible, setPreviewVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("Idle");
  const [newFile, setNewFile] = useState({ name: "", language: "html" });
  const [remoteCursors, setRemoteCursors] = useState({});
  const [creatingFile, setCreatingFile] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);
  const saveTimerRef = useRef(null);
  const publishTimerRef = useRef(null);
  const currentFileChannelRef = useRef(null);
  const subscribedChannelsRef = useRef(new Set());
  const applyingRemoteUpdateRef = useRef(false);

  const activeFile = files.find((file) => file.id === activeFileId) || null;
  const currentMember = members.find((member) => member.user_id === user?.id) || null;

  const refreshMembers = async () => {
    const memberRows = await listWorkspaceMembers(workspaceId);
    setMembers(memberRows);
  };

  const refreshFiles = async () => {
    const fileRows = await listWorkspaceFiles(workspaceId);
    setFiles(fileRows);

    if (!activeFileId && fileRows.length) {
      setActiveFileId(fileRows[0].id);
    }
  };

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError("");

    try {
      const [workspaceRow, fileRows, memberRows] = await Promise.all([
        getWorkspace(workspaceId),
        listWorkspaceFiles(workspaceId),
        listWorkspaceMembers(workspaceId),
      ]);

      setWorkspace(workspaceRow);
      setFiles(fileRows);
      setMembers(memberRows);
      setActiveFileId((current) => current || fileRows[0]?.id || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  useEffect(() => {
    if (activeFile) {
      setEditorValue(activeFile.content);
    }
  }, [activeFile?.id, activeFile?.content]);

  const getPayloadChannel = (payload) => payload?.meta?.channel || payload?.channel;

  const ensureRealtimeSubscription = async (channel) => {
    if (subscribedChannelsRef.current.has(channel)) {
      return null;
    }

    await insforge.realtime.connect();
    const response = await insforge.realtime.subscribe(channel);

    if (!response?.ok) {
      throw new Error(response?.error?.message || `Unable to subscribe to ${channel}`);
    }

    subscribedChannelsRef.current.add(channel);
    return response;
  };

  useEffect(() => {
    if (!workspaceId || !user) return undefined;

    let cancelled = false;
    const workspaceChannel = `workspace:${workspaceId}`;

    const handlePresenceJoin = (payload) => {
      if (payload?.meta?.channel !== workspaceChannel) return;
      setOnlineMembers((current) => {
        if (current.some((member) => member.presenceId === payload.member.presenceId)) {
          return current;
        }

        return [...current, payload.member];
      });
    };

    const handlePresenceLeave = (payload) => {
      if (payload?.meta?.channel !== workspaceChannel) return;
      setOnlineMembers((current) =>
        current.filter((member) => member.presenceId !== payload.member.presenceId),
      );
    };

    const handleWorkspaceFileChanged = async (payload) => {
      if (getPayloadChannel(payload) !== workspaceChannel || payload?.meta?.senderId === user.id) return;
      await refreshFiles();
    };

    const handleWorkspaceMemberChanged = async (payload) => {
      if (getPayloadChannel(payload) !== workspaceChannel || payload?.meta?.senderId === user.id) return;
      await refreshMembers();
    };

    const connect = async () => {
      try {
        const subscription = await ensureRealtimeSubscription(workspaceChannel);

        if (!cancelled && subscription) {
          setOnlineMembers(subscription?.presence?.members || []);
        }

        insforge.realtime.on("presence:join", handlePresenceJoin);
        insforge.realtime.on("presence:leave", handlePresenceLeave);
        insforge.realtime.on("workspace_file_changed", handleWorkspaceFileChanged);
        insforge.realtime.on("workspace_member_changed", handleWorkspaceMemberChanged);
      } catch (realtimeError) {
        if (!cancelled) {
          setError(realtimeError.message);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      insforge.realtime.off("presence:join", handlePresenceJoin);
      insforge.realtime.off("presence:leave", handlePresenceLeave);
      insforge.realtime.off("workspace_file_changed", handleWorkspaceFileChanged);
      insforge.realtime.off("workspace_member_changed", handleWorkspaceMemberChanged);
      subscribedChannelsRef.current.delete(workspaceChannel);
      insforge.realtime.unsubscribe(workspaceChannel);
    };
  }, [workspaceId, user?.id]);

  useEffect(() => {
    if (!workspaceId || !user || !activeFile) return undefined;

    let cancelled = false;
    const fileChannel = `workspace:${workspaceId}:file:${activeFile.id}`;
    currentFileChannelRef.current = fileChannel;

    const handleRemoteContent = (payload) => {
      if (getPayloadChannel(payload) !== fileChannel || payload?.meta?.senderId === user.id) return;
      if (payload.fileId !== activeFile.id) return;

      setFiles((current) =>
        current.map((file) =>
          file.id === payload.fileId
            ? {
                ...file,
                content: payload.content,
              }
            : file,
        ),
      );

      setEditorValue(payload.content);
      setSaveStatus(`${payload.userName || "A teammate"} is editing`);

      if (editorRef.current && editorRef.current.getValue() !== payload.content) {
        applyingRemoteUpdateRef.current = true;
        editorRef.current.setValue(payload.content);
        applyingRemoteUpdateRef.current = false;
      }
    };

    const handleRemoteCursor = (payload) => {
      if (getPayloadChannel(payload) !== fileChannel || payload?.meta?.senderId === user.id) return;
      if (payload.fileId !== activeFile.id) return;

      setRemoteCursors((current) => ({
        ...current,
        [payload.meta.senderId]: {
          ...payload.position,
          userName: payload.userName,
        },
      }));
    };

    const connect = async () => {
      try {
        await ensureRealtimeSubscription(fileChannel);
        insforge.realtime.on("file_content_sync", handleRemoteContent);
        insforge.realtime.on("cursor_moved", handleRemoteCursor);
      } catch (realtimeError) {
        if (!cancelled) {
          setError(realtimeError.message);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      setRemoteCursors({});
      insforge.realtime.off("file_content_sync", handleRemoteContent);
      insforge.realtime.off("cursor_moved", handleRemoteCursor);
      subscribedChannelsRef.current.delete(fileChannel);
      if (currentFileChannelRef.current === fileChannel) {
        currentFileChannelRef.current = null;
      }
      insforge.realtime.unsubscribe(fileChannel);
    };
  }, [workspaceId, activeFile?.id, user?.id]);

  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimerRef.current);
      window.clearTimeout(publishTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = Object.values(remoteCursors).map((cursor) => ({
      range: new monacoRef.current.Range(
        cursor.lineNumber,
        cursor.column,
        cursor.lineNumber,
        cursor.column + 1,
      ),
      options: {
        inlineClassName: "remote-cursor-marker",
        className: "remote-cursor-line",
        hoverMessage: {
          value: `${cursor.userName || "Collaborator"} at line ${cursor.lineNumber}, column ${cursor.column}`,
        },
      },
    }));

    decorationIdsRef.current = editorRef.current.deltaDecorations(
      decorationIdsRef.current,
      decorations,
    );
  }, [remoteCursors]);

  const publishWorkspaceEvent = async (event, payload) => {
    try {
      await insforge.realtime.publish(`workspace:${workspaceId}`, event, payload);
    } catch (publishError) {
      console.error(publishError);
    }
  };

  const handleEditorChange = (nextValue = "") => {
    if (applyingRemoteUpdateRef.current || !activeFile || !currentMember) return;

    setEditorValue(nextValue);
    setSaveStatus("Editing...");
    setFiles((current) =>
      current.map((file) => (file.id === activeFile.id ? { ...file, content: nextValue } : file)),
    );

    window.clearTimeout(saveTimerRef.current);
    window.clearTimeout(publishTimerRef.current);

    publishTimerRef.current = window.setTimeout(async () => {
      try {
        const targetChannel = currentFileChannelRef.current;

        if (!targetChannel) return;

        await ensureRealtimeSubscription(targetChannel);

        if (currentFileChannelRef.current !== targetChannel) return;

        await insforge.realtime.publish(targetChannel, "file_content_sync", {
          fileId: activeFile.id,
          content: nextValue,
          userName: profile?.name || user.email,
        });
      } catch (publishError) {
        console.error(publishError);
      }
    }, 180);

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const updated = await updateWorkspaceFile(activeFile.id, {
          content: nextValue,
          updated_by: user.id,
        });

        setFiles((current) =>
          current.map((file) => (file.id === updated.id ? updated : file)),
        );
        setSaveStatus(`Saved ${formatDateTime(updated.updated_at)}`);
      } catch (saveError) {
        setError(saveError.message);
      }
    }, 900);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((event) => {
      const targetChannel = currentFileChannelRef.current;

      if (!targetChannel || !activeFile) return;

      insforge.realtime
        .connect()
        .then(() => ensureRealtimeSubscription(targetChannel))
        .then(() =>
          insforge.realtime.publish(targetChannel, "cursor_moved", {
            fileId: activeFile.id,
            userName: profile?.name || user.email,
            position: {
              lineNumber: event.position.lineNumber,
              column: event.position.column,
            },
          }),
        )
        .catch((publishError) => console.error(publishError));
    });
  };

  const handleCreateFile = async (event) => {
    event.preventDefault();
    setCreatingFile(true);
    setError("");

    try {
      const created = await createWorkspaceFile({
        workspace_id: workspaceId,
        created_by: user.id,
        updated_by: user.id,
        name: normalizeFileName(newFile.name, newFile.language),
        language: newFile.language,
        content: "",
        sort_order: files.length + 1,
      });

      setFiles((current) => [...current, created]);
      setActiveFileId(created.id);
      setNewFile({ name: "", language: "html" });
      await publishWorkspaceEvent("workspace_file_changed", {
        fileId: created.id,
        action: "created",
      });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setCreatingFile(false);
    }
  };

  const handleRenameFile = async (file) => {
    const nextName = window.prompt("Rename file", file.name);
    if (!nextName) return;

    try {
      const updated = await updateWorkspaceFile(file.id, {
        name: nextName.trim(),
        updated_by: user.id,
      });
      setFiles((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      await publishWorkspaceEvent("workspace_file_changed", {
        fileId: updated.id,
        action: "renamed",
      });
    } catch (renameError) {
      setError(renameError.message);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (files.length === 1) {
      setError("Keep at least one file in the workspace.");
      return;
    }

    if (!window.confirm("Delete this file?")) {
      return;
    }

    try {
      await deleteWorkspaceFile(fileId);
      const remaining = files.filter((file) => file.id !== fileId);
      setFiles(remaining);
      setActiveFileId(remaining[0]?.id || null);
      await publishWorkspaceEvent("workspace_file_changed", {
        fileId,
        action: "deleted",
      });
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const previewDocument = buildPreviewDocument(files);

  return (
    <AppShell
      title={workspace?.name || "Workspace"}
      subtitle={workspace?.description || "Collaborate on code, manage files, and preview your app live."}
      actions={
        <>
          <Link
            to={`/workspaces/${workspaceId}/members`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
          >
            Members
          </Link>
          <Link
            to={`/workspaces/${workspaceId}/invite`}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
          >
            Invite
          </Link>
          <Link
            to={`/workspaces/${workspaceId}/settings`}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold !text-white"
          >
            <FolderCog className="h-4 w-4 flex-shrink-0" />
            <span className="!text-white">Settings</span>
          </Link>
        </>
      }
    >
      {loading ? <p className="text-sm text-stone-500">Loading workspace...</p> : null}
      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-[1.8rem] border border-stone-200/70 bg-white/75 p-4">
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Presence</p>
                <h2 className="section-title mt-2 text-xl text-stone-950">Online now</h2>
              </div>
              <Users className="h-5 w-5 text-stone-400" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {onlineMembers.map((presence) => {
                const member = members.find((entry) => entry.user_id === presence.presenceId);

                return (
                  <span
                    key={presence.presenceId}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {member?.profile?.name || member?.profile?.email || presence.presenceId}
                  </span>
                );
              })}

              {!onlineMembers.length ? (
                <span className="text-sm text-stone-500">You are the first one in this room.</span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Files</p>
                <h2 className="section-title mt-2 text-xl text-stone-950">Workspace assets</h2>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`rounded-2xl border px-3 py-3 ${
                    file.id === activeFileId
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFileId(file.id)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className={`text-xs ${file.id === activeFileId ? "text-stone-300" : "text-stone-400"}`}>
                        {getLanguageLabel(file.language)}
                      </p>
                    </div>
                  </button>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRenameFile(file)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        file.id === activeFileId ? "bg-white/15 text-white" : "bg-white text-stone-600"
                      }`}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        file.id === activeFileId ? "bg-white/15 text-white" : "bg-white text-rose-600"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentMember?.role ? (
              <form onSubmit={handleCreateFile} className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <FilePlus2 className="h-4 w-4" />
                  New file
                </div>
                <div className="mt-3 space-y-2">
                  <input
                    value={newFile.name}
                    onChange={(event) => setNewFile((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="feature-panel"
                  />
                  <select
                    value={newFile.language}
                    onChange={(event) => setNewFile((current) => ({ ...current, language: event.target.value }))}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingFile}
                  className="mt-3 w-full rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  {creatingFile ? "Creating..." : "Add file"}
                </button>
              </form>
            ) : null}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[1.8rem] border border-stone-200/70 bg-white/75 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Active file</p>
              <h2 className="section-title mt-2 text-2xl text-stone-950">{activeFile?.name || "Select a file"}</h2>
              <p className="mt-1 text-sm text-stone-500">{saveStatus}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewVisible((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              >
                {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {previewVisible ? "Hide preview" : "Show preview"}
              </button>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                <Send className="h-4 w-4" />
                Realtime sync
              </span>
            </div>
          </div>

          <div className={`grid gap-4 ${previewVisible ? "2xl:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
            <div className="overflow-hidden rounded-[1.8rem] border border-stone-200/70 bg-[#161616]">
              <Editor
                key={activeFile?.id}
                height="72vh"
                language={activeFile?.language === "javascript" ? "javascript" : activeFile?.language || "html"}
                value={editorValue}
                theme="vs-dark"
                onMount={handleEditorMount}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  roundedSelection: true,
                  padding: { top: 18 },
                  smoothScrolling: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            {previewVisible ? (
              <div className="overflow-hidden rounded-[1.8rem] border border-stone-200/70 bg-white">
                <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Live preview</p>
                    <p className="text-sm text-stone-500">Rendered from your current HTML, CSS, and JS files.</p>
                  </div>
                </div>
                <iframe title="Live preview" srcDoc={previewDocument} className="h-[72vh] w-full bg-white" />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
