import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Funnel, 
  CreateFunnelForm, 
  FunnelStage, 
  CreateFunnelStageForm,
  UpdateFunnelStagePosition 
} from '@/types/funnel';

export function useFunnels() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const funnels = useQuery<Funnel[]>({
    queryKey: ['funnels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*, funnel_stages(*), funnel_contacts(*)')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los embudos',
          variant: 'destructive',
        });
        throw error;
      }

      return data;
    },
    enabled: !!profile,
  });

  const createFunnel = useMutation({
    mutationFn: async (form: CreateFunnelForm) => {
      if (!profile?.organization_id) {
        throw new Error('No organization ID found');
      }

      const { data, error } = await supabase
        .from('funnels')
        .insert({
          ...form,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo crear el embudo',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Embudo creado correctamente',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
  });

  const updateFunnel = useMutation({
    mutationFn: async ({ id, ...form }: CreateFunnelForm & { id: string }) => {
      const { data, error } = await supabase
        .from('funnels')
        .update(form)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el embudo',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Embudo actualizado correctamente',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
  });

  const deleteFunnel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el embudo',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Embudo eliminado correctamente',
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
  });

  return {
    funnels: funnels.data ?? [],
    isLoading: funnels.isLoading,
    createFunnel,
    updateFunnel,
    deleteFunnel,
  };
}
