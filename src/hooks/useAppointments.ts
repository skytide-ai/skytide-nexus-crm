

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
        // CORREGIR: Usar parse de date-fns para evitar problemas de timezone
        const appointmentDate = parse(appointmentData.appointment_date, 'yyyy-MM-dd', new Date());
        const dayOfWeek = appointmentDate.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        console.log('=== DEBUGGING AVAILABILITY (FIXED) ===');
        console.log('Appointment date string:', appointmentData.appointment_date);
        console.log('Appointment date object (parsed):', appointmentDate);
        console.log('Day of week calculated:', dayOfWeek);
        console.log('Day names: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday');
        console.log('Current day name:', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]);
        
        console.log('Validating availability for:', {
          memberId: appointmentData.member_id,
          appointmentDate: appointmentData.appointment_date,
          dayOfWeek,
          startTime: appointmentData.start_time,
          endTime: appointmentData.end_time,
          organizationId: profile.organization_id
        });
        
        // Primero, veamos TODA la disponibilidad del miembro para debug
        const { data: allMemberAvailability } = await supabase
          .from('member_availability')
          .select('*')
          .eq('member_id', appointmentData.member_id)
          .eq('organization_id', profile.organization_id);

        console.log('ALL member availability records:', allMemberAvailability);

        // Ahora verificar disponibilidad regular del miembro para el día específico
        const { data: availability, error: availabilityError } = await supabase
          .from('member_availability')
          .select('*')
          .eq('member_id', appointmentData.member_id)
          .eq('organization_id', profile.organization_id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true);

        console.log('Member availability query result for day', dayOfWeek, ':', { 
          data: availability, 
          error: availabilityError,
          count: availability?.length 
        });

        if (availabilityError) {
          console.error('Error checking availability:', availabilityError);
          throw new Error('Error al verificar la disponibilidad del miembro.');
        }

        if (!availability || availability.length === 0) {
          console.log('No availability found for day', dayOfWeek);
          console.log('Available days for this member:', allMemberAvailability?.map(a => a.day_of_week));
          throw new Error(`El miembro no está disponible los ${['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][dayOfWeek]}.`);
        }

        // Verificar que la hora esté dentro del horario disponible
        const startTime = appointmentData.start_time;
        const endTime = appointmentData.end_time;
        
        const isTimeValid = availability.some(slot => {
          console.log('Checking time slot:', slot);
          
          // Normalizar las horas para comparación (asegurar que sean strings)
          // Eliminar los segundos para asegurar comparaciones consistentes
          const normalizedStartTime = String(startTime).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedEndTime = String(endTime).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedSlotStartTime = String(slot.start_time).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedSlotEndTime = String(slot.end_time).trim().substring(0, 5); // Tomar solo HH:MM
          
          console.log('Normalized times for comparison:', {
            normalizedStartTime,
            normalizedEndTime,
            normalizedSlotStartTime,
            normalizedSlotEndTime
          });
          
          // Verificar si la cita está dentro del horario de trabajo
          // IMPORTANTE: Permitir que la cita comience exactamente a la hora de inicio de disponibilidad
          // y termine exactamente a la hora de fin de disponibilidad
          const isWithinWorkingHours = (
            // La hora de inicio de la cita debe ser igual o posterior a la hora de inicio del slot
            normalizedStartTime >= normalizedSlotStartTime && 
            // La hora de fin de la cita debe ser igual o anterior a la hora de fin del slot
            normalizedEndTime <= normalizedSlotEndTime
          );
          
          console.log('Is within working hours?', isWithinWorkingHours, {
            appointmentStart: normalizedStartTime,
            appointmentEnd: normalizedEndTime,
            slotStart: normalizedSlotStartTime,
            slotEnd: normalizedSlotEndTime,
            startTimeComparison: `${normalizedStartTime} >= ${normalizedSlotStartTime} = ${normalizedStartTime >= normalizedSlotStartTime}`,
            endTimeComparison: `${normalizedEndTime} <= ${normalizedSlotEndTime} = ${normalizedEndTime <= normalizedSlotEndTime}`,
            exactMatchStart: normalizedStartTime === normalizedSlotStartTime
          });
          
          // Si hay descanso, verificar que la cita no interfiera
          if (slot.break_start_time && slot.break_end_time) {
            const breakStartTime = String(slot.break_start_time).trim().substring(0, 5); // Tomar solo HH:MM
            const breakEndTime = String(slot.break_end_time).trim().substring(0, 5); // Tomar solo HH:MM
            
            console.log('Break times:', { breakStartTime, breakEndTime });
            
            // Verificar si la cita está completamente dentro del descanso
            const appointmentDuringBreak = 
              (normalizedStartTime >= breakStartTime && normalizedStartTime < breakEndTime) || 
              (normalizedEndTime > breakStartTime && normalizedEndTime <= breakEndTime) ||
              (normalizedStartTime <= breakStartTime && normalizedEndTime >= breakEndTime);
            
            console.log('Break check:', {
              appointmentDuringBreak,
              breakStartTime,
              breakEndTime,
              normalizedStartTime,
              normalizedEndTime
            });
            
            return isWithinWorkingHours && !appointmentDuringBreak;
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
            // Normalizar las horas para comparación (asegurar que sean strings)
            const normalizedStartTime = String(appointmentData.start_time).trim().substring(0, 5); // Tomar solo HH:MM
            const normalizedEndTime = String(appointmentData.end_time).trim().substring(0, 5); // Tomar solo HH:MM
            const normalizedSpecialStartTime = String(specialDate.start_time).trim().substring(0, 5); // Tomar solo HH:MM
            const normalizedSpecialEndTime = String(specialDate.end_time).trim().substring(0, 5); // Tomar solo HH:MM
            
            console.log('Special date normalized times:', {
              normalizedStartTime,
              normalizedEndTime,
              normalizedSpecialStartTime,
              normalizedSpecialEndTime
            });
            
            console.log('Checking special date time constraints:', {
              appointmentStart: normalizedStartTime,
              appointmentEnd: normalizedEndTime,
              specialStart: normalizedSpecialStartTime,
              specialEnd: normalizedSpecialEndTime,
              exactMatchStart: normalizedStartTime === normalizedSpecialStartTime
            });
            
            if (normalizedStartTime < normalizedSpecialStartTime || normalizedEndTime > normalizedSpecialEndTime) {
              throw new Error('La hora seleccionada está fuera del horario especial del miembro para esta fecha.');
            }
          }
        }
      }

      // Validar disponibilidad de la organización
      const appointmentDate = parse(appointmentData.appointment_date, 'yyyy-MM-dd', new Date());
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
      
      // Si la organización tiene horario especial para esta fecha, validar contra ese horario
      if (orgSpecialDate && orgSpecialDate.is_available && orgSpecialDate.start_time && orgSpecialDate.end_time) {
        // Normalizar las horas para comparación
        const normalizedStartTime = String(appointmentData.start_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedEndTime = String(appointmentData.end_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedSpecialStartTime = String(orgSpecialDate.start_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedSpecialEndTime = String(orgSpecialDate.end_time).trim().substring(0, 5); // Tomar solo HH:MM
        
        console.log('Checking organization special date time constraints:', {
          appointmentStart: normalizedStartTime,
          appointmentEnd: normalizedEndTime,
          specialStart: normalizedSpecialStartTime,
          specialEnd: normalizedSpecialEndTime,
          exactMatchStart: normalizedStartTime === normalizedSpecialStartTime
        });
        
        if (normalizedStartTime < normalizedSpecialStartTime || normalizedEndTime > normalizedSpecialEndTime) {
          throw new Error('La hora seleccionada está fuera del horario especial de la organización para esta fecha.');
        }
      }
      
      // Verificar que la hora esté dentro del horario disponible de la organización
      const isOrgTimeValid = orgAvailability.some(slot => {
        // Normalizar las horas para comparación
        const normalizedStartTime = String(appointmentData.start_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedEndTime = String(appointmentData.end_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedSlotStartTime = String(slot.start_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedSlotEndTime = String(slot.end_time).trim().substring(0, 5); // Tomar solo HH:MM
        
        // Verificar si la cita está dentro del horario de trabajo de la organización
        const isWithinWorkingHours = normalizedStartTime >= normalizedSlotStartTime && normalizedEndTime <= normalizedSlotEndTime;
        
        console.log('Checking organization availability:', {
          appointmentStart: normalizedStartTime,
          appointmentEnd: normalizedEndTime,
          slotStart: normalizedSlotStartTime,
          slotEnd: normalizedSlotEndTime,
          exactMatchStart: normalizedStartTime === normalizedSlotStartTime,
          isWithinWorkingHours
        });
        
        // Si hay descanso, verificar que la cita no interfiera
        if (slot.break_start_time && slot.break_end_time) {
          const normalizedBreakStart = String(slot.break_start_time).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedBreakEnd = String(slot.break_end_time).trim().substring(0, 5); // Tomar solo HH:MM
          
          const doesNotConflictWithBreak = normalizedEndTime <= normalizedBreakStart || normalizedStartTime >= normalizedBreakEnd;
          console.log('Organization break check:', { doesNotConflictWithBreak });
          return isWithinWorkingHours && doesNotConflictWithBreak;
        }
        
        return isWithinWorkingHours;
      });
      
      if (!isOrgTimeValid) {
        throw new Error('La hora seleccionada está fuera del horario disponible de la organización.');
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

        // Normalizar las horas para comparación
        const normalizedNewStartTime = String(appointmentData.start_time).trim().substring(0, 5); // Tomar solo HH:MM
        const normalizedNewEndTime = String(appointmentData.end_time).trim().substring(0, 5); // Tomar solo HH:MM
        
        const hasConflict = existingAppointments?.some(apt => {
          // Normalizar las horas de la cita existente
          const normalizedExistingStartTime = String(apt.start_time).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedExistingEndTime = String(apt.end_time).trim().substring(0, 5); // Tomar solo HH:MM
          
          console.log('Verificando conflicto de citas:', {
            nuevaCitaInicio: normalizedNewStartTime,
            nuevaCitaFin: normalizedNewEndTime,
            citaExistenteInicio: normalizedExistingStartTime,
            citaExistenteFin: normalizedExistingEndTime
          });
          
          // Permitir citas "espalda con espalda": una cita puede comenzar exactamente cuando termina otra
          // o terminar exactamente cuando comienza otra
          return normalizedNewStartTime < normalizedExistingEndTime && normalizedNewEndTime > normalizedExistingStartTime;
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
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAppointmentData> }) => {
      if (!profile?.organization_id || !profile?.id) {
        throw new Error('Missing user profile data');
      }

      // Primero, obtener la cita actual para tener todos los datos
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentAppointment) {
        console.error('Error fetching current appointment:', fetchError);
        throw new Error('No se pudo encontrar la cita a actualizar.');
      }

      // Combinar los datos actuales con los nuevos datos
      const updatedAppointmentData = {
        ...currentAppointment,
        ...data
      };

      // Solo validar fecha y hora futuras si se están modificando estos campos
      if (data.appointment_date || data.start_time || data.end_time) {
        const appointmentDateTime = new Date(`${updatedAppointmentData.appointment_date}T${updatedAppointmentData.start_time}`);
        const now = new Date();
        
        if (!isAfter(appointmentDateTime, now)) {
          throw new Error('No se puede agendar citas en el pasado. Selecciona una fecha y hora futuras.');
        }
      }

      // Validar que el miembro esté activo
      if (updatedAppointmentData.member_id) {
        const { data: member, error: memberError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', updatedAppointmentData.member_id)
          .eq('organization_id', profile.organization_id)
          .single();

        if (memberError || !member || !member.is_active) {
          throw new Error('El miembro seleccionado no está activo.');
        }
      }

      // Validar que el servicio esté activo
      if (updatedAppointmentData.service_id) {
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('is_active')
          .eq('id', updatedAppointmentData.service_id)
          .eq('organization_id', profile.organization_id)
          .single();

        if (serviceError || !service || !service.is_active) {
          throw new Error('El servicio seleccionado no está activo.');
        }
      }

      // Validar disponibilidad del miembro
      if (updatedAppointmentData.member_id) {
        const appointmentDate = parse(updatedAppointmentData.appointment_date, 'yyyy-MM-dd', new Date());
        const dayOfWeek = appointmentDate.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        // Verificar disponibilidad regular del miembro para el día específico
        const { data: availability, error: availabilityError } = await supabase
          .from('member_availability')
          .select('*')
          .eq('member_id', updatedAppointmentData.member_id)
          .eq('organization_id', profile.organization_id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true);

        if (availabilityError) {
          console.error('Error checking availability:', availabilityError);
          throw new Error('Error al verificar la disponibilidad del miembro.');
        }

        if (!availability || availability.length === 0) {
          throw new Error(`El miembro no está disponible los ${['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][dayOfWeek]}.`);
        }

        // Verificar que la hora esté dentro del horario disponible
        const startTime = updatedAppointmentData.start_time;
        const endTime = updatedAppointmentData.end_time;
        
        const isTimeValid = availability.some(slot => {
          // Normalizar las horas para comparación (asegurar que sean strings)
          const normalizedStartTime = String(startTime).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedEndTime = String(endTime).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedSlotStartTime = String(slot.start_time).trim().substring(0, 5); // Tomar solo HH:MM
          const normalizedSlotEndTime = String(slot.end_time).trim().substring(0, 5); // Tomar solo HH:MM
          
          // Verificar si la cita está dentro del horario de trabajo
          const isWithinWorkingHours = (
            normalizedStartTime >= normalizedSlotStartTime && 
            normalizedEndTime <= normalizedSlotEndTime
          );
          
          // Si hay descanso, verificar que la cita no interfiera
          if (slot.break_start_time && slot.break_end_time) {
            const breakStartTime = String(slot.break_start_time).trim().substring(0, 5);
            const breakEndTime = String(slot.break_end_time).trim().substring(0, 5);
            
            // Verificar si la cita está completamente dentro del descanso
            const appointmentDuringBreak = 
              (normalizedStartTime >= breakStartTime && normalizedStartTime < breakEndTime) || 
              (normalizedEndTime > breakStartTime && normalizedEndTime <= breakEndTime) ||
              (normalizedStartTime <= breakStartTime && normalizedEndTime >= breakEndTime);
            
            return isWithinWorkingHours && !appointmentDuringBreak;
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
          .eq('member_id', updatedAppointmentData.member_id)
          .eq('date', updatedAppointmentData.appointment_date)
          .single();

        if (specialDate) {
          if (!specialDate.is_available) {
            throw new Error('El miembro no está disponible en esta fecha específica.');
          }
          
          // Si tiene horario especial, validar contra ese horario
          if (specialDate.start_time && specialDate.end_time) {
            // Normalizar las horas para comparación
            const normalizedStartTime = String(updatedAppointmentData.start_time).trim().substring(0, 5);
            const normalizedEndTime = String(updatedAppointmentData.end_time).trim().substring(0, 5);
            const normalizedSpecialStartTime = String(specialDate.start_time).trim().substring(0, 5);
            const normalizedSpecialEndTime = String(specialDate.end_time).trim().substring(0, 5);
            
            if (normalizedStartTime < normalizedSpecialStartTime || normalizedEndTime > normalizedSpecialEndTime) {
              throw new Error('La hora seleccionada está fuera del horario especial del miembro para esta fecha.');
            }
          }
        }
      }

      // Validar disponibilidad de la organización
      const appointmentDate = parse(updatedAppointmentData.appointment_date, 'yyyy-MM-dd', new Date());
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
        .eq('date', updatedAppointmentData.appointment_date)
        .single();

      if (orgSpecialDate && !orgSpecialDate.is_available) {
        throw new Error('La organización no está disponible en esta fecha específica.');
      }
      
      // Si la organización tiene horario especial para esta fecha, validar contra ese horario
      if (orgSpecialDate && orgSpecialDate.is_available && orgSpecialDate.start_time && orgSpecialDate.end_time) {
        // Normalizar las horas para comparación
        const normalizedStartTime = String(updatedAppointmentData.start_time).trim().substring(0, 5);
        const normalizedEndTime = String(updatedAppointmentData.end_time).trim().substring(0, 5);
        const normalizedSpecialStartTime = String(orgSpecialDate.start_time).trim().substring(0, 5);
        const normalizedSpecialEndTime = String(orgSpecialDate.end_time).trim().substring(0, 5);
        
        if (normalizedStartTime < normalizedSpecialStartTime || normalizedEndTime > normalizedSpecialEndTime) {
          throw new Error('La hora seleccionada está fuera del horario especial de la organización para esta fecha.');
        }
      }
      
      // Verificar que la hora esté dentro del horario disponible de la organización
      const isOrgTimeValid = orgAvailability.some(slot => {
        // Normalizar las horas para comparación
        const normalizedStartTime = String(updatedAppointmentData.start_time).trim().substring(0, 5);
        const normalizedEndTime = String(updatedAppointmentData.end_time).trim().substring(0, 5);
        const normalizedSlotStartTime = String(slot.start_time).trim().substring(0, 5);
        const normalizedSlotEndTime = String(slot.end_time).trim().substring(0, 5);
        
        // Verificar si la cita está dentro del horario de trabajo de la organización
        const isWithinWorkingHours = normalizedStartTime >= normalizedSlotStartTime && normalizedEndTime <= normalizedSlotEndTime;
        
        // Si hay descanso, verificar que la cita no interfiera
        if (slot.break_start_time && slot.break_end_time) {
          const normalizedBreakStart = String(slot.break_start_time).trim().substring(0, 5);
          const normalizedBreakEnd = String(slot.break_end_time).trim().substring(0, 5);
          
          const doesNotConflictWithBreak = normalizedEndTime <= normalizedBreakStart || normalizedStartTime >= normalizedBreakEnd;
          return isWithinWorkingHours && doesNotConflictWithBreak;
        }
        
        return isWithinWorkingHours;
      });
      
      if (!isOrgTimeValid) {
        throw new Error('La hora seleccionada está fuera del horario disponible de la organización.');
      }

      // Verificar conflictos con otras citas del mismo miembro
      if (updatedAppointmentData.member_id) {
        const { data: existingAppointments, error: conflictError } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('member_id', updatedAppointmentData.member_id)
          .eq('appointment_date', updatedAppointmentData.appointment_date)
          .in('status', ['programada', 'confirmada', 'en_curso'])
          .neq('id', id); // Excluir la cita actual que estamos editando

        if (conflictError) {
          throw new Error('Error al verificar conflictos de horario.');
        }

        // Normalizar las horas para comparación
        const normalizedNewStartTime = String(updatedAppointmentData.start_time).trim().substring(0, 5);
        const normalizedNewEndTime = String(updatedAppointmentData.end_time).trim().substring(0, 5);
        
        const hasConflict = existingAppointments?.some(apt => {
          // Normalizar las horas de la cita existente
          const normalizedExistingStartTime = String(apt.start_time).trim().substring(0, 5);
          const normalizedExistingEndTime = String(apt.end_time).trim().substring(0, 5);
          
          // Permitir citas "espalda con espalda": una cita puede comenzar exactamente cuando termina otra
          // o terminar exactamente cuando comienza otra
          return normalizedNewStartTime < normalizedExistingEndTime && normalizedNewEndTime > normalizedExistingStartTime;
        });

        if (hasConflict) {
          throw new Error('Ya existe una cita en este horario para el miembro seleccionado.');
        }
      }

      // Realizar la actualización
      const { data: updatedAppointment, error } = await supabase
        .from('appointments')
        .update({ 
          ...data, 
          updated_at: new Date().toISOString()
          // No existe la columna updated_by en la tabla appointments
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      return updatedAppointment;
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
