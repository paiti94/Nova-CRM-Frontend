import React, { useState } from 'react';

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export const NotificationSettings = () => {
  const [notifications, setNotifications] = useState<NotificationOption[]>([
    {
      id: 'new-message',
      title: 'New Messages',
      description: 'Get notified when you receive new messages from clients',
      enabled: true,
    },
    {
      id: 'file-upload',
      title: 'File Uploads',
      description: 'Get notified when new files are uploaded to your folders',
      enabled: true,
    },
    {
      id: 'mentions',
      title: 'Mentions',
      description: 'Get notified when you are mentioned in comments',
      enabled: false,
    },
    {
      id: 'updates',
      title: 'Project Updates',
      description: 'Get notified about project status changes',
      enabled: true,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id
        ? { ...notification, enabled: !notification.enabled }
        : notification
    ));
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Notification Settings
      </h2>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center justify-between"
          >
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-500">{notification.description}</p>
            </div>
            <button
              onClick={() => toggleNotification(notification.id)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                notification.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notification.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};