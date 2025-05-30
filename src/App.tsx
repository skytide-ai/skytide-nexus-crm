
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<div className="text-center text-gray-500 py-20">Módulo de Calendario - En desarrollo</div>} />
            <Route path="/appointments" element={<div className="text-center text-gray-500 py-20">Módulo de Agendamientos - En desarrollo</div>} />
            <Route path="/contacts" element={<div className="text-center text-gray-500 py-20">Módulo de Contactos - En desarrollo</div>} />
            <Route path="/services" element={<div className="text-center text-gray-500 py-20">Módulo de Servicios - En desarrollo</div>} />
            <Route path="/members" element={<div className="text-center text-gray-500 py-20">Módulo de Miembros - En desarrollo</div>} />
            <Route path="/availability" element={<div className="text-center text-gray-500 py-20">Módulo de Disponibilidad - En desarrollo</div>} />
            <Route path="/settings" element={<div className="text-center text-gray-500 py-20">Configuración - En desarrollo</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
