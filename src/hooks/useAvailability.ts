
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
export interface MemberAvailability {
  id: string;
  member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id: string;
}

export interface MemberSpecialDate {
  id: string;
  member_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id: string;
}

export interface OrganizationAvailability {
  id: string;
  organization_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrganizationSpecialDate {
  id: string;
  organization_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Hook para disponibilidad semanal de miembros
export function useMemberAvailability(memberId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['member-availability', memberId || profile?.id],
    queryFn: async () => {
      const targetMemberId = memberId || profile?.id;
      if (!targetMemberId) throw new Error('No member ID provided');

      const { data, error } = await supabase
        .from('member_availability')
        .select('*')
        .eq('member_id', targetMemberId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!(memberId || profile?.id),
  });
}

// Hook para fechas especiales de miembros
export function useMemberSpecialDates(memberId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['member-special-dates', memberId || profile?.id],
    queryFn: async () => {
      const targetMemberId = memberId || profile?.id;
      if (!targetMemberId) throw new Error('No member ID provided');

      const { data, error } = await supabase
        .from('member_special_dates')
        .select('*')
        .eq('member_id', targetMemberId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!(memberId || profile?.id),
  });
}

// Hook para disponibilidad semanal de la organización
export function useOrganizationAvailability() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['organization-availability', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization ID');

      const { data, error } = await supabase
        .from('organization_availability')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });
}

// Hook para fechas especiales de la organización
export function useOrganizationSpecialDates() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['organization-special-dates', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization ID');

      const { data, error } = await supabase
        .from('organization_special_dates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });
}

// Mutations para disponibilidad de miembros
export function useCreateMemberAvailability() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<MemberAvailability, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id'>) => {
      if (!profile?.id || !profile?.organization_id) throw new Error('User profile not found');

      // Verificar si ya existe un horario para este día
      const { data: existingSlots, error: fetchError } = await supabase
        .from('member_availability')
        .select('*')
        .eq('member_id', data.member_id)
        .eq('day_of_week', data.day_of_week);

      if (fetchError) throw fetchError;

      // Si ya existe un horario para este día, lanzar error
      if (existingSlots && existingSlots.length > 0) {
        throw new Error(`Ya existe un horario definido para este día. Por favor, edite o elimine el horario existente.`);
      }

      const { data: result, error } = await supabase
        .from('member_availability')
        .insert({
          ...data,
          created_by: profile.id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-availability'] });
      toast({
        title: 'Disponibilidad creada',
        description: 'La disponibilidad ha sido creada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la disponibilidad.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMemberAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MemberAvailability> }) => {
      const { data: result, error } = await supabase
        .from('member_availability')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-availability'] });
      toast({
        title: 'Disponibilidad actualizada',
        description: 'La disponibilidad ha sido actualizada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la disponibilidad.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMemberAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-availability'] });
      toast({
        title: 'Disponibilidad eliminada',
        description: 'La disponibilidad ha sido eliminada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la disponibilidad.',
        variant: 'destructive',
      });
    },
  });
}

// Mutations para fechas especiales de miembros
export function useCreateMemberSpecialDate() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<MemberSpecialDate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id'>) => {
      if (!profile?.id || !profile?.organization_id) throw new Error('User profile not found');
      
      // Asegurar que la fecha se maneje correctamente
      // La fecha viene en formato YYYY-MM-DD
      // Necesitamos asegurarnos de que Supabase la interprete correctamente
      const dateStr = data.date;
      
      // Crear un objeto con los datos formateados correctamente
      const formattedData = {
        ...data,
        // Usar la fecha en formato ISO para evitar problemas de zona horaria
        // Agregamos T00:00:00 para asegurar que se interprete como medianoche en la zona horaria local
        date: `${dateStr}T00:00:00`,
        created_by: profile.id,
        organization_id: profile.organization_id,
      };
      
      console.log('Sending special date to server:', formattedData);

      const { data: result, error } = await supabase
        .from('member_special_dates')
        .insert(formattedData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-special-dates'] });
      toast({
        title: 'Fecha especial creada',
        description: 'La fecha especial ha sido creada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la fecha especial.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMemberSpecialDate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_special_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-special-dates'] });
      toast({
        title: 'Fecha especial eliminada',
        description: 'La fecha especial ha sido eliminada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la fecha especial.',
        variant: 'destructive',
      });
    },
  });
}

// Mutations para disponibilidad de organización
export function useCreateOrganizationAvailability() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<OrganizationAvailability, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id'>) => {
      if (!profile?.id || !profile?.organization_id) throw new Error('User profile not found');

      // Verificar si ya existe un horario para este día
      const { data: existingSlots, error: fetchError } = await supabase
        .from('organization_availability')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('day_of_week', data.day_of_week);

      if (fetchError) throw fetchError;

      // Si ya existe un horario para este día, lanzar error
      if (existingSlots && existingSlots.length > 0) {
        throw new Error(`Ya existe un horario definido para este día. Por favor, edite o elimine el horario existente.`);
      }

      const { data: result, error } = await supabase
        .from('organization_availability')
        .insert({
          ...data,
          created_by: profile.id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-availability'] });
      toast({
        title: 'Disponibilidad organizacional creada',
        description: 'La disponibilidad organizacional ha sido creada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la disponibilidad organizacional.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteOrganizationAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-availability'] });
      toast({
        title: 'Disponibilidad organizacional eliminada',
        description: 'La disponibilidad organizacional ha sido eliminada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la disponibilidad organizacional.',
        variant: 'destructive',
      });
    },
  });
}

// Mutations para fechas especiales de organización
export function useCreateOrganizationSpecialDate() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<OrganizationSpecialDate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id'>) => {
      if (!profile?.id || !profile?.organization_id) throw new Error('User profile not found');

      // Asegurar que la fecha se maneje correctamente
      // La fecha viene en formato YYYY-MM-DD
      // Necesitamos asegurarnos de que Supabase la interprete correctamente
      const dateStr = data.date;
      
      // Crear un objeto con los datos formateados correctamente
      const formattedData = {
        ...data,
        // Usar la fecha en formato ISO para evitar problemas de zona horaria
        // Agregamos T00:00:00 para asegurar que se interprete como medianoche en la zona horaria local
        date: `${dateStr}T00:00:00`,
        created_by: profile.id,
        organization_id: profile.organization_id,
      };
      
      console.log('Sending organization special date to server:', formattedData);

      const { data: result, error } = await supabase
        .from('organization_special_dates')
        .insert(formattedData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-special-dates'] });
      toast({
        title: 'Fecha especial organizacional creada',
        description: 'La fecha especial organizacional ha sido creada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la fecha especial organizacional.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteOrganizationSpecialDate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_special_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-special-dates'] });
      toast({
        title: 'Fecha especial organizacional eliminada',
        description: 'La fecha especial organizacional ha sido eliminada exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la fecha especial organizacional.',
        variant: 'destructive',
      });
    },
  });
}
