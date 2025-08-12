// src/services/fileApi.ts

import { api } from './api'; // path to your api.ts

export const downloadAllFilesAsZip = async (folderId: string) => {
  const endpoint = `/files/folders/${folderId}/download-all?nocache=${Date.now()}`;
  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });

    // Create download link and trigger
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folder-${folderId}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    alert('Download failed.');
    console.error('Error downloading zip:', err);
  }
};
