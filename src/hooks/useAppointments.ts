import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface AppointmentWithDetails {
  id: string;
  organization_id: string;
  contact_id: string;
  service_id?: string;
  member_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'agendada' | 'confirmada' | 'cancelada' | 'no_asistida' | 'en_curso' | 'completada';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  contacts: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  services?: {
    name: string;
    duration_minutes: number;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateAppointmentData {
  contact_id: string;
  service_id?: string;
  member_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status?: 'agendada' | 'confirmada' | 'cancelada' | 'no_asistida' | 'en_curso' | 'completada';
}

export function useAppointments(date?: Date) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['appointments', profile?.organization_id, date ? format(date, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      let query = supabase
        .from('appointments')
        .select(`
          *,
          contacts!inner (
            first_name,
            last_name,
            phone
          ),
          services (
            name,
            duration_minutes
          ),
          profiles!appointments_member_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile.organization_id);

      // Si se proporciona una fecha, filtrar por esa fecha
      if (date) {
        query = query.eq('appointment_date', format(date, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      return data as AppointmentWithDetails[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData) => {
      if (!profile?.organization_id || !profile?.id) {
        throw new Error('Missing user profile data');
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          status: appointmentData.status || 'agendada',
          organization_id: profile.organization_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Cita creada',
        description: 'La cita ha sido creada exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Appointment creation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la cita. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAppointmentData> }) => {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Cita actualizada',
        description: 'La cita ha sido actualizada exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Appointment update failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la cita. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: 'Cita eliminada',
        description: 'La cita ha sido eliminada exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Appointment deletion failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la cita. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}
