import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { Folder, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { Modal } from '../Modal';

interface FolderType {
  _id: string;
  name: string;
  isDefault: boolean;
  parent?: string;
  clientId: string;
  createdAt: string;
  createdBy: string;
  isInternal: boolean;
  updatedAt: string;

}

interface FolderStructureProps {
  selectedFolder: string;
  onSelectFolder: (folderId: string | null) => void;
  clientId: string;
  hideRoot?: boolean;
}

export const FolderStructure: React.FC<FolderStructureProps> = ({
  selectedFolder,
  onSelectFolder,
  clientId,
  hideRoot = false,
}) => {
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();
  const queryClient = useQueryClient();
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); // Ensure we have a valid token
      const { data } = await api.get('/users/me'); // Fetch user data
      return data;
    },
    enabled: isAuthenticated, // Only run if authenticated
  });

  const isAdmin = userData?.role === 'admin';
  
  const deleteMutation = useMutation({
    mutationFn: async (folderId: string) => {
      await getAuthToken();
      return api.delete(`/files/folders/${folderId}?recursive=true`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', clientId] });
      setFolderToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder. Please try again.');
    },
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ['folders', clientId],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/files/folders', {
        params: { clientId }
      });
      // return data.folders;
      return Array.isArray(data) ? data : data.folders || [];
    },
    enabled: isAuthenticated && !!clientId, 
  });

  const folders: FolderType[] = Array.isArray(data)
  ? data
  : Array.isArray(data?.folders)
  ? data.folders
  : [];

  const calculateDepth = (folderId: string | null): number => {
    if (!folderId || !folders) return 0;
    
    let depth = 0;
    let currentFolder = folders.find(f => f._id === folderId);
    while (currentFolder?.parent) {
      depth++;
      currentFolder = folders.find(f => f._id === currentFolder?.parent);
    }
    return depth;
  };

  const handleDelete = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete(folderId);
  };

  const confirmDelete = () => {
    if (folderToDelete) {
      deleteMutation.mutate(folderToDelete);
    }
  };

  const buildFolderTree = (parentId: string | null) => {
    const childFolders = folders?.filter(folder => {
      if (parentId === null) {
        return !folder.parent;
      }
      return folder.parent === parentId;
    });
    
    if (!childFolders || childFolders.length === 0) {
      return null;
    }

    return (
      <>
        {childFolders.map(folder => {
          const depth = calculateDepth(folder._id);
          return (
            <div 
              key={folder._id} 
              style={{ paddingLeft: `${depth * 24}px` }}
              className="relative group"
            >
              <button
                onClick={() => onSelectFolder(folder._id)}
                className={`
                  flex items-center justify-between w-full px-3 py-2 
                  text-left rounded-md
                  ${selectedFolder === folder._id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'}
                `}
              >
                <div className="flex items-center space-x-2">
                  <Folder
                    size={20}
                    className={selectedFolder === folder._id ? 'text-blue-600' : 'text-gray-400'}
                  />
                  <span>{folder.name}</span>
                </div>
                {isAdmin && !folder.isDefault && (
                  <button
                    onClick={(e) => handleDelete(folder._id, e)}
                    className="hidden group-hover:block p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                )}
              </button>
              {buildFolderTree(folder._id)}
            </div>
          );
        })}
      </>
    );
  };

  if (isLoading) return <div>Loading folders...</div>;

  return (
    <div className="p-4">
      {/* {!hideRoot && (
        <button
          onClick={() => onSelectFolder(null)}
          className={`
            flex items-center space-x-2 w-full px-3 py-2 
            text-left rounded-md
            ${selectedFolder === null
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-50 text-gray-700'}
          `}
        >
          <Folder
            size={20}
            className={selectedFolder === null ? 'text-blue-600' : 'text-gray-400'}
          />
          <span>Root</span>
        </button>
      )} */}
      <div className="mt-2">
        {buildFolderTree(null)}
      </div>

      <Modal
        isOpen={!!folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? All files and subfolders within it will be permanently deleted."
      />
    </div>
  );
};