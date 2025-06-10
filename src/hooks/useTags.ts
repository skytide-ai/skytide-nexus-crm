import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag, CreateTagForm, UpdateTagForm } from '@/types/tag';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useTags() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las etiquetas',
          variant: 'destructive',
        });
        throw error;
      }

      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const createTag = useMutation({
    mutationFn: async (newTag: CreateTagForm) => {
      if (!profile?.organization_id) {
        throw new Error('No organization ID found');
      }

      const { data, error } = await supabase
        .from('tags')
        .insert([
          {
            ...newTag,
            organization_id: profile.organization_id,
          },
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo crear la etiqueta',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Etiqueta creada correctamente',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTagForm & { id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la etiqueta',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Etiqueta actualizada correctamente',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      console.log('Iniciando eliminación de tag:', id);
      
      if (!profile?.organization_id) {
        throw new Error('No organization ID found');
      }

      // Primero eliminamos todas las referencias en contact_tags
      const { error: contactTagsError } = await supabase
        .from('contact_tags')
        .delete()
        .eq('tag_id', id);

      if (contactTagsError) {
        console.error('Error eliminando contact_tags:', contactTagsError);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar las referencias de la etiqueta',
          variant: 'destructive',
        });
        throw contactTagsError;
      }

      console.log('Referencias en contact_tags eliminadas correctamente');

      // Luego eliminamos el tag que pertenezca a la organización
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('organization_id', profile.organization_id);

      if (error) {
        console.error('Error eliminando tag:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la etiqueta',
          variant: 'destructive',
        });
        throw error;
      }

      console.log('Tag eliminado correctamente');

      toast({
        title: 'Éxito',
        description: 'Etiqueta eliminada correctamente',
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  return {
    tags,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
  };
}
