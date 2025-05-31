
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Contact, ContactNote, ContactFile, Appointment } from '@/types/contact';

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Contact[];
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Contact;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No se pudo obtener la organización del usuario');
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          phone: contactData.phone,
          country_code: contactData.country_code,
          email: contactData.email,
          age: contactData.age,
          gender: contactData.gender,
          birth_date: contactData.birth_date,
          address: contactData.address,
          city: contactData.city,
          document_type: contactData.document_type,
          document_number: contactData.document_number,
          organization_id: profile.organization_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contacto creado',
        description: 'El contacto se ha creado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `No se pudo crear el contacto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...contactData }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contacto actualizado',
        description: 'El contacto se ha actualizado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `No se pudo actualizar el contacto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Contacto eliminado',
        description: 'El contacto se ha eliminado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `No se pudo eliminar el contacto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Contact Notes hooks
export function useContactNotes(contactId: string) {
  return useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as ContactNote[];
    },
    enabled: !!contactId,
  });
}

export function useCreateContactNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteData: { contact_id: string; note: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: noteData.contact_id,
          note: noteData.note,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', variables.contact_id] });
      toast({
        title: 'Nota agregada',
        description: 'La nota se ha agregado exitosamente',
      });
    },
  });
}

// Contact Files hooks
export function useContactFiles(contactId: string) {
  return useQuery({
    queryKey: ['contact-files', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_files')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as ContactFile[];
    },
    enabled: !!contactId,
  });
}

// Appointments hooks
export function useContactAppointments(contactId: string) {
  return useQuery({
    queryKey: ['contact-appointments', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(name),
          profiles!appointments_member_id_fkey(first_name, last_name)
        `)
        .eq('contact_id', contactId)
        .order('appointment_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!contactId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (appointmentData: {
      contact_id: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      service_id?: string;
      member_id?: string;
      notes?: string;
      status: 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
    }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No se pudo obtener la organización del usuario');
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          contact_id: appointmentData.contact_id,
          appointment_date: appointmentData.appointment_date,
          start_time: appointmentData.start_time,
          end_time: appointmentData.end_time,
          service_id: appointmentData.service_id,
          member_id: appointmentData.member_id,
          notes: appointmentData.notes,
          status: appointmentData.status,
          organization_id: profile.organization_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-appointments', variables.contact_id] });
      toast({
        title: 'Cita creada',
        description: 'La cita se ha creado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `No se pudo crear la cita: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
