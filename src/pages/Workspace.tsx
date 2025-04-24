import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FolderStructure } from '../components/Files/FolderStructure';
import { FileList } from '../components/Files/FileList';
import { ClientSelector } from '../components/Workspace/ClientSelector';

export const Workspace = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const { data: folderContents, isLoading } = useQuery({
    queryKey: ['folderContents', currentFolder, selectedClient],
    queryFn: async () => {
      const { data } = await api.get(`/files/folders/${currentFolder || 'root'}`, {
        params: { clientId: selectedClient }
      });
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <ClientSelector
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
        />
      </div>

      <div className="flex-1 flex">
        <div className="w-1/4 border-r">
          <FolderStructure
            selectedFolder={currentFolder || ''}
            onSelectFolder={setCurrentFolder}
            clientId={selectedClient || ''}
          />
        </div>

        <div className="flex-1">
          <FileList
            files={folderContents?.files || []}
            folders={folderContents?.folders || []}
            onFolderClick={setCurrentFolder}
            clientId={selectedClient}
          />
        </div>
      </div>
    </div>
  );
}; 