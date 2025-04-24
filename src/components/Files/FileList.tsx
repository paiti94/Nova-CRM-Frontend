import React, { useEffect, useState } from 'react';
import { FileIcon, FolderIcon, DownloadIcon, TrashIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';

interface File {
  _id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  key: string;
}

interface Folder {
  _id: string;
  name: string;
  createdAt: string;
}

interface FileListProps {
  files: File[];
  folders: Folder[];
  onFolderClick: (folderId: string) => void;
  clientId?: string | null; // Make clientId optional
}

export const FileList: React.FC<FileListProps> = ({
  files,
  folders,
  onFolderClick,
  clientId,
}) => {
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const queryClient = useQueryClient();

  const downloadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await getAuthToken(); 
      const { data } = await api.get(`/files/download/${fileId}`);
      window.open(data.downloadUrl, '_blank');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await getAuthToken(); 
      await api.delete(`/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folderContents'] });
      queryClient.invalidateQueries({ queryKey: ['files', clientId] });
      // queryClient.invalidateQueries({ queryKey: ['filesByTask', selectedTask?._id] }); // Invalidate task-specific files
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4">
        {folders.map((folder) => (
          <div
            key={folder._id}
            onClick={() => onFolderClick(folder._id)}
            className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <FolderIcon className="text-yellow-500" size={24} />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{folder.name}</h3>
              <p className="text-sm text-gray-500">
                Created {new Date(folder.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}

        {files.map((file) => (
          <div
            key={file._id}
            className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50"
          >
            <FileIcon className="text-blue-500" size={24} />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} •{' '}
                {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadMutation.mutate(file._id)}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <DownloadIcon size={20} />
              </button>
              <button
                onClick={() => deleteMutation.mutate(file._id)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <TrashIcon size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};