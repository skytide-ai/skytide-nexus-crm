
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cop: number;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_members?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
}

export interface CreateServiceData {
  name: string;
  description?: string;
  duration_minutes: number;
  price_cop: number;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  is_active?: boolean;
}

export function useServices() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['services', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_assignments (
            member_id,
            profiles (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(service => ({
        ...service,
        assigned_members: service.service_assignments.map((assignment: any) => assignment.profiles)
      }));
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const { data: service, error } = await supabase
        .from('services')
        .insert({
          ...data,
          organization_id: profile?.organization_id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Servicio creado',
        description: 'El servicio ha sido creado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el servicio. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceData }) => {
      const { data: service, error } = await supabase
        .from('services')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Servicio actualizado',
        description: 'El servicio ha sido actualizado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el servicio. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Servicio eliminado',
        description: 'El servicio ha sido eliminado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el servicio. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}

export function useServiceAssignments(serviceId: string) {
  return useQuery({
    queryKey: ['service-assignments', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_assignments')
        .select(`
          id,
          member_id,
          assigned_at,
          profiles (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('service_id', serviceId);

      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
}

export function useAssignMemberToService() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ serviceId, memberId }: { serviceId: string; memberId: string }) => {
      const { error } = await supabase
        .from('service_assignments')
        .insert({
          service_id: serviceId,
          member_id: memberId,
          assigned_by: profile?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
      toast({
        title: 'Miembro asignado',
        description: 'El miembro ha sido asignado al servicio exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo asignar el miembro al servicio.',
        variant: 'destructive',
      });
    },
  });
}

export function useUnassignMemberFromService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ serviceId, memberId }: { serviceId: string; memberId: string }) => {
      const { error } = await supabase
        .from('service_assignments')
        .delete()
        .eq('service_id', serviceId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
      toast({
        title: 'Miembro desasignado',
        description: 'El miembro ha sido removido del servicio exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo remover el miembro del servicio.',
        variant: 'destructive',
      });
    },
  });
}
