import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import Auth from "./pages/Auth";
import SetPassword from "./pages/SetPassword";
import Members from "./pages/Members";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/aceptar-invitacion" element={<AcceptInvitation />} />
            <Route path="/invite/accept" element={<AcceptInvitation />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center text-gray-500 py-20">Módulo de Calendario - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center text-gray-500 py-20">Módulo de Agendamientos - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center text-gray-500 py-20">Módulo de Contactos - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/services" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <div className="text-center text-gray-500 py-20">Módulo de Servicios - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/members" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Members />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/availability" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center text-gray-500 py-20">Módulo de Disponibilidad - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <div className="text-center text-gray-500 py-20">Configuración - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/system-admin" element={
              <ProtectedRoute requiredRole="superadmin">
                <Layout>
                  <div className="text-center text-gray-500 py-20">Administración del Sistema - En desarrollo</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
