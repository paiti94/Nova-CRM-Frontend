import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { api, useAuthenticatedApi } from "../../services/api";
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const ProfileSettings = () => {
  const { user, isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi(); 
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    phone: '',
    company: '',
    role: '',
  });
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); 
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: isAuthenticated,
  });

  // Update formData when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        avatar: userData.picture || '',
        phone: userData.phoneNumber || '',
        company: userData.company || '',
        role: userData.position || '',
      });
      setLoading(false); // Set loading to false when userData is available
    }
  }, [userData]);

  // Show loading state
  if (loading || userLoading) {
    return <p>Loading...</p>; // Show loading state while fetching data
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    await getAuthToken(); 
    try {
      // Update Auth0 profile if name or email has changed
      if (user && (user.name !== formData.name || user.email !== formData.email)) {
        await axios.patch(
          `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/users/${user.sub}`,
          {
            name: formData.name,
            email: formData.email,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Update backend profile if other fields have changed
      if (userData.phoneNumber !== formData.phone || userData.company !== formData.company || userData.position !== formData.role) {
        await api.patch('/users/profile', {
          name: formData.name,
          phoneNumber: formData.phone,
          company: formData.company,
          position: formData.role,
          updatedAt: new Date(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Settings</h2>
      <div className="flex items-center space-x-6 mb-6">
        <div className="relative">
          <img
            src={previewUrl || formData.avatar || "https://brand.ucmerced.edu/sites/brand.ucmerced.edu/files/placeholder_1.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
        </div>
        <div>
          <h3 className="text-gray-900 font-medium">{formData.name}</h3>
          <p className="text-gray-500 text-sm">{formData.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
    </div>
  );
};