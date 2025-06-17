import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { FunnelContact, UpdateFunnelContactPosition } from '@/types/funnel';
import { Contact } from '@/types/contact'; // Importar Contact para la aserción

export function useFunnelContacts(funnelId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({ // El tipo FunnelContact[] se inferirá del select o se puede especificar después
    queryKey: ['funnel-contacts', funnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_contacts')
        .select(`
          *,
          contact:contacts(*),
          stage:funnel_stages(*)
        `)
        .eq('funnel_id', funnelId)
        .order('position');

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los contactos',
          variant: 'destructive',
        });
        throw error;
      }

      return data;
    },
    select: (data) => {
      if (!data) return [];
      return data.map(fc => ({
        ...fc,
        contact: fc.contact
          ? {
              ...fc.contact,
              gender: fc.contact.gender as Contact['gender'], // Aserción de tipo aquí
            }
          : undefined, // o null, según la definición de FunnelContact.contact
      })) as FunnelContact[]; // Asegurar que el resultado final sea FunnelContact[]
    },
    enabled: !!funnelId,
  });

  const addContactsToStage = useMutation({
    mutationFn: async ({ contactIds, stageId }: { contactIds: string[]; stageId: string }) => {
      if (!funnelId) throw new Error('No funnel ID provided');

      // Obtener todos los contactos existentes en este embudo para verificar duplicados
      const { data: existingFunnelContacts, error: fetchError } = await supabase
        .from('funnel_contacts')
        .select('contact_id')
        .eq('funnel_id', funnelId);

      if (fetchError) {
        toast({
          title: 'Error',
          description: 'No se pudieron verificar los contactos existentes en el embudo.',
          variant: 'destructive',
        });
        throw fetchError;
      }
      const existingContactIdsInFunnel = new Set(existingFunnelContacts?.map(fc => fc.contact_id) || []);

      // Filtrar los contactIds que ya están en el embudo
      const newContactIdsToAdd = contactIds.filter(cid => !existingContactIdsInFunnel.has(cid));

      if (newContactIdsToAdd.length === 0) {
        toast({
          title: 'Información',
          description: 'Todos los contactos seleccionados ya se encuentran en este embudo.',
        });
        return []; // No hay nuevos contactos que agregar
      }

      // Obtener la última posición en la etapa de destino para el primer contacto nuevo
      const { data: lastContactInStage, error: lastPosError } = await supabase
        .from('funnel_contacts')
        .select('position')
        .eq('stage_id', stageId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPosError) {
         toast({
          title: 'Error',
          description: 'No se pudo determinar la posición para los nuevos contactos.',
          variant: 'destructive',
        });
        throw lastPosError;
      }

      let currentPosition = lastContactInStage ? lastContactInStage.position + 1 : 0;

      const contactsToInsert = newContactIdsToAdd.map((contactId, index) => ({
        funnel_id: funnelId,
        contact_id: contactId,
        stage_id: stageId,
        position: currentPosition + index, // Asignar posiciones secuenciales
      }));

      const { data, error } = await supabase
        .from('funnel_contacts')
        .insert(contactsToInsert)
        .select(`
          *,
          contact:contacts(*),
          stage:funnel_stages(*)
        `);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo agregar el contacto al embudo',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: `${newContactIdsToAdd.length} contacto(s) agregado(s) al embudo correctamente.`,
      });

      return data; // Retorna un array de los contactos insertados
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-contacts', funnelId] });
    },
  });

  const removeContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funnel_contacts')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el contacto del embudo',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Éxito',
        description: 'Contacto eliminado del embudo correctamente',
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-contacts', funnelId] });
    },
  });

  const updateContactPositions = useMutation({
    mutationFn: async (updates: UpdateFunnelContactPosition[]) => {
      const update = updates[0]; // Solo manejamos un contacto a la vez por ahora

      try {
        // 1. Obtener el contacto actual para verificar acceso
        const { data: existingContact, error: fetchError } = await supabase
          .from('funnel_contacts')
          .select('*')
          .eq('id', update.id)
          .single();

        if (fetchError) throw fetchError;

        // 2. Mover temporalmente el contacto a una posición muy alta
        // para liberar su posición actual
        const { error: moveTemp } = await supabase
          .from('funnel_contacts')
          .update({
            position: 99999 // Posición temporal muy alta
          })
          .eq('id', update.id);

        if (moveTemp) throw moveTemp;

        // 3. Actualizar la posición y stage del contacto a su destino final
        const { data, error: moveError } = await supabase
          .from('funnel_contacts')
          .update({
            stage_id: update.stage_id,
            position: update.position,
            // Mantener estos campos para cumplir con RLS
            funnel_id: existingContact.funnel_id,
            contact_id: existingContact.contact_id
          })
          .eq('id', update.id)
          .select(`
            *,
            contact:contacts(*),
            stage:funnel_stages(*)
          `);

        if (moveError) throw moveError;

        toast({
          title: 'Éxito',
          description: 'Contacto movido correctamente',
        });

        return data;

      } catch (error: any) {
        console.error('Error al mover el contacto:', error);
        toast({
          title: 'Error',
          description: error.message || 'No se pudo mover el contacto',
          variant: 'destructive',
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-contacts', funnelId] });
    },
  });

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    addContactsToStage,
    removeContact,
    updateContactPositions,
  };
}
