import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth0, LogoutOptions } from '@auth0/auth0-react';

interface AuthContextType {
  loginWithRedirect: () => void;
  logout: (options?: LogoutOptions) => void;
  user: any;
  isAuthenticated: boolean;
  accessToken: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
  audience: string;
  scope: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, audience, scope }) => {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // Function to fetch new token
  const checkSession = async () => {
    console.log("🔄 Running checkSession...");
    
    if (!audience || !scope) {
      console.error("❌ Missing audience or scope. Check your .env file.");
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience,
          scope,
        },
        detailedResponse: false, // Only get the token string
        cacheMode: 'off',
      });

      setAccessToken(token);
      console.log("✅ Access Token:", token);
    } catch (error: any) {
      console.error("❌ Error getting access token:", error);
      
      if (error.error === "login_required") {
        console.warn("⚠️ User needs to log in again. Redirecting...");
        loginWithRedirect();
      }
    }
  };

  // Run checkSession when authenticated & every 60 seconds
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔐 User is authenticated. Checking session...");
      checkSession();
      
      const interval = setInterval(checkSession, 60000); // Refresh token every 60 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ loginWithRedirect, logout, user, isAuthenticated, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
