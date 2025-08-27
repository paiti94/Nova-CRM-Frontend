import React from 'react';
import { useLatestEmail } from '../hooks/useLatestEmail';

export function LatestEmail({ enabled }: { enabled: boolean }) {
    const { data, isLoading, isError } = useLatestEmail(enabled);
  
    if (!enabled) return null; // hide until connected
    if (isLoading) return <p>Loading latest email...</p>;
    if (isError) return <p>Failed to load latest email.</p>;
    if (!data) return <p>No emails found.</p>;
  
    return (
      <div className="border rounded p-4 bg-white shadow">
        <h2 className="font-bold text-lg mb-2">Latest Email</h2>
        <p><strong>From:</strong> {data.from}</p>
        <p><strong>Subject:</strong> {data.subject}</p>
        <p><strong>Received:</strong> {new Date(data.receivedAt).toLocaleString()}</p>
        <p className="text-gray-700 mt-2">{data.bodyText}</p>
      </div>
    );
  }