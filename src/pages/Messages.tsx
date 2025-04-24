import React, { useEffect, useState } from 'react';
import { ChatWindow } from '../components/Messages/ChatWindow';
import { ContactList } from '../components/Messages/ContactList';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api'; // Import useAuthenticatedApi
import { useAuth0 } from '@auth0/auth0-react';

const Messages = () => {
  const { getAuthToken } = useAuthenticatedApi(); // Get the getAuthToken function
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null);
  const [selectedContactAvatar, setSelectedContactAvatar] = useState<string | null>(null);

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

  return (
    <div className="h-[calc(100vh-9rem)] flex space-x-4">
      <div className="w-1/4 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <ContactList 
          onSelectContact={setSelectedContact} 
          onSelectedContactName={setSelectedContactName} 
          onSelectedContactAvatar={setSelectedContactAvatar} 
          selectedContact={selectedContact} 
          selectedContactName={selectedContactName} 
          selectedContactAvatar={selectedContactAvatar} 
          isAdmin={isAdmin} 
        />
      </div>
      
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        {selectedContact ? (
          <ChatWindow 
            contactName={selectedContactName || ''} 
            contactId={selectedContact} 
            senderId={userData?._id} 
            contactAvatar={selectedContactAvatar || ''} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a contact to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;