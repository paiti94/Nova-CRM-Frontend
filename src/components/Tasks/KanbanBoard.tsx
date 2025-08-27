import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { Task } from '../../types/task';
import { useTaskMutations } from '../../hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TaskDetail } from './TaskDetail';
import { UploadModal } from '../Files/UploadModal'; 

type BoardProps = {
  tasks: Task[];
  currentUserId?: string;
  currentUserRole?: 'admin' | 'user';
  effectiveClientId?: string | null;
};

const columns: Array<{ key: Task['status']; title: string }> = [
  { key: 'pending',     title: 'To Do' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'completed',   title: 'Done' },
];

export function KanbanBoard({ tasks, currentUserId, currentUserRole = 'user', effectiveClientId }: BoardProps) {
    const qc = useQueryClient();
    const { updateTask } = useTaskMutations();
  
    const opRef = useRef<OverlayPanel | null>(null);
    const [selected, setSelected] = useState<Task | null>(null);
  
    // Close if the selected task disappears (e.g., deleted elsewhere)
    useEffect(() => {
      if (!selected) return;
      const stillThere = tasks.some(t => t._id === selected._id);
      if (!stillThere) {
        setSelected(null);
        opRef.current?.hide();
      }
    }, [tasks, selected]);
  
    const openOverlay = useCallback((e: React.MouseEvent, t: Task) => {
      e.preventDefault();
      e.stopPropagation();
  
      const anchor = e.currentTarget as HTMLElement;
      setSelected(t);
  
      // Re-open anchored to this card
      if (opRef.current) opRef.current.hide();
      setTimeout(() => opRef.current?.show(undefined, anchor), 0);
    }, []);
  
    const byStatus = useMemo(() => {
      const map: Record<Task['status'], Task[]> = { pending: [], in_progress: [], completed: [] };
      for (const t of tasks ?? []) map[t.status].push(t);
      return map;
    }, [tasks]);
  
    const onDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData('text/task-id', taskId);
      e.dataTransfer.effectAllowed = 'move';
    };
  
    const onDropOnColumn = (e: React.DragEvent, newStatus: Task['status']) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/task-id');
      if (!taskId) return;
      const t = tasks.find(x => x._id === taskId);
      if (!t || t.status === newStatus) return;
  
      updateTask.mutate({ id: t._id, patch: { status: newStatus } }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ['tasks'] });
          qc.invalidateQueries({ queryKey: ['tasks', 'outlook'] });
        },
      });
    };
  
    const handleDeleted = useCallback(() => {
      setSelected(null);
      opRef.current?.hide();
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks', 'outlook'] });
    }, [qc]);
  
    return (
      // ❌ REMOVE any onScroll that hides the overlay
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['pending', 'in_progress', 'completed'] as const).map(colKey => (
          <div
            key={colKey}
            className="rounded-lg border bg-white p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropOnColumn(e, colKey)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {colKey === 'pending' ? 'To Do' : colKey === 'in_progress' ? 'In Progress' : 'Done'}
              </h3>
              <span className="text-xs text-gray-500">{byStatus[colKey].length}</span>
            </div>
  
            <div className="space-y-2 min-h-20">
              {byStatus[colKey].map((t) => (
                <div
                  key={t._id}
                  draggable
                  onDragStart={(e) => onDragStart(e, t._id)}
                  onClick={(e) => openOverlay(e, t)}
                  className="cursor-pointer rounded border bg-gray-50 p-3 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{t.title}</div>
                    {t.source === 'outlook' && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Outlook</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {t.priority ? `Priority: ${t.priority}` : 'Priority: —'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t.dueDate ? `Due: ${new Date(t.dueDate as any).toLocaleDateString()}` : 'Due: —'}
                  </div>
                  {!!(t as any).assignedTo?.length && (
                    <div className="text-xs text-gray-600">Assignees: {(t as any).assignedTo.length}</div>
                  )}
                </div>
              ))}
              {!byStatus[colKey].length && (
                <div className="text-sm text-gray-400">Drop tasks here</div>
              )}
            </div>
          </div>
        ))}
  
        {/* One overlay for the whole board */}
        <OverlayPanel
          ref={opRef}
          showCloseIcon
          dismissable={false}            // ⬅️ important: do NOT auto-close on outside click
          appendTo={document.body}
          style={{ zIndex: 3000 }}
          className="relative w-[900px] max-w-[95vw] p-4"
          pt={{
            closeButton: { className: 'absolute top-2 right-2' },
            content:     { className: 'pt-6' },
          }}
          onHide={() => setSelected(null)}
        >
          {selected ? (
            <div className="w-full">
              <TaskDetail
                task={selected}
                effectiveClientId={effectiveClientId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                UploadModal={UploadModal}
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-2">No task selected</div>
          )}
        </OverlayPanel>
      </div>
    );
  }