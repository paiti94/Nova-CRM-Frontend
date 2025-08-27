// client/src/components/Tasks/TaskTimelineTable.tsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { TaskDetail } from "./TaskDetail"; // <- adjust path if different

export type TLTask = {
  _id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  dueDate?: string | Date | null;
  createdAt?: string | Date;
  assignedTo?: string[];
  source?: string;
};

type Props = {
  tasks: TLTask[];
  currentUserId?: string;
  currentUserRole?: "admin" | "user";
  effectiveClientId?: string | null;

  /** Optional: When a task is deleted from detail panel */
  onDeleted?: () => void;

  /** Day or week columns */
  dateScale?: "day" | "week";
  rangeDays?: number;
  startDate?: Date;
};

/* ---------------- utils ---------------- */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function daysBetween(a: Date, b: Date) {
  return Math.round((atMidnight(b).getTime() - atMidnight(a).getTime()) / 86400000);
}
function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function useTodayTicker() {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
}

/* ---------------- component ---------------- */
export const TaskTimelineTable: React.FC<Props> = ({
  tasks,
  currentUserId,
  currentUserRole = "user",
  effectiveClientId,
  onDeleted,
  dateScale = "day",
  rangeDays = 28,
  startDate,
}) => {
  useTodayTicker();

  const [selected, setSelected] = useState<TLTask | null>(null);
  const opRef = useRef<OverlayPanel | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const today = atMidnight(new Date());
  const start = useMemo(
    () => atMidnight(startDate ?? addDays(today, -Math.floor(rangeDays / 2))),
    [startDate, rangeDays]
  );
  const end = useMemo(() => addDays(start, rangeDays - 1), [start, rangeDays]);

  const columns = useMemo(() => {
    if (dateScale === "week") {
      const days = rangeDays;
      const weeks = Math.max(1, Math.ceil(days / 7));
      return Array.from({ length: weeks }, (_, i) => ({
        key: `w${i}`,
        label: `Week ${i + 1}`,
        date: addDays(start, i * 7),
      }));
    }
    return Array.from({ length: rangeDays }, (_, i) => ({
      key: `d${i}`,
      label: fmtDate(addDays(start, i)),
      date: addDays(start, i),
    }));
  }, [dateScale, rangeDays, start]);

  const rows = useMemo(() => {
    return (tasks || []).map((t) => {
      const created = t.createdAt ? new Date(t.createdAt) : addDays(today, -3);
      const startAt = atMidnight(created);
      const due = t.dueDate ? new Date(t.dueDate as any) : addDays(startAt, 3);
      const endAt = atMidnight(due);
      const totalDays = Math.max(1, daysBetween(startAt, endAt) + 1);
      const offsetDays = daysBetween(start, startAt);

      return { task: t, startAt, endAt, totalDays, offsetDays };
    });
  }, [tasks, start]);

  const gridRef = useRef<HTMLDivElement>(null);
  const colWidth = dateScale === "day" ? 120 : 160;

  // Scroll today into view on mount
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const daysToToday = clamp(daysBetween(start, today), 0, rangeDays - 1);
    el.scrollLeft = Math.max(0, daysToToday * colWidth - el.clientWidth / 2);
  }, [start, today, rangeDays, colWidth]);

  // Keep selection if task list refreshes (remove if no longer exists)
  useEffect(() => {
    if (!selected) return;
    const stillThere = tasks.some((t) => t._id === selected._id);
    if (!stillThere) {
      setSelected(null);
      opRef.current?.hide();
    }
  }, [tasks, selected]);

  const openOverlay = useCallback((e: React.MouseEvent, t: TLTask) => {
    e.preventDefault();
    e.stopPropagation();
    const anchor = e.currentTarget as HTMLElement;
    anchorRef.current = anchor;
    setSelected(t);
    if (opRef.current) opRef.current.hide();
    // give React a tick to set selected
    setTimeout(() => opRef.current?.show(undefined, anchor), 0);
  }, []);

  const handleDeleted = useCallback(() => {
    setSelected(null);
    opRef.current?.hide();
    onDeleted?.();
  }, [onDeleted]);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-lg font-semibold">Timeline</div>
        <div className="flex items-center gap-2 text-xs">
          <LegendDot className="bg-amber-500" label="Pending" />
          <LegendDot className="bg-indigo-600" label="In Progress" />
          <LegendDot className="bg-emerald-600" label="Completed" />
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr]">
        {/* Left column (titles) */}
        <div className="max-h-[60vh] overflow-auto">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-4 py-2 text-xs font-medium text-gray-600">
            Task
          </div>
          <ul className="divide-y">
            {rows.map(({ task }) => (
              <li key={task._id} className="px-4 py-3">
                <button
                  onClick={(e) => openOverlay(e, task)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium leading-5 text-gray-900">
                        {task.title}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        <PriorityBadge prio={task.priority} />
                        {task.source === "outlook" && (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Outlook
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right grid (timeline) */}
        <div className="relative border-l">
          {/* columns header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${columns.length}, ${colWidth}px)` }}
            >
              {columns.map((c, i) => (
                <div
                  key={c.key}
                  className="px-3 py-2 text-[11px] font-medium text-gray-600 border-r"
                >
                  {dateScale === "day" ? (
                    <div className="flex items-center justify-between">
                      <span>{c.label}</span>
                      {i === daysBetween(start, today) && (
                        <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                          Today
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>{fmtDate(c.date)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* rows */}
          <div ref={gridRef} className="max-h-[60vh] overflow-auto">
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${columns.length}, ${colWidth}px)` }}
            >
              {rows.map(({ task, startAt, endAt, totalDays, offsetDays }) => {
                const left = offsetDays * colWidth;
                const widthPx = Math.max(colWidth - 16, totalDays * colWidth - 16);
                const isLate =
                  task.status !== "completed" &&
                  task.dueDate &&
                  atMidnight(new Date(task.dueDate as any)) < today;

                return (
                  <div key={task._id} className="relative h-[56px] border-r border-b">
                    {/* clickable bar */}
                    <button
                      onClick={(e) => openOverlay(e, task)}
                      className={[
                        "absolute top-1/2 -translate-y-1/2 rounded-full h-7 min-w-[16px] shadow outline-none",
                        task.status === "completed"
                          ? "bg-emerald-600/90"
                          : task.status === "in_progress"
                          ? "bg-indigo-600/90"
                          : "bg-amber-500/90",
                        "hover:brightness-110 active:brightness-95 transition",
                      ].join(" ")}
                      style={{
                        left: `${left}px`,
                        width: `${widthPx}px`,
                      }}
                      title={`${task.title}\n${fmtDate(startAt)} → ${fmtDate(endAt)}`}
                    >
                      <div className="flex h-full items-center justify-between px-3 text-xs text-white">
                        <span className="truncate">{task.title}</span>
                        {isLate && (
                          <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-[10px]">
                            Late
                          </span>
                        )}
                      </div>
                    </button>

                    {/* today vertical line (visual guide) */}
                    {dateScale === "day" && (
                      <div
                        className="pointer-events-none absolute inset-y-0 w-px bg-rose-500/60"
                        style={{
                          left: `${clamp(daysBetween(start, today), 0, rangeDays - 1) * colWidth}px`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* One OverlayPanel for the whole table (like Kanban) */}
      <OverlayPanel
        ref={opRef}
        showCloseIcon
        dismissable
        appendTo={document.body}
        style={{ zIndex: 3500 }}        // <- slightly above your Kanban (3000)
        className="relative w-[900px] max-w-[95vw] p-4"
        pt={{
          closeButton: { className: "absolute top-2 right-2" },
          content: { className: "pt-6" },
        }}
        onHide={() => setSelected(null)}
      >
        {selected ? (
          <div className="w-full">
            <TaskDetail
              task={selected as any}
              effectiveClientId={effectiveClientId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onDeleted={handleDeleted}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500 p-2">No task selected</div>
        )}
      </OverlayPanel>
    </div>
  );
};

/* ---------------- tiny presentational bits ---------------- */
function StatusBadge({ status }: { status: TLTask["status"] }) {
  const cfg =
    status === "completed"
      ? { c: "bg-emerald-100 text-emerald-700", t: "Completed" }
      : status === "in_progress"
      ? { c: "bg-indigo-100 text-indigo-700", t: "In Progress" }
      : { c: "bg-amber-100 text-amber-700", t: "Pending" };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${cfg.c}`}>
      {cfg.t}
    </span>
  );
}
function PriorityBadge({ prio }: { prio?: TLTask["priority"] }) {
  if (!prio) return null;
  const cfg =
    prio === "high"
      ? { c: "bg-rose-100 text-rose-700", t: "High" }
      : prio === "low"
      ? { c: "bg-gray-100 text-gray-600", t: "Low" }
      : { c: "bg-sky-100 text-sky-700", t: "Medium" };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${cfg.c}`}>
      {cfg.t}
    </span>
  );
}
function LegendDot({ className, label }: { className?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block size-2 rounded-full ${className || "bg-gray-400"}`} />
      <span className="text-gray-600">{label}</span>
    </span>
  );
}
