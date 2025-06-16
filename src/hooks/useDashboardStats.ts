import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ServiceStats {
  service_id: string;
  service_name: string;
  service_appointments: number;
  service_completed_appointments: number;
  service_revenue: number;
}

interface DashboardStats {
  total_appointments: number;
  total_completed_appointments: number;
  total_revenue: number;
  new_contacts: number;
  service_stats: ServiceStats[];
}

export function useDashboardStats(date: Date = new Date()) {
  const { organization } = useAuth();
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  return useQuery({
    queryKey: ['dashboardStats', organization?.id, startDate, endDate],
    queryFn: async () => {
      if (!organization?.id) throw new Error('No organization ID');

      // Usamos any para evitar problemas de tipado con la función RPC
      const { data, error } = await supabase.rpc('get_dashboard_stats' as any, {
        p_organization_id: organization.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      console.log('Dashboard stats response:', { data, error, params: {
        p_organization_id: organization.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      }});

      if (error) throw error;

      // Transformar los datos planos en la estructura que necesitamos
      const serviceStats: ServiceStats[] = [];
      const seen = new Set<string>();

      // Usamos any para evitar problemas de tipado
      const typedData = data as any[];
      
      // Ahora la función SQL ya calcula los totales correctamente
      // Solo necesitamos extraer los datos del primer registro para los totales
      const totalAppointments = Number(typedData[0]?.total_appointments || 0);
      const totalCompletedAppointments = Number(typedData[0]?.total_completed_appointments || 0);
      const totalRevenue = Number(typedData[0]?.total_revenue || 0);
      const newContacts = Number(typedData[0]?.new_contacts || 0);
      
      typedData.forEach((row: any) => {
        if (row.service_id && !seen.has(row.service_id)) {
          seen.add(row.service_id);
          
          serviceStats.push({
            service_id: row.service_id,
            service_name: row.service_name,
            service_appointments: Number(row.service_appointments || 0),
            service_completed_appointments: Number(row.service_completed_appointments || 0),
            service_revenue: Number(row.service_revenue || 0)
          });
        }
      });

      console.log('Dashboard stats totals:', {
        totalAppointments,
        totalCompletedAppointments,
        totalRevenue,
        newContacts,
        serviceStatsCount: serviceStats.length
      });

      return {
        total_appointments: totalAppointments,
        total_completed_appointments: totalCompletedAppointments,
        total_revenue: totalRevenue,
        new_contacts: newContacts,
        service_stats: serviceStats.sort((a, b) => b.service_appointments - a.service_appointments)
      };
    },
    enabled: !!organization?.id
  });
}

// Hook para obtener estadísticas históricas
export function useHistoricalStats(months: number = 6) {
  const { organization } = useAuth();
  const endDate = new Date();
  const startDate = subMonths(startOfMonth(endDate), months - 1);

  return useQuery({
    queryKey: ['historicalStats', organization?.id, months],
    queryFn: async () => {
      if (!organization?.id) throw new Error('No organization ID');

      const monthlyStats = [];
      let currentDate = startDate;

      while (currentDate <= endDate) {
        // Usamos any para evitar problemas de tipado con la función RPC
        const { data, error } = await supabase.rpc('get_dashboard_stats' as any, {
          p_organization_id: organization.id,
          p_start_date: startOfMonth(currentDate).toISOString(),
          p_end_date: endOfMonth(currentDate).toISOString()
        });

        console.log('Historical stats for month:', { 
          month: currentDate.toLocaleString('es', { month: 'short' }),
          data, 
          error 
        });

        if (error) throw error;

        // Usamos any para evitar problemas de tipado
        const typedData = data as any[];
        
        // Ahora la función SQL ya calcula los totales correctamente
        const totalCompletedAppointments = Number(typedData[0]?.total_completed_appointments || 0);
        const totalRevenue = Number(typedData[0]?.total_revenue || 0);
        
        console.log(`Estadísticas para ${currentDate.toLocaleString('es', { month: 'short' })}:`, {
          totalCompletedAppointments,
          totalRevenue
        });
        
        monthlyStats.push({
          name: currentDate.toLocaleString('es', { month: 'short' }),
          citas: totalCompletedAppointments,
          facturacion: totalRevenue
        });

        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }

      return monthlyStats;
    },
    enabled: !!organization?.id
  });
}
