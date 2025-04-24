import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

interface UploadModalProps {
  clientId: string;
  folderId: string;
  taskManagement: boolean;
  taskId: string;
  onClose: () => void;
  onUploadSuccess: (attachment: any) => void; // Callback for successful upload
}

export const UploadModal: React.FC<UploadModalProps> = ({ clientId, folderId, onClose, taskManagement, taskId, onUploadSuccess }) => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId); // State for selected folder
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const { data: foldersData =[], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', clientId],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get(`/files/folders`, {
        params: { clientId }, 
      });
      return data; // Assuming the API returns an array of folders
    },
    enabled: isAuthenticated && taskManagement, // Only fetch folders if taskManagement is true
  });

  const folders = Array.isArray(foldersData)
  ? foldersData
  : Array.isArray(foldersData?.folders)
  ? foldersData.folders
  : [];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      await getAuthToken();
      const { data: { presignedUrl, fileId, key } } = await api.post('/files/presigned-url', {
        fileName: file.name,
        fileType: file.type,
        folderId: selectedFolderId,
        clientId,
      });

      // Upload to S3
      await axios.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / (progressEvent.total ?? 0)) * 100;
          setUploadProgress(progress);
        },
      });
      
      const response = await api.post('/files', {
        fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        folderId: selectedFolderId,
        taskId, 
        clientId,
        key,
      });

      return response.data;
    },
    onSuccess: (data) => {
      onUploadSuccess(data); 
      queryClient.invalidateQueries({ queryKey: ['folderContents', clientId, selectedFolderId] });
      queryClient.invalidateQueries({ queryKey: ['files', clientId] });
      queryClient.invalidateQueries({ queryKey: ['folders', clientId] });
      if (taskManagement) {
        queryClient.invalidateQueries({ queryKey: ['filesByTask', taskId] });
      }   
      onClose();
    },
  });

  const handleUpload = async () => {
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>

        {taskManagement&& (
          <div className="mb-4">
            <label htmlFor="folderSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Folder
            </label>
            {foldersLoading ? (
              <p>Loading folders...</p>
            ) : (
              <select
                id="folderSelect"
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select a folder</option>
                {folders.map((folder: any) => ( // Use 'any' or define a proper type for folder
                  <option key={folder._id} value={folder._id}>
                    {folder.name} {/* Display the folder name */}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mb-4"
        />

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};