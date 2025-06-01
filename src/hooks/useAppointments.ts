
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isSameDay, parse } from 'date-fns';

export interface AppointmentWithDetails {
  id: string;
  organization_id: string;
  contact_id: string;
  service_id?: string;
  member_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'programada' | 'confirmada' | 'cancelada' | 'no_asistida' | 'en_curso' | 'completada';
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
  status?: 'programada' | 'confirmada' | 'cancelada' | 'no_asistida' | 'en_curso' | 'completada';
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

      // Validar que la fecha y hora sean futuras
      const appointmentDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.start_time}`);
      const now = new Date();
      
      if (!isAfter(appointmentDateTime, now)) {
        throw new Error('No se puede agendar citas en el pasado. Selecciona una fecha y hora futuras.');
      }

      // Validar que el miembro esté activo
      if (appointmentData.member_id) {
        const { data: member, error: memberError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', appointmentData.member_id)
          .eq('organization_id', profile.organization_id)
          .single();

        if (memberError || !member || !member.is_active) {
          throw new Error('El miembro seleccionado no está activo.');
        }
      }

      // Validar que el servicio esté activo
      if (appointmentData.service_id) {
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('is_active')
          .eq('id', appointmentData.service_id)
          .eq('organization_id', profile.organization_id)
          .single();

        if (serviceError || !service || !service.is_active) {
          throw new Error('El servicio seleccionado no está activo.');
        }
      }

      // Validar disponibilidad del miembro
      if (appointmentData.member_id) {
        const appointmentDate = new Date(appointmentData.appointment_date);
        const dayOfWeek = appointmentDate.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        console.log('Validating availability for:', {
          memberId: appointmentData.member_id,
          appointmentDate: appointmentData.appointment_date,
          dayOfWeek,
          startTime: appointmentData.start_time,
          endTime: appointmentData.end_time,
          organizationId: profile.organization_id
        });
        
        // Verificar disponibilidad regular del miembro con más debug
        const availabilityQuery = supabase
          .from('member_availability')
          .select('*')
          .eq('member_id', appointmentData.member_id)
          .eq('organization_id', profile.organization_id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true);

        console.log('Running availability query with filters:', {
          member_id: appointmentData.member_id,
          organization_id: profile.organization_id,
          day_of_week: dayOfWeek,
          is_available: true
        });

        const { data: availability, error: availabilityError } = await availabilityQuery;

        console.log('Member availability query result:', { 
          data: availability, 
          error: availabilityError,
          count: availability?.length 
        });

        if (availabilityError) {
          console.error('Error checking availability:', availabilityError);
          throw new Error('Error al verificar la disponibilidad del miembro.');
        }

        if (!availability || availability.length === 0) {
          // Consulta adicional para debug - ver todos los horarios del miembro
          const { data: allAvailability } = await supabase
            .from('member_availability')
            .select('*')
            .eq('member_id', appointmentData.member_id)
            .eq('organization_id', profile.organization_id);

          console.log('All member availability for debug:', allAvailability);

          throw new Error('El miembro no está disponible en este día de la semana.');
        }

        // Verificar que la hora esté dentro del horario disponible (al menos uno de los slots)
        const startTime = appointmentData.start_time;
        const endTime = appointmentData.end_time;
        
        const isTimeValid = availability.some(slot => {
          const isWithinWorkingHours = startTime >= slot.start_time && endTime <= slot.end_time;
          
          // Si hay descanso, verificar que la cita no interfiera
          if (slot.break_start_time && slot.break_end_time) {
            const doesNotConflictWithBreak = endTime <= slot.break_start_time || startTime >= slot.break_end_time;
            return isWithinWorkingHours && doesNotConflictWithBreak;
          }
          
          return isWithinWorkingHours;
        });

        if (!isTimeValid) {
          throw new Error('La hora seleccionada está fuera del horario disponible del miembro.');
        }

        // Verificar fechas especiales del miembro
        const { data: specialDate } = await supabase
          .from('member_special_dates')
          .select('*')
          .eq('member_id', appointmentData.member_id)
          .eq('date', appointmentData.appointment_date)
          .single();

        if (specialDate) {
          if (!specialDate.is_available) {
            throw new Error('El miembro no está disponible en esta fecha específica.');
          }
          
          // Si tiene horario especial, validar contra ese horario
          if (specialDate.start_time && specialDate.end_time) {
            if (startTime < specialDate.start_time || endTime > specialDate.end_time) {
              throw new Error('La hora seleccionada está fuera del horario especial del miembro para esta fecha.');
            }
          }
        }
      }

      // Validar disponibilidad de la organización
      const appointmentDate = new Date(appointmentData.appointment_date);
      const dayOfWeek = appointmentDate.getDay();
      
      const { data: orgAvailability, error: orgAvailabilityError } = await supabase
        .from('organization_availability')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (orgAvailabilityError) {
        console.error('Error checking organization availability:', orgAvailabilityError);
        throw new Error('Error al verificar la disponibilidad de la organización.');
      }

      if (!orgAvailability || orgAvailability.length === 0) {
        throw new Error('La organización no está disponible en este día de la semana.');
      }

      // Verificar fechas especiales de la organización
      const { data: orgSpecialDate } = await supabase
        .from('organization_special_dates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('date', appointmentData.appointment_date)
        .single();

      if (orgSpecialDate && !orgSpecialDate.is_available) {
        throw new Error('La organización no está disponible en esta fecha específica.');
      }

      // Verificar conflictos con otras citas del mismo miembro
      if (appointmentData.member_id) {
        const { data: existingAppointments, error: conflictError } = await supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('member_id', appointmentData.member_id)
          .eq('appointment_date', appointmentData.appointment_date)
          .in('status', ['programada', 'confirmada', 'en_curso']);

        if (conflictError) {
          throw new Error('Error al verificar conflictos de horario.');
        }

        const hasConflict = existingAppointments?.some(apt => {
          return !(appointmentData.end_time <= apt.start_time || appointmentData.start_time >= apt.end_time);
        });

        if (hasConflict) {
          throw new Error('Ya existe una cita en este horario para el miembro seleccionado.');
        }
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          status: appointmentData.status || 'programada',
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
