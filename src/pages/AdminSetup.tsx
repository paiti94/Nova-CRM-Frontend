import React, { useState } from 'react';
import { api } from '../services/api';

export const AdminSetup = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    setupPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/users/init-admin', {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        setupPassword: formData.setupPassword,
      });

      setSuccess('Admin account created successfully! You can now log in.');
      setFormData({ email: '', name: '', password: '', setupPassword: '' });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create admin account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Initial Admin Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create the first admin account for your application
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-4 text-green-700">{success}</div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="password"
              required
              value={formData.setupPassword}
              onChange={(e) => setFormData({ ...formData, setupPassword: e.target.value })}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Setup Password"
            />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Full Name"
            />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Account Password"
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Admin Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 