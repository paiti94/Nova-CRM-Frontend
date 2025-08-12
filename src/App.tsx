import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/Layout/MainLayout';
import { Login } from './pages/Login';
import { TaskManagement } from './components/Tasks/TaskManagement';
import AdminPage from './pages/AdminPage';
import { AdminSetup } from './pages/AdminSetup';
import 'primereact/resources/themes/saga-blue/theme.css'; // Choose your theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import VerifiedPage from './pages/Verified';
import { OutlookIntegrationPage } from './pages/OutlookIntegrationPage';
import ApiAuthProvider from './providers/ApiAuthProvider';
// Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Files = React.lazy(() => import('./pages/Files'));
const Settings = React.lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient();

function AppRoutes() {
  const { getAccessTokenSilently, isLoading, isAuthenticated } = useAuth0();
 
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/admin-setup" element={<AdminSetup />} />
      <Route path="/auth/verified" element={<VerifiedPage />} />
      
      {isAuthenticated ? (
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <Dashboard />
              </React.Suspense>
            }
          />
          <Route
            path="/clients"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <Clients />
              </React.Suspense>
            }
          />
          <Route
            path="/messages"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <Messages />
              </React.Suspense>
            }
          />
          <Route
            path="/files"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <Files />
              </React.Suspense>
            }
          />
             <Route
            path="/tasks"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <TaskManagement />
              </React.Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <Settings />
              </React.Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <AdminPage />
              </React.Suspense>
            }
          />
        <Route path="/outlook" element={<OutlookIntegrationPage />} />
        </Route>
        
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID} //My App in Auth0
      authorizationParams={{
        redirect_uri: `${window.location.origin}/dashboard`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: import.meta.env.VITE_AUTH0_SCOPE
      }}
      cacheLocation='localstorage'
    >
       {/* <AuthProvider audience={audience} scope={scope}> */}
        <BrowserRouter>
          {/* <ApiAuthProvider> */}
            <AppRoutes />
          {/* </ApiAuthProvider> */}
        </BrowserRouter>
      {/* </AuthProvider> */}
    </Auth0Provider>
    </QueryClientProvider>
  );
}

export default App;