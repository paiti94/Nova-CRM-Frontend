import React, { useEffect, useState } from 'react';
import { FileIcon, FolderIcon, DownloadIcon, TrashIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import { downloadAllFilesAsZip } from '../../services/fileApi';
import { Modal } from '../Modal'; 
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
  selectedFolderId?: string | null; 
}

export const FileList: React.FC<FileListProps> = ({
  files,
  folders,
  onFolderClick,
  clientId,
  selectedFolderId,
}) => {
  const { getAuthToken } = useAuthenticatedApi();
  const queryClient = useQueryClient();

  // ⬇️ local state for delete confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  
  const downloadMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await getAuthToken();
      const { data } = await api.get(`/files/download/${fileId}`);
      window.open(data.downloadUrl, '_blank');
    },
  });

  const downloadAllMutation = useMutation({
    mutationFn: async (folderId: string) => {
      await downloadAllFilesAsZip(folderId);
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
    },
    onSettled: () => {
      setIsDeleteOpen(false);
      setConfirmInput('');
    },
  });

  // open confirm
  const confirmDelete = (fileId: string, name?: string) => {
    setDeleteTarget({ id: fileId, name });
    setIsDeleteOpen(true);
  };

  // perform delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (confirmInput.trim().toLowerCase() === 'delete file') {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="p-6">
      {files.length > 1 && selectedFolderId && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => downloadAllMutation.mutate(selectedFolderId)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Download all files in this folder"
          >
            <DownloadIcon size={20} className="mr-2" />
            Download All
          </button>
        </div>
      )}

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
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/file-id', file._id)}
            className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50"
          >
            <FileIcon className="text-blue-500" size={24} />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadMutation.mutate(file._id)}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Download"
              >
                <DownloadIcon size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // avoid triggering any parent click
                  confirmDelete(file._id, file.name);
                }}
                className="p-2 text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <TrashIcon size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setConfirmInput('');
        }}
        onConfirm={handleConfirmDelete}
        title="Delete File?"
        message={
          <>
            <p>
              {deleteTarget?.name
                ? `This will permanently delete "${deleteTarget.name}".`
                : 'This will permanently delete the selected file.'}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Please type <strong>delete file</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type 'delete file'"
              className="mt-3 w-full rounded border px-3 py-2 text-sm"
            />
          </>
        }
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        disableConfirm={
          confirmInput.trim().toLowerCase() !== 'delete file' || deleteMutation.isPending
        }
      />
    </div>
  );
};