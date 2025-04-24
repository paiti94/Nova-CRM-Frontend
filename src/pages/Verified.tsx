// src/pages/auth/Verified.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerifiedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Set Successfully!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your password has been set and your email has been verified.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/login')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifiedPage;
