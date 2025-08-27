import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import CreatableSelect from 'react-select/creatable';
import type { StylesConfig } from 'react-select';

type User = { _id?: string; id?: string; name?: string; email?: string };
type Option = { value: string; label: string };

interface NewTaskModalProps {
  onClose: () => void;
  defaultAssigneeId?: string | null;
}

const baseSelectStyles: StylesConfig<Option, true> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '38px',
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
    '&:hover': { borderColor: '#2563eb' },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#e0f2fe',
    borderRadius: '0.375rem',
    paddingLeft: '2px',
    paddingRight: '2px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#0369a1',
    fontSize: '0.875rem',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#0369a1',
    ':hover': { backgroundColor: '#bae6fd', color: '#0284c7' },
  }),
  menu: (provided) => ({ ...provided, zIndex: 4001 }),
  menuPortal: (provided) => ({ ...provided, zIndex: 4000 }),
};

export const NewTaskModal = ({ onClose, defaultAssigneeId }: NewTaskModalProps) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '', // yyyy-mm-dd
    priority: 'medium',
    status: 'pending',
    assignedToIds: [] as string[], // <-- IDs only
  });

  useEffect(() => {
    if (defaultAssigneeId && !formData.assignedToIds.length) {
      setFormData((p) => ({ ...p, assignedToIds: [defaultAssigneeId] }));
    }
  }, [defaultAssigneeId]);

  const { data: usersRaw = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/users');
      return data;
    },
    enabled: isAuthenticated,
  });

  // Normalize to ensure we always have a value for <option value>
  const userOptions: Option[] = useMemo(() => {
    return (usersRaw || [])
      .map((u) => {
        const idValue = u._id ?? u.id ?? u.email; // fallback to email if no _id/id
        if (!idValue) return null;
        const label = u.name ? `${u.name}${u.email ? ` (${u.email})` : ''}` : (u.email ?? idValue);
        return { value: idValue, label };
      })
      .filter(Boolean) as Option[];
  }, [usersRaw]);

  // Select current valueOptions from assignedToIds
  const valueOptions: Option[] = useMemo(() => {
    if (!formData.assignedToIds?.length) return [];
    const map = new Map(userOptions.map((o) => [o.value, o]));
    return formData.assignedToIds.map((id) => map.get(id) ?? ({ value: id, label: id } as Option));
  }, [formData.assignedToIds, userOptions]);

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      await getAuthToken();

      const dueISO = formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined;

      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        priority: formData.priority as 'low' | 'medium' | 'high',
        status: formData.status as 'pending' | 'in_progress' | 'completed',
        dueDate: dueISO,
        assignedTo: formData.assignedToIds, // <-- array of IDs
      };

      const { data } = await api.post('/tasks', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate();
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.dueDate}
                onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.priority}
                onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as any }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as any }))}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Assignees (CreatableSelect) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign to (one or more)</label>
              <CreatableSelect
                isMulti
                // styles={taskDetailStyles} // if reusing TaskDetail styles
                styles={baseSelectStyles}
                options={userOptions}
                value={valueOptions}
                className="react-select-container mt-1"
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                closeMenuOnScroll={false}
                isValidNewOption={() => false} // no ad-hoc users
                onChange={(selected) => {
                  const ids = (selected as Option[]).map((o) => o.value);
                  setFormData((p) => ({ ...p, assignedToIds: ids }));
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
