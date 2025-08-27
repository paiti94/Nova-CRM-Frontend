// src/components/EmailTaskCreator.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useMemo } from 'react';

type LatestEmail = {
  messageId: string;
  subject: string;
  from: string;
  receivedAt?: string;  // preferred from backend
  received?: string;    // legacy alias (fallback)
  bodyText?: string;
  webLink?: string;
};

type Task = {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  createdAt: string;
};

export function EmailTaskCreator() {
  const qc = useQueryClient();

  // --- load the latest email ---
  const {
    data: latestEmail,
    isLoading: isLoadingEmail,
    error: emailError,
    refetch: refetchEmail,
    isRefetching,
  } = useQuery<LatestEmail | null>({
    queryKey: ['latest-email'],
    queryFn: async () => (await api.get('/microsoft/latest-email')).data,
    // only fetch when Outlook is connected in the parent, or call conditionally
  });

  // nice date formatting (fallback to legacy field if needed)
  const receivedText = useMemo(() => {
    const iso = latestEmail?.receivedAt || latestEmail?.received;
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }, [latestEmail]);

  // --- create the task from the latest email ---
  const {
    mutate: createTask,
    isPending: creating,
    isSuccess: created,
    data: createdTask,
    error: createError,
    reset: resetCreate,
  } = useMutation<{ task: Task }, any, void>({
    mutationFn: async () => (await api.post('/openai/latest-email-to-task')).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      await qc.invalidateQueries({ queryKey: ['tasks', 'outlook'] });
    },
  });

  const handleCreate = () => {
    resetCreate();            // clear any prior success/error
    createTask();
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Task from Latest Email</h3>
        <button
          onClick={() => refetchEmail()}
          disabled={isLoadingEmail || isRefetching}
          className="text-sm rounded border px-3 py-1 disabled:opacity-60"
          title="Refresh latest email"
        >
          {isLoadingEmail || isRefetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Email panel */}
      <div className="rounded-lg bg-gray-50 p-3">
        {isLoadingEmail ? (
          <div className="text-gray-500">Loading latest email…</div>
        ) : emailError ? (
          <div className="text-red-600">Failed to load latest email.</div>
        ) : !latestEmail ? (
          <div className="text-gray-500">No emails found.</div>
        ) : (
          <>
            <div className="grid gap-1 text-sm">
              <div><span className="font-medium">From:</span> {latestEmail.from || '—'}</div>
              <div><span className="font-medium">Subject:</span> {latestEmail.subject || '—'}</div>
              <div><span className="font-medium">Received:</span> {receivedText}</div>
              {latestEmail.webLink ? (
                <div>
                  <a
                    className="text-blue-700 underline"
                    href={latestEmail.webLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Outlook
                  </a>
                </div>
              ) : null}
            </div>
            {latestEmail.bodyText ? (
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-white p-3 text-xs">
                {latestEmail.bodyText.slice(0, 2000)}
              </pre>
            ) : (
              <div className="mt-3 text-xs text-gray-500">No body content (subject-only email).</div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
          onClick={handleCreate}
          disabled={creating || !latestEmail}
        >
          {creating ? 'Creating task…' : 'Create Task from Latest Email'}
        </button>

        {/* status + result */}
        {createError ? (
          <span className="text-sm text-red-600">Failed to create task.</span>
        ) : created && createdTask?.task ? (
          <span className="text-sm text-green-700">
            Created: <strong>{createdTask.task.title}</strong> (due{' '}
            {new Date(createdTask.task.dueDate).toLocaleDateString()})
          </span>
        ) : null}
      </div>
    </div>
  );
}
