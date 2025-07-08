import { Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api'; // Import useAuthenticatedApi
import { FolderStructure } from '../components/Files/FolderStructure';
import { FileList } from '../components/Files/FileList';
import { NewFolderModal } from '../components/Files/NewFolderModal';
import { UploadModal } from '../components/Files/UploadModal';
import { ClientSelector } from '../components/Admin/ClientSelector';
import { useAuth0 } from '@auth0/auth0-react';

export const Files = () => {
  const { getAuthToken } = useAuthenticatedApi(); // Get the getAuthToken function
  const { isAuthenticated, isLoading: authLoading } = useAuth0(); // Use Auth0 hook
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch user data using React Query
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
  const effectiveClientId = isAdmin ? selectedClientId : userData?._id;

  // Fetch folder contents
  const { data: folderContents, isLoading: contentsLoading } = useQuery({
    queryKey: ['folderContents', effectiveClientId, selectedFolderId],
    queryFn: async () => {
      await getAuthToken(); // Ensure we have a valid token
      if (!effectiveClientId) {
        return { files: [], folders: [] };
      }
      const { data } = await api.get(selectedFolderId ? `/files/folders/contents/${selectedFolderId}` : '/files/folders', {
        params: {
          clientId: effectiveClientId,
        },
      });
      return data;
    },
    enabled: !!effectiveClientId, // Only run if effectiveClientId is available
  });

  // Handle loading states
  if (userLoading || contentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please log in to view your files.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-2xl font-semibold">My Files</h1>
        {(isAdmin && selectedClientId) || !isAdmin ? (
          <div className="space-x-4">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              New Folder
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload Files
            </button>
          </div>
        ) : null}
      </div>
      {isAdmin && (
        <div className="p-4 border-b">
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientSelect={setSelectedClientId}
          />
        </div>
      )}

      {(isAdmin && selectedClientId) || !isAdmin ? (
        <div className="flex flex-1">
          <div className="w-1/4 border-r">
            <FolderStructure
              selectedFolder={selectedFolderId || ''}
              onSelectFolder={setSelectedFolderId}
              clientId={effectiveClientId!}
            />
          </div>
          <div className="flex-1">
            <FileList
              files={folderContents?.files || []}
              folders={folderContents?.folders || []}
              onFolderClick={setSelectedFolderId}
              clientId={effectiveClientId}
            />
          </div>
          {showNewFolderModal && (
            <Suspense fallback={<div>Loading modal...</div>}>
              <NewFolderModal
                parentFolderId={selectedFolderId}
                onClose={() => setShowNewFolderModal(false)}
                clientId={effectiveClientId}
              />
            </Suspense>
          )}

          {showUploadModal && (
            <UploadModal
              folderId={selectedFolderId || ''}
              onClose={() => setShowUploadModal(false)}
              clientId={effectiveClientId}
              taskManagement={false}
              taskId=''
              onUploadSuccess={() => {}}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Please select a client to view their files
        </div>
      )}
    </div>
  );
};

export default Files;