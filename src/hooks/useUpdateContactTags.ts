import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useUpdateContactTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, tagIds }: { contactId: string; tagIds: string[] }) => {
      // Primero eliminamos todos los tags existentes
      const { error: deleteError } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId);

      if (deleteError) throw deleteError;

      // Si hay nuevos tags, los insertamos
      if (tagIds.length > 0) {
        const { error: insertError } = await supabase
          .from('contact_tags')
          .insert(
            tagIds.map(tagId => ({
              contact_id: contactId,
              tag_id: tagId
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] });
      toast.success('Tags actualizados correctamente');
    },
    onError: (error) => {
      console.error('Error updating contact tags:', error);
      toast.error('Error al actualizar los tags');
    }
  });
}
