import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';

interface NewFolderModalProps {
  parentFolderId: string | null;
  onClose: () => void;
  clientId?: string | null;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  parentFolderId,
  onClose,
  clientId,
}) => {
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const [folderName, setFolderName] = useState('');
  const queryClient = useQueryClient();

  const createFolder = useMutation({
    mutationFn: async () => {
      await getAuthToken();
      const { data } = await api.post('/files/folders', {
        name: folderName,
        parentId: parentFolderId,
        clientId: clientId
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'folderContents';
        }
      });

      queryClient.invalidateQueries({
        queryKey: ['folders', clientId]
      });
      onClose();
    },
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFolder.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">New Folder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter folder name"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};