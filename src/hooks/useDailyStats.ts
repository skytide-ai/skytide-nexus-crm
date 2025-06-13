import { useQuery } from '@tanstack/react-query';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DailyStats {
  day: number;
  date: string;
  citas: number;
  facturacion: number;
}

export function useDailyStats(date: Date = new Date()) {
  const { organization } = useAuth();
  // Calcular el primer y último día del mes manualmente
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return useQuery({
    queryKey: ['dailyStats', organization?.id, startDate, endDate],
    queryFn: async () => {
      if (!organization?.id) throw new Error('No organization ID');

      // Consulta SQL para obtener estadísticas diarias
      const { data, error } = await supabase.rpc('get_daily_stats' as any, {
        p_organization_id: organization.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      console.log('Daily stats response:', { 
        data, 
        error, 
        params: {
          p_organization_id: organization.id,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        }
      });

      if (error) throw error;

      // Si no hay datos, creamos un array con todos los días del mes con valores en cero
      if (!data || data.length === 0) {
        const daysInMonth = endDate.getDate();
        const emptyData: DailyStats[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
          emptyData.push({
            day,
            date: `${day} ${currentDate.toLocaleString('es', { month: 'short' })}`,
            citas: 0,
            facturacion: 0
          });
        }
        
        return emptyData;
      }

      // Transformar los datos de la API en el formato que necesita el gráfico
      const dailyStats: DailyStats[] = [];
      const daysInMonth = endDate.getDate();
      
      // Crear un mapa para acceder rápidamente a los datos por día
      const dataByDay = new Map();
      const typedData = data as any[];
      typedData.forEach((row: any) => {
        const day = new Date(row.date).getDate();
        dataByDay.set(day, {
          citas: Number(row.appointments || 0),
          facturacion: Number(row.revenue || 0)
        });
        console.log('Daily data row:', { day, appointments: row.appointments, revenue: row.revenue });
      });
      
      // Generar array con todos los días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
        const dayData = dataByDay.get(day) || { citas: 0, facturacion: 0 };
        
        dailyStats.push({
          day,
          date: `${day} ${currentDate.toLocaleString('es', { month: 'short' })}`,
          citas: dayData.citas,
          facturacion: dayData.facturacion
        });
      }

      return dailyStats;
    },
    enabled: !!organization?.id
  });
}
