import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { Task } from '../../types/task';
import { ClientSelector } from '../Admin/ClientSelector';
import { NewTaskModal } from './NewTaskModal';
import { UploadModal } from '../Files/UploadModal';
import { useAuth0 } from '@auth0/auth0-react';

export const TaskManagement = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [presignedUrl, setPresignedUrl] = useState(''); // State to hold the presigned URL
  const { isAuthenticated,} = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for error messages

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); 
      try {
        const { data } = await api.get('/users/me');
        return data;
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorMessage('Error fetching user data.'); 
        throw error;
      }
    },
    enabled: isAuthenticated,
  });

  const isAdmin = userData?.role === 'admin';
  const effectiveClientId = isAdmin ? selectedClientId : userData?._id;
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', effectiveClientId],
    queryFn: async () => {
      await getAuthToken(); 
      if(!effectiveClientId) return [];
      try {
        const endpoint =  `/tasks/user/${effectiveClientId}`;
        const { data } = await api.get(endpoint);
        return data as Task[];
      } catch (error) {
        setErrorMessage('Error fetching tasks.'); 
        throw error;
      }
    },
    enabled: !!userData && isAuthenticated,
  });

  const updateTaskAttachments = (newAttachment: any) => {
    if (selectedTask) {
      setSelectedTask((prevTask:any) => ({
        ...prevTask,
        attachments: [...(prevTask?.attachments || []), newAttachment],
      }));
    }
  };

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['taskComments', selectedTask?._id],
    queryFn: async () => {
      await getAuthToken(); 
      if (!selectedTask) return [];
      try {
        const { data } = await api.get(`/tasks/${selectedTask._id}/comments`);
        return data; 
      } catch (error) {
        setErrorMessage('Error fetching comments.');
        throw error;
      }
    },
    enabled: !!selectedTask && isAuthenticated,
  });

  const addComment = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      await getAuthToken(); 
      try {
        const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
        return data;
      } catch (error) {
        setErrorMessage('Error adding comment.');
        throw error;
      }
    },
    onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['taskComments', variables.taskId] });
    },
  });

const deleteComment = useMutation({
    mutationFn: async ({taskId, commentId} : {taskId:string; commentId: string}) => {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`); 
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskComments', variables.taskId] });
    },
  });

  const { data: files, isLoading: filesLoading, isError: filesError } = useQuery({
    queryKey: ['filesByTask', selectedTask?._id],
    queryFn: async () => {
      await getAuthToken(); 
      if (!selectedTask?._id) return [];
      try{
        const { data } = await api.get(`/files/task/${selectedTask._id}`); 
        return data; 
      } catch (error) {
        setErrorMessage('Error fetching files.');
        throw error;
      }
    },
    enabled: !!selectedTask && isAuthenticated,
  });

  const downloadMutation = useMutation({
    mutationFn: async (fileId) => {
      await getAuthToken(); 
      try {
        const { data } = await api.get(`/files/download/${fileId}`);
        return data.downloadUrl;// Return the download URL
      } catch (error) {
        setErrorMessage('Error downloading file.');
        throw error;
      }
    },
    onSuccess: (url) => {
      setPresignedUrl(url); // Set the presigned URL in state
      window.open(url, '_blank'); // Open the URL in a new tab
    },
  });

  useEffect(() => {
    setSelectedTask(null); 
  }, [selectedClientId]);

  if (userLoading) {    
    return <div>Loading user data...</div>;
  }

  return (
    <div className="h-full flex flex-col">
        <div className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tasks Management</h1>
        {(isAdmin && selectedClientId)  ? (
          <div className="space-x-4">
            <button 
            onClick={() => setShowNewTaskModal(true)} 
            className="mt-4 w-full bg-blue-600 text-white rounded-md px-4 py-3 hover:bg-blue-700">
                Create New Task
            </button>
           </div>) : null}
        </div> {isAdmin && (
      <div className="p-4 border-b">
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientSelect={setSelectedClientId}
        />
      </div>
        )}
          {showNewTaskModal && (
        <NewTaskModal onClose={() => setShowNewTaskModal(false)} />
            )} 
        <div className="container mx-auto p-4">
            <div className="flex gap-4">    
                {effectiveClientId && (
                <div className="w-1/3 bg-white rounded-lg shadow p-4">
                  <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                    {isLoading ? (
                    <div>Loading...</div>
                    ) : (
                    <div className="space-y-2">
                     {tasks?.map((task) => (
                        <div
                            key={task._id}
                            className={`p-3 rounded-lg cursor-pointer ${
                            selectedTask?._id === task._id
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedTask(task)}
                        >
                            <h3 className="font-medium">{task.title}</h3>
                            <p className="text-sm text-gray-600">
                            Status: {task.status}
                            </p>
                        </div>
                     ))}
                    </div>
                    )}
                 {/* {isAdmin && (
                    <button className="mt-4 w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700">
                    Create New Task
                    </button>
                  )} */}
                </div>
                )}
        {selectedTask && (
          <div className="w-2/3 bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
              <p className="text-gray-600 mt-2">{selectedTask.description}</p>
            </div>

            {/* Attachments Section */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Attachments</h3>
              <button onClick={() => setShowUploadModal(true)}  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Upload Files</button>
              {showUploadModal && (
                    <UploadModal
                    folderId={selectedFolderId || ''}
                    onClose={() => setShowUploadModal(false)}
                    clientId={effectiveClientId}
                    taskManagement={true}
                    taskId={selectedTask._id}
                    onUploadSuccess={updateTaskAttachments}
                    />
                )}
                 {files?.length > 0 ? (
                     <div className="space-y-2">
                       {files?.map( (attachment: any) => (
                         <div key={attachment._id} className="flex items-center gap-2">
                           <a
                              onClick={() => downloadMutation.mutate(attachment._id)}
                             className="text-blue-600 hover:underline"
                             target="_blank"
                             rel="noopener noreferrer"
                           >
                             {attachment.name}
                           </a>
                         </div>
                       ))}
                     </div>
                ) : (
                    <div className="text-gray-500">No attachments available for this task.</div> // Message when no files are present
                )}
            </div>

            {/* Comments Section */}
            <div>
                <h3 className="font-medium mb-2">Comments</h3>
                <div className="space-y-3 mb-4">
                  {commentsLoading ? (
                    <div>Loading comments...</div>
                  ) : (
                    comments?.map((comment: any) => (
                      <div key={comment._id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{comment.user.name}</p> {/* Display username */}
                          <p>{comment.content}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {comment.user._id === userData?._id && ( // Check if the comment was created by the current user
                          <button
                            onClick={() => deleteComment.mutate({ taskId: selectedTask._id, commentId: comment._id })} // Call delete mutation
                            className="text-red-600 hover:underline ml-4"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

              {/* Add Comment Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const content = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;
                  addComment.mutate({ taskId: selectedTask._id, content });
                  form.reset();
                }}
              >
                <textarea
                  name="comment"
                  className="w-full border rounded-md p-2"
                  rows={3}
                  placeholder="Add a comment..."
                  required
                />
                <button
                  type="submit"
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Comment
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}; 