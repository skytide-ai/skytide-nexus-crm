import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Contact } from '@/types/contact';

export function useContactsByTags(tagIds: string[]) {
  return useQuery({
    queryKey: ['contacts-by-tags', tagIds],
    queryFn: async () => {
      if (tagIds.length === 0) return [];

      // Primero obtenemos los contact_ids que tienen los tags seleccionados
      const { data: contactTags, error: tagsError } = await supabase
        .from('contact_tags')
        .select('contact_id')
        .in('tag_id', tagIds);

      if (tagsError) throw tagsError;

      if (!contactTags?.length) return [];

      // Luego obtenemos los detalles de esos contactos
      const contactIds = [...new Set(contactTags.map(ct => ct.contact_id))];
      
      if (!contactIds.length) return [];

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          organization_id,
          first_name,
          last_name,
          phone,
          country_code,
          email,
          age,
          gender,
          birth_date,
          address,
          city,
          document_type,
          document_number,
          created_at,
          updated_at
        `)
        .in('id', contactIds);

      if (error) throw error;

      return data as Contact[];
    },
    enabled: true,
  });
}
