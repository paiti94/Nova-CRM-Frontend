// client/src/components/Messages/ContactList.tsx
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import { io } from 'socket.io-client';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  type: string;
  read: boolean; // Ensure this property exists
  createdAt: Date | string;
}

interface Contact {
  _id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
  online: boolean;
}

interface UserData {
  _id: string;
}

interface ContactListProps {
  onSelectContact: (contactId: string) => void;
  selectedContact: string | null;
  onSelectedContactName: (contactName: string) => void;
  selectedContactName: string | null;
  onSelectedContactAvatar: (contactAvatar: string) => void;
  selectedContactAvatar: string | null;
  isAdmin: boolean; 
}

export const ContactList: React.FC<ContactListProps> = ({ onSelectContact, selectedContact, onSelectedContactName, selectedContactName, onSelectedContactAvatar, selectedContactAvatar, isAdmin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', isAdmin],
    queryFn: async () => {
      await getAuthToken(); 
      const endpoint = isAdmin ? '/users' : '/users/admin'; 
      const { data } = await api.get(endpoint);
      return data; 
    },
    enabled: isAuthenticated,
  });
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); 
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: isAuthenticated,
  });

  const userId = userData?._id;

  const { data: unreadCounts = {}} = useQuery({
    queryKey: ['unreadcounts', userId],
    queryFn: async () => {
      await getAuthToken(); 
      const { data } = await api.get(`/messages/unreadcounts/${userId}`);
      return data;
    },
    enabled: !!userId && isAuthenticated,
  });

  // Filter contacts: exclude the current user and apply search query
  const filteredContacts = contacts
    .filter((contact:any) => contact._id !== userId) // Exclude the current user
    .filter((contact:any) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) // Apply search query
    );


  if (contactsLoading || userLoading ) return <div>Loading contacts...</div>;

    // Handle contact selection and mark messages as read
  const handleSelectContact = async (contactId: string, contactName: string, contactAvatar: string) => {
    onSelectContact(contactId);
    onSelectedContactName(contactName);
    onSelectedContactAvatar(contactAvatar);
    console.log(contactId)

    // Mark all messages as read for this contact
    await api.patch(`/messages/read/${contactId}`, { userId }); // Send userId in the request body
  };
  
  
  
  return (
    <>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact: any) => (
          <button
            key={contact._id}
            onClick={() => handleSelectContact(contact.id, contact.name, contact.avatar)} 
            className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 ${
              selectedContact === contact._id ? 'bg-gray-50' : ''
            }`}
          >
            <div className="relative">
               <img
                  src={contact.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces'}
                  alt="Profile"
                  className="w-20 h-20 rounded-full"
                />
              {contact.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {contact.name}
                </h3>
                {unreadCounts[contact._id] > 0 && (
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1"></span> 
              )}
              <p className="text-sm text-gray-500 truncate">
                {unreadCounts[contact._id] > 0 ? '' : ''}
              </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};