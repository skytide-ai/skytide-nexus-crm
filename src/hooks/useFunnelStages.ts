import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  FunnelStage, 
  CreateFunnelStageForm,
  UpdateFunnelStagePosition 
} from '@/types/funnel';

export function useFunnelStages(funnelId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stages = useQuery<FunnelStage[]>({
    queryKey: ['funnel-stages', funnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('position');

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las etapas',
          variant: 'destructive',
        });
        throw error;
      }

      return data;
    },
    enabled: !!funnelId,
  });

  const createStage = useMutation({
    mutationFn: async ({ name, color }: CreateFunnelStageForm) => {
      if (!funnelId) throw new Error('No funnel ID provided');

      // Obtener la última posición
      const { data: lastStage } = await supabase
        .from('funnel_stages')
        .select('position')
        .eq('funnel_id', funnelId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = lastStage ? lastStage.position + 1 : 0;

      const { data, error } = await supabase
        .from('funnel_stages')
        .insert({
          funnel_id: funnelId,
          name,
          color,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo crear la etapa',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Etapa creada correctamente',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-stages', funnelId] });
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...form }: CreateFunnelStageForm & { id: string }) => {
      const { data, error } = await supabase
        .from('funnel_stages')
        .update(form)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la etapa',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Etapa actualizada correctamente',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-stages', funnelId] });
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funnel_stages')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la etapa',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Etapa eliminada correctamente',
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-stages', funnelId] });
    },
  });

  const updateStagePositions = useMutation({
    mutationFn: async (updates: UpdateFunnelStagePosition[]) => {
      const { error } = await supabase
        .from('funnel_stages')
        .upsert(
          updates.map(({ id, position }) => ({
            id,
            position,
          }))
        );

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron actualizar las posiciones',
          variant: 'destructive',
        });
        throw error;
      }

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-stages', funnelId] });
    },
  });

  return {
    stages: stages.data ?? [],
    isLoading: stages.isLoading,
    createStage,
    updateStage,
    deleteStage,
    updateStagePositions,
  };
}
