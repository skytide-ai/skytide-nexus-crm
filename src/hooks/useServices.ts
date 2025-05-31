
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
    avatar_url?: string;
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
      console.log('Fetching services for organization:', profile?.organization_id);
      
      if (!profile?.organization_id) {
        throw new Error('No organization ID found');
      }

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
              email,
              avatar_url
            )
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }

      console.log('Services fetched successfully:', data?.length || 0, 'services');

      return data.map(service => ({
        ...service,
        assigned_members: service.service_assignments?.map((assignment: any) => assignment.profiles).filter(Boolean) || []
      }));
    },
    enabled: !!profile?.organization_id,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      console.log('Creating service:', data);
      
      if (!profile?.organization_id || !profile?.id) {
        throw new Error('Missing user profile data');
      }

      const { data: service, error } = await supabase
        .from('services')
        .insert({
          ...data,
          organization_id: profile.organization_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating service:', error);
        throw error;
      }
      
      console.log('Service created successfully:', service);
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Servicio creado',
        description: 'El servicio ha sido creado exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Service creation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el servicio. Inténtalo de nuevo.',
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
      console.log('Updating service:', id, data);
      
      const { data: service, error } = await supabase
        .from('services')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating service:', error);
        throw error;
      }
      
      console.log('Service updated successfully:', service);
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Servicio actualizado',
        description: 'El servicio ha sido actualizado exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Service update failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el servicio. Inténtalo de nuevo.',
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
      console.log('Deleting service:', serviceId);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
      
      console.log('Service deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Servicio eliminado',
        description: 'El servicio ha sido eliminado exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Service deletion failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el servicio. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });
}

export function useServiceAssignments(serviceId: string) {
  return useQuery({
    queryKey: ['service-assignments', serviceId],
    queryFn: async () => {
      console.log('Fetching service assignments for:', serviceId);
      
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

      if (error) {
        console.error('Error fetching service assignments:', error);
        throw error;
      }
      
      console.log('Service assignments fetched:', data?.length || 0);
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
      console.log('Assigning member to service:', { serviceId, memberId });
      
      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      const { error } = await supabase
        .from('service_assignments')
        .insert({
          service_id: serviceId,
          member_id: memberId,
          assigned_by: profile.id,
        });

      if (error) {
        console.error('Error assigning member:', error);
        throw error;
      }
      
      console.log('Member assigned successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
      toast({
        title: 'Miembro asignado',
        description: 'El miembro ha sido asignado al servicio exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Member assignment failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo asignar el miembro al servicio.',
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
      console.log('Unassigning member from service:', { serviceId, memberId });
      
      const { error } = await supabase
        .from('service_assignments')
        .delete()
        .eq('service_id', serviceId)
        .eq('member_id', memberId);

      if (error) {
        console.error('Error unassigning member:', error);
        throw error;
      }
      
      console.log('Member unassigned successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
      toast({
        title: 'Miembro desasignado',
        description: 'El miembro ha sido removido del servicio exitosamente.',
      });
    },
    onError: (error: any) => {
      console.error('Member unassignment failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo remover el miembro del servicio.',
        variant: 'destructive',
      });
    },
  });
}
