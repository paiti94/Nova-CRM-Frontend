// client/src/components/Messages/ChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { Message } from '../../types';
import io from 'socket.io-client';
import { api, useAuthenticatedApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query'
import isEqual from 'lodash.isequal'; 
import { useAuth0 } from '@auth0/auth0-react';

const socket = io(import.meta.env.VITE_APP_SOCKET_URL  || 'http://localhost:5001'); // Adjust the URL as needed

interface ChatWindowProps {
  contactName: string;
  contactId: string;
  contactAvatar: string;
  senderId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ contactName, contactId, senderId, contactAvatar}) => {
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); 
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: isAuthenticated,
  });
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages = [], isLoading } = useQuery<any[]>({
    queryKey: ['messages', senderId, contactId], 
    queryFn: async () => {
      await getAuthToken(); 
      if (!senderId || !contactId) return [];
      const response = await api.get(`/messages/${senderId}/${contactId}`);
      return response.data; 
    },
    enabled: isAuthenticated && !!senderId && !!contactId,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (Array.isArray(initialMessages) && !isEqual(messages, initialMessages)) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for incoming messages
    socket.on('message', (message: Message) => {
      // Update messages state with the new message
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, []);


  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      _id: Date.now().toString(), // This will be replaced by the actual message ID from the backend
      content: newMessage,
      sender: user?._id || senderId, 
      receiver: contactId,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'text',
    };

    // Emit the message to the server
    socket.emit('message', {
      sender: user?._id || senderId, 
      receiver: contactId,
      content: newMessage,
      type: 'text',
    });
    setMessages((prevMessages) => [...prevMessages, message]);
    setNewMessage('');
  };

  if (isLoading || userLoading) return <div>Loading messages...</div>; // Loading state

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <img
            src={contactAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces'}
            alt="Contact"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="text-sm font-medium text-gray-900">{contactName}</h2>
            {/* <span className="text-xs text-green-500">Online</span> */}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => ( 
          <div
            key={message._id}
            className={`flex ${
              message.sender === user._id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === user._id 
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};