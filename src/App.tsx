
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import Auth from '@/pages/Auth';
import { Dashboard } from '@/components/Dashboard';
import Members from '@/pages/Members';
import Services from '@/pages/Services';
import { Availability } from '@/pages/Availability';
import Contacts from '@/pages/Contacts';
import Calendar from '@/pages/Calendar';
import AcceptInvitation from '@/pages/AcceptInvitation';
import SetPassword from '@/pages/SetPassword';
import NotFound from '@/pages/NotFound';
import SystemAdmin from '@/pages/SystemAdmin';
import ChatPage from '@/pages/Chat';
import Administration from '@/pages/Administration';
import Tags from '@/pages/Tags';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/aceptar-invitacion" element={<AcceptInvitation />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route
              path="/system-admin"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <SystemAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administration"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <Layout>
                    <Administration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/members" element={<Members />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/availability" element={<Availability />} />
                      <Route path="/contacts" element={<Contacts />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/tags" element={<Tags />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
