import React from 'react';
import { ProfileSettings } from '../components/Settings/ProfileSettings';
import { NotificationSettings } from '../components/Settings/NotificationSettings';
import { SecuritySettings } from '../components/Settings/SecuritySettings';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      <div className="bg-white shadow rounded-lg divide-y">
        <ProfileSettings />
        {/* <NotificationSettings /> */}
        <SecuritySettings />
      </div>
    </div>
  );
};

export default Settings;