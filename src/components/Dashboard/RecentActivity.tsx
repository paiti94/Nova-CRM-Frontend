import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, FileUp, UserPlus } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'message',
    content: 'New message from John Doe',
    timestamp: new Date(2024, 1, 15, 14, 30),
    icon: <MessageSquare className="text-purple-600" size={16} />,
  },
  {
    id: 2,
    type: 'file',
    content: 'Project proposal uploaded',
    timestamp: new Date(2024, 1, 15, 13, 45),
    icon: <FileUp className="text-blue-600" size={16} />,
  },
  {
    id: 3,
    type: 'client',
    content: 'New client registered',
    timestamp: new Date(2024, 1, 15, 12, 15),
    icon: <UserPlus className="text-green-600" size={16} />,
  },
];

export const RecentActivity = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="p-2 bg-gray-50 rounded-full">{activity.icon}</div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{activity.content}</p>
              <span className="text-xs text-gray-500">
                {format(activity.timestamp, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};