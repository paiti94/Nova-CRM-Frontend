import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TaskDetail } from './TaskDetail';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export type CalTask = {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string | Date;
  dueDate?: string | Date | null;
  source?: string;
  assignedTo?: string[];
};

type Props = {
  tasks: CalTask[];
  currentUserId?: string;
  currentUserRole?: 'admin' | 'user';
  effectiveClientId?: string | null;
};

function atMidnight(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  
  function addOneDay(d: Date) {
    const x = new Date(d);
    x.setDate(x.getDate() + 1);
    return x;
  }
  
  // Make a Date at local midnight from either a Date or an ISO string.
  // If it's a string like "2025-08-30T00:00:00.000Z", we take only the Y-M-D
  // to avoid timezone shifts.
  function localMidnightFrom(input?: string | Date | null): Date | null {
    if (!input) return null;
    if (input instanceof Date) return atMidnight(new Date(input));
    const ymd = input.slice(0, 10);                  // "YYYY-MM-DD"
    const d = new Date(`${ymd}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  
  function colorFromStatus(s: 'pending' | 'in_progress' | 'completed') {
    return s === 'completed' ? '#059669' : s === 'in_progress' ? '#4f46e5' : '#f59e0b';
  }

export const TaskCalendarView: React.FC<Props> = ({
  tasks,
  currentUserId,
  currentUserRole = 'user',
  effectiveClientId,
}) => {
  const [selectedTask, setSelectedTask] = useState<CalTask | null>(null);
  const opRef = useRef<OverlayPanel | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  // Map tasks -> calendar events
  const events: EventInput[] = useMemo(() => {
  const today = atMidnight(new Date());

  return (tasks ?? []).map((t) => {
    // start = created day; end = due day (inclusive)
    const start = localMidnightFrom(t.createdAt) ?? today;
    const due   = localMidnightFrom(t.dueDate) ?? start;

    // FullCalendar all-day uses [start, end). Add 1 day so the due date is included.
    const end = addOneDay(due < start ? start : due);

    const color = colorFromStatus(t.status);

    return {
      id: t._id,
      title: t.title,
      start,
      end,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      extendedProps: { task: t },
    };
  });
}, [tasks]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const task: CalTask | undefined = (arg.event.extendedProps as any)?.task;
    if (!task) return;
    setSelectedTask(task);
    anchorRef.current = arg.el as HTMLElement;
    if (opRef.current) opRef.current.hide();
    setTimeout(() => opRef.current?.show(undefined, anchorRef.current as any), 0);
  }, []);

  // close overlay if the selected task disappears after a refetch
  useEffect(() => {
    if (!selectedTask) return;
    const stillExists = tasks.some((t) => t._id === selectedTask._id);
    if (!stillExists) {
      setSelectedTask(null);
      opRef.current?.hide();
    }
  }, [tasks, selectedTask]);

  return (
    <div className="relative">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        height="auto"
        events={events}
        eventClick={onEventClick}
        dayMaxEventRows
        weekends
        selectable={false}  // set to true if you want to create tasks on date select
        eventDisplay="block"
      />

      {/* Shared OverlayPanel for task details */}
      <OverlayPanel
        ref={opRef}
        showCloseIcon
        dismissable
        appendTo={document.body}
        style={{ zIndex: 3500 }}
        className="relative w-[900px] max-w-[95vw] p-4"
        pt={{ closeButton: { className: 'absolute top-2 right-2' }, content: { className: 'pt-6' } }}
        onHide={() => setSelectedTask(null)}
      >
        {selectedTask ? (
          <TaskDetail
            task={selectedTask as any}




            effectiveClientId={effectiveClientId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDeleted={() => {
              setSelectedTask(null);
              opRef.current?.hide();
            }}
          />
        ) : (
          <div className="text-sm text-gray-500 p-2">No task selected</div>
        )}
      </OverlayPanel>
    </div>
  );
};

export default TaskCalendarView;
