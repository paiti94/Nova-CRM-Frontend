import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

interface UploadModalProps {
  clientId: string;
  folderId: string;
  taskManagement: boolean;
  taskId: string;
  onClose: () => void;
  onUploadSuccess: (attachment: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ clientId, folderId, onClose, taskManagement, taskId, onUploadSuccess }) => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const { data: foldersData = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', clientId],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get(`/files/folders`, {
        params: { clientId },
      });
      return data;
    },
    enabled: isAuthenticated && taskManagement,
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    // Explicitly check for files and ensure it's not null before converting to Array
    if (e.dataTransfer.files) { // This check is already good.
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
      e.dataTransfer.clearData();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if e.target.files exists and is not null or undefined
    if (e.target.files && e.target.files.length > 0) {
      // Use Array.from to convert FileList to an array of File objects
      setFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>

        {taskManagement && (
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
                {folders.map((folder: any) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`
            mb-4 p-6 border-2 border-dashed rounded-lg text-center
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            hover:border-blue-400 hover:bg-blue-100 transition-colors duration-200 cursor-pointer
          `}
        >
          <p className="text-gray-600">
            {isDragOver ? 'Drop your files here!' : 'Drag & drop files here, or click to browse.'}
          </p>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="mb-4 text-sm text-gray-700">
            <p className="font-semibold mb-1">Selected Files:</p>
            <ul className="list-disc list-inside">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <button
                        onClick={() => setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 ml-2 text-sm"
                        title="Remove file"
                    >
                        &times;
                    </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        {uploadProgress === 100 && (
             <p className="text-sm text-green-600 mb-4">Upload Complete!</p>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploadMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};