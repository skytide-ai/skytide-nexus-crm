import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tag } from '@/types/tag';

export function useContactTags(contactId: string) {
  return useQuery({
    queryKey: ['contact-tags', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select(`
          tag_id,
          tags:tags (
            id,
            name,
            color
          )
        `)
        .eq('contact_id', contactId);

      if (error) throw error;

      return data.map(item => item.tags) as Tag[];
    },
    enabled: !!contactId,
  });
}
