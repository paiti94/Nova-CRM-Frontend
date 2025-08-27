import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api';
import type { Task } from '../types/task';

export function useTaskMutations() {
  const qc = useQueryClient();
  const { getAuthToken } = useAuthenticatedApi();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['tasks'] });
    await qc.invalidateQueries({ queryKey: ['tasks','outlook'] });
  };

  const updateTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      await getAuthToken();
      const { data } = await api.patch(`/tasks/${id}`, patch);
      return data as Task;
    },
    onSuccess: invalidate,
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      await getAuthToken();
      const { data } = await api.patch(`/tasks/${id}/complete`);
      return data as Task;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await getAuthToken();
      const { data } = await api.delete(`/tasks/${id}`);
      return data as { ok: true };
    },
    onSuccess: invalidate,
  });

  return { updateTask, completeTask, deleteTask };
}
