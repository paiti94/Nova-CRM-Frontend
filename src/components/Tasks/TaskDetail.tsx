// client/src/components/Tasks/TaskDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import type { Task } from '../../types/task';
import { useTaskMutations } from '../../hooks/useTaskMutations';
import CreatableSelect from 'react-select/creatable';
import type { GroupBase, StylesConfig } from 'react-select';

interface TaskDetailProps {
  task: Task;
  effectiveClientId?: string | null;

  /** who is viewing this task */
  currentUserId?: string;              // pass user?._id
  currentUserRole?: 'admin' | 'user';  // pass user?.role if you have it

  /** kept for backward compat with your delete check */
  userIdForDeleteCheck?: string;

  UploadModal?: React.ComponentType<any>;
  onDeleted?: () => void;  
}
type UserLite = { id?: string; _id?: string; name?: string; email?: string };

type Option = { value: string; label: string };

/* ---------------- helpers ---------------- */

function normalizeAssignees(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) {
    return x.map((u) => (typeof u === 'string' ? u : u?._id)).filter(Boolean);
  }
  return [String(x)]; // legacy single id
}

function sameDateYMD(a?: string | Date | null, b?: string | Date | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return (
    da instanceof Date &&
    db instanceof Date &&
    !isNaN(da.getTime()) &&
    !isNaN(db.getTime()) &&
    da.toISOString().slice(0, 10) === db.toISOString().slice(0, 10)
  );
}

function toISOAtLocalMidnight(ymd: string | undefined) {
  if (!ymd) return undefined;
  const d = new Date(`${ymd}T00:00:00`);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/* ---------------- component ---------------- */

export function TaskDetail({
  task,
  effectiveClientId,
  currentUserId,
  currentUserRole = 'user',
  userIdForDeleteCheck,
  UploadModal,
  onDeleted,
}: TaskDetailProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolderId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { getAuthToken } = useAuthenticatedApi();
  const { updateTask, completeTask, deleteTask } = useTaskMutations();

  /* ----- permissions ----- */
  const isOwner = currentUserId && task.createdBy === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const isAssignee = Array.isArray((task as any).assignedTo)
    ? (currentUserId ? (task as any).assignedTo.includes(currentUserId) : false)
    : (currentUserId ? (task as any).assignedTo === currentUserId : false);

  const canEditEverything = !!(isAdmin || isOwner);
  const canEditStatusOnly = !canEditEverything && !!isAssignee;

  const canUpload = !!effectiveClientId;

  function userToOption(u: UserLite): Option {
    const uid = (u.id ?? u._id)!;                 // <-- key change
    const primary = u.name || '';
    const label = primary ? `${primary}${u.email ? ` (${u.email})` : ''}` : (u.email ?? uid);
    return { value: uid, label };
  }
  /* ----- users for assignee selector ----- */
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'raw'],  // << different key to avoid stomping
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/users');
      return data as Array<{ _id: string; name?: string; email?: string }>;
    },
  });

  const userOptions: Option[] = (users || []).map(userToOption);

  const optionById = React.useMemo(() => {
    const m = new Map<string, Option>();
    for (const u of users as UserLite[]) {
      const uid = (u.id ?? u._id);
      if (!uid) continue;
      m.set(uid, userToOption(u));
    }
    return m;
  }, [users]);

  /* ----- form (controlled, only submit patch on Update) ----- */
  const [form, setForm] = useState(() => ({
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    priority: (task as any).priority || 'medium',
    status: task.status,
    assignedTo: normalizeAssignees((task as any).assignedTo),
  }));

  // sync when switching tasks
  React.useEffect(() => {
    setForm({
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      priority: (task as any).priority || 'medium',
      status: task.status, // <- keep in sync
      assignedTo: Array.isArray((task as any).assignedTo)
        ? (task as any).assignedTo.map((u: any) => (typeof u === 'string' ? u : u?._id)).filter(Boolean)
        : (task as any).assignedTo ? [String((task as any).assignedTo)] : [],
    });
  }, [task._id, task.status, task.dueDate, (task as any).priority, (task as any).assignedTo]);

  const valueOptions: Option[] = (form.assignedTo || []).map((id: string) =>
    optionById.get(id) || { value: id, label: id } // brief fallback until users load
  );

  const optionsWithSelectedFirst = useMemo(() => {
    const selected = new Set(form.assignedTo);
    return [
      ...userOptions.filter(o => selected.has(o.value)),
      ...userOptions.filter(o => !selected.has(o.value)),
    ];
  }, [userOptions, form.assignedTo]);
    

  /* ----- files & comments queries ----- */
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['filesByTask', task._id],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get(`/files/task/${task._id}`);
      return data;
    },
    enabled: !!task?._id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['taskComments', task._id],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get(`/tasks/${task._id}/comments`);
      return data;
    },
    enabled: !!task?._id,
  });

  const addComment = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      await getAuthToken();
      const { data } = await api.post(`/tasks/${task._id}/comments`, { content });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taskComments', task._id] }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await getAuthToken();
      await api.delete(`/tasks/${task._id}/comments/${commentId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taskComments', task._id] }),
  });

  const downloadFile = useMutation({
    mutationFn: async (fileId: string) => {
      await getAuthToken();
      const { data } = await api.get(`/files/download/${fileId}`);
      return data.downloadUrl;
    },
    onSuccess: (url) => window.open(url, '_blank'),
  });

  /* ----- Update button → send diffs only ----- */
  const onUpdate = () => {
    const current = {
      status: task.status,
      priority: (task as any).priority ?? 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      assignedTo: normalizeAssignees((task as any).assignedTo),
    };

    const diffs: Record<string, any> = {};

    // Status change (allowed for assignee, owner, admin)
    if (form.status !== current.status) {
      diffs.status = form.status;
    }

    if (canEditEverything) {
      if (form.priority !== current.priority) {
        diffs.priority = form.priority;
      }

      // compare date by Y-M-D
      if (!sameDateYMD(form.dueDate, current.dueDate)) {
        diffs.dueDate = form.dueDate ? toISOAtLocalMidnight(form.dueDate) : null;
      }

      // assignedTo array compare
      const formIds = Array.isArray(form.assignedTo) ? form.assignedTo : [];
      const sameAssignees =
        formIds.length === current.assignedTo.length &&
        formIds.every((id: string) => current.assignedTo.includes(id));
      if (!sameAssignees) {
        diffs.assignedTo = formIds;
      }
    } else if (canEditStatusOnly) {
      // if you only can change status, ensure we don't send other fields
      const onlyStatus: Record<string, any> = {};
      if ('status' in diffs) onlyStatus.status = diffs.status;
      Object.keys(diffs).forEach((k) => delete diffs[k]);
      Object.assign(diffs, onlyStatus);
    }

    if (Object.keys(diffs).length === 0) return;
    updateTask.mutate({ id: task._id, patch: diffs });
  };

  /* ---------------- render ---------------- */

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <p className="text-gray-600 mt-2 whitespace-pre-wrap">{task.description}</p>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Due Date (owner/admin) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Due date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            disabled={!canEditEverything}
          />
        </div>

        {/* Priority (owner/admin) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as any }))}
            disabled={!canEditEverything}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Status (assignee or owner/admin) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
            disabled={!canEditStatusOnly && !canEditEverything}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Assignees (owner/admin) */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Assignees</label>
        <CreatableSelect
          isMulti
          isDisabled={!canEditEverything}
          options={optionsWithSelectedFirst}
          value={valueOptions}
          className="react-select-container mt-1"
          classNamePrefix="react-select"

          // ✅ Render in a portal and ensure it stacks ABOVE the OverlayPanel
          menuPortalTarget={document.body}
          menuPosition="fixed"
          menuShouldScrollIntoView={false}
          closeMenuOnScroll={false}

          // ⬅️ KEY: put the portal/menu above the overlay (which you set ~3000)
          styles={{
            ...customStyles,
            menuPortal: (base) => ({ ...base, zIndex: 4000 }),
            menu:       (base) => ({ ...base, zIndex: 4001 }),
          }}
      
          isValidNewOption={() => false}
          onChange={(selected) =>
            setForm((f) => ({
              ...f,
              assignedTo: (selected as Option[]).map((o) => o.value),
            }))
          }
        />
        <p className="mt-1 text-xs text-gray-500">
          Current assignees appear first. Start typing a name or email to filter.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
          onClick={onUpdate}
          disabled={updateTask.isPending || (!canEditEverything && !canEditStatusOnly)}
        >
          {updateTask.isPending ? 'Updating…' : 'Update'}
        </button>

        {form.status !== 'completed' && (isAssignee || isOwner || isAdmin) && (
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
            onClick={() =>
              completeTask.mutate(task._id, {
                onSuccess: () => {
                  // reflect completion right away in the detail view
                  setForm((f) => ({ ...f, status: 'completed' }));
                  // refresh lists/columns if needed
                  qc.invalidateQueries({ queryKey: ['tasks'] });
                  qc.invalidateQueries({ queryKey: ['tasks', 'outlook'] });
                },
              })
            }
            disabled={completeTask.isPending}
          >
            {completeTask.isPending ? 'Completing…' : 'Mark Completed'}
          </button>
        )}

        {(isOwner || isAdmin || userIdForDeleteCheck === task.createdBy) && (
         <button
         className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
         onClick={() =>
           deleteTask.mutate(task._id, {
             onSuccess: () => {
               // invalidate usual queries
               qc.invalidateQueries({ queryKey: ['tasks'] });
               qc.invalidateQueries({ queryKey: ['tasks', 'outlook'] });
               // tell board to close the panel & clear selection
               onDeleted?.();
             },
           })
         }
         disabled={deleteTask.isPending}
       >
            {deleteTask.isPending ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>

      {/* Attachments */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">Attachments</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!canUpload) return;
            setShowUploadModal(true);
          }}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          disabled={!canUpload}
        >
          Upload Files
        </button>

        {!canUpload && (
          <p className="mt-1 text-xs text-amber-600">
            Select a client first to upload files.
          </p>
        )}

        {UploadModal && showUploadModal && (
          <UploadModal
            folderId={selectedFolderId || ''}
            onClose={() => setShowUploadModal(false)}
            clientId={effectiveClientId}
            taskManagement={true}
            taskId={task._id}
            onUploadSuccess={() => qc.invalidateQueries({ queryKey: ['filesByTask', task._id] })}
          />
        )}

        {filesLoading ? (
          <div className="text-gray-500 mt-2">Loading files…</div>
        ) : files?.length > 0 ? (
          <div className="space-y-2 mt-2">
            {files.map((f: any) => (
              <div key={f._id} className="flex items-center gap-2">
                <a
                  onClick={() => downloadFile.mutate(f._id)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  {f.name}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 mt-2">No attachments available for this task.</div>
        )}
      </div>

      {/* Comments */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">Comments</h3>
        <div className="space-y-3 mb-4">
          {commentsLoading ? (
            <div>Loading comments...</div>
          ) : (
            comments.map((c: any) => (
              <div key={c._id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{c.user?.name || 'Unknown'}</p>
                  <p>{c.content}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {currentUserId && c.user?._id === currentUserId && (
                  <button
                    onClick={() => deleteComment.mutate(c._id)}
                    className="text-red-600 hover:underline ml-4"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formEl = e.target as HTMLFormElement;
            const content = (formEl.elements.namedItem('comment') as HTMLTextAreaElement).value;
            addComment.mutate({ content });
            formEl.reset();
          }}
        >
          <textarea
            name="comment"
            className="w-full border rounded-md p-2"
            rows={3}
            placeholder="Add a comment..."
            required
          />
          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Comment
          </button>
        </form>
      </div>

      {/* Email meta (if from Outlook) */}
      {task.source === 'outlook' && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold">Email details</span>
          </div>

          <div className="grid gap-1 text-sm text-gray-700">
            {task.sourceSubject && (
              <div>
                <span className="font-medium">Subject:</span> {task.sourceSubject}
              </div>
            )}
            {(task.sourceFromName || task.sourceFromAddress) && (
              <div>
                <span className="font-medium">From:</span>{' '}
                {task.sourceFromName ? `${task.sourceFromName} ` : ''}
                {task.sourceFromAddress ? `<${task.sourceFromAddress}>` : ''}
              </div>
            )}
            {task.sourceReceivedAt && (
              <div>
                <span className="font-medium">Received:</span>{' '}
                {new Date(task.sourceReceivedAt).toLocaleString()}
              </div>
            )}
          </div>

          {task.sourceWebLink && (
            <div className="mt-3">
              <a
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                href={task.sourceWebLink}
                target="_blank"
                rel="noreferrer"
              >
                Open email in Outlook
              </a>
            </div>
          )}

          {task.sourceSnippet && (
            <details className="mt-3 [&_summary]:cursor-pointer">
              <summary className="text-sm text-gray-600 hover:text-gray-800">
                Show email excerpt
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-gray-50 p-3 text-xs">
                {task.sourceSnippet}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export const customStyles: StylesConfig<any, true> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '38px',
      borderRadius: '0.375rem', // rounded-md
      borderColor: state.isFocused ? '#2563eb' : '#d1d5db', // blue-600 vs gray-300
      boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
      '&:hover': {
        borderColor: '#2563eb',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e0f2fe', // light blue
      borderRadius: '0.375rem',
      paddingLeft: '2px',
      paddingRight: '2px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#0369a1', // darker blue text
      fontSize: '0.875rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#0369a1',
      ':hover': {
        backgroundColor: '#bae6fd',
        color: '#0284c7',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999, // important for portal
    }),
  };