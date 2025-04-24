import React, { useEffect, useState } from 'react';
import { Shield, Key } from 'lucide-react';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import PasswordUpdate from './PasswordUpdate';
import { api, useAuthenticatedApi } from '../../services/api';

export const SecuritySettings = () => {
  const { user } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState<any[]>([]); // Adjust type as needed

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchLastSignIn = async () => {
  //     if (!user) return;

  //     try {
  //       // Get the access token for the Management API
  //       const token = await getAccessTokenSilently();
  //       // Fetch logs from the Auth0 Management API
  //       const response = await fetch(`https://dev-2nd1j0tmanrwdeo7.us.auth0.com/api/v2/logs?per_page=1&include_totals=true&sort=desc`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch logs");
  //       }

  //       const logs = await response.json();
  //       // Find the last sign-in event for the user
  //       const lastSignInEvent = logs.find((log: { type: string; user_id: string }) => log.type === "s" && log.user_id === user.sub);
  //       if (lastSignInEvent) {
  //         setLastSignIn(lastSignInEvent.date);
  //       } else {
  //         setLastSignIn("No sign-in events found.");
  //       }
  //     } catch (err) {
  //       console.error("Error fetching last sign-in info:", err);
  //       setError("Failed to fetch last sign-in information.");
  //     }
  //   };

  //   fetchLastSignIn();
  // }, [user, getAccessTokenSilently]);

    const enableTwoFactorAuth = async () => {
      try {
        await getAuthToken(); 
        await axios.patch(
          `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/users/${user?.sub}`,
          {
            multifactor: ['guardian'], // Enable Guardian (2FA)
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
    
        setSuccess('Two-Factor Authentication enabled successfully!');
      } catch (error) {
        console.error('Error enabling 2FA:', error);
        setError('Failed to enable Two-Factor Authentication. Please try again.');
      }
    };  

    const updatePassword = async (newPassword: string) => {
      try {
        await getAuthToken(); 
        const verificationResponse = await axios.post('/api/verify-password', {
          userId: user?.sub || '',
          password: currentPassword,
        });
  
        if (verificationResponse.data.verified) {
          // If verified, update the password
          await axios.patch(
            `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/users/${user?.sub}`,
            {
              password: newPassword,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
       
          setSuccess('Password updated successfully!');
        } else {
          setError('Current password is incorrect.');
        }
      } catch (error) {
        console.error('Error updating password:', error);
        setError('Failed to update password. Please try again.');
      }
    };

    const fetchRecentSecurityActivity = async () => {
      try {
        await getAuthToken(); 
    
        const { data } = await axios.get(
          `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/logs`
        );
    
        // Process and set the recent activity data
        setRecentActivity(data);
      } catch (error) {
        console.error('Error fetching recent security activity:', error);
        setError('Failed to fetch recent security activity. Please try again.');
      }
    };

    // useEffect(() => {
    //   fetchRecentSecurityActivity();
    // }, []);
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Security Settings
      </h2>

      <div className="space-y-6">
        {/* <div>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="text-gray-400" size={20} />
            <h3 className="text-sm font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
          </div>
          
          <div className="ml-9">
            <p className="text-sm text-gray-500 mb-4">
              Add an extra layer of security to your account by enabling two-factor
              authentication.
            </p>
            <button
              onClick={enableTwoFactorAuth}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Enable 2FA
            </button>
          </div>
        </div> */}

        <div>
          <div className="flex items-center space-x-3 mb-4">
            <Key className="text-gray-400" size={20} />
            <h3 className="text-sm font-medium text-gray-900">
              Password Settings
            </h3>
          </div>
          
          <div className="ml-9">
            {/* <p className="text-sm text-gray-500 mb-4">
              Manage your password and security preferences.
            </p>
            <button
              onClick={() => updatePassword('newPassword123')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Change Password
            </button> */}
            <PasswordUpdate />  
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Recent Security Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              {/* <span className="text-gray-500">Last sign in</span>
              <span className="text-gray-900">Today, 2:34 PM</span> */}
              {/* {lastSignIn ? (
        <p>Last Sign-In: {new Date(lastSignIn).toLocaleString()}</p>
      ) : (
        <p>Loading last sign-in information...</p>
      )} */}
            </div>
            {/* <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last password change</span>
              <span className="text-gray-900">30 days ago</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active sessions</span>
              <span className="text-gray-900">2 devices</span>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};