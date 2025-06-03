import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Definición de Contact en lugar de importarla
export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// Tipos
export interface WhatsAppConfig {
  id: string;
  organization_id: string;
  webhook_url: string;
  bot_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppPhoneConfig {
  id: string;
  organization_id: string;
  phone_number: string;
  contact_id: string | null;
  bot_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  organization_id: string;
  phone_number: string;
  message: string;
  timestamp: string;
  is_from_admin: boolean;
  is_from_bot: boolean;
  media_url?: string;
  media_type?: string;
  contact_id?: string | null;
}

export interface WhatsAppChat {
  phone_number: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  contact_id?: string | null;
  contact_name?: string | null;
}

export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessageParams {
  phoneNumber: string;
  message: string;
  isFromBot?: boolean;
  mediaUrl?: string;
  mediaType?: string;
}

// Hook para obtener la configuración de WhatsApp
export function useWhatsAppConfig() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-config', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('organization_id', organization?.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as WhatsAppConfig;
    },
    enabled: !!organization?.id,
  });
}

// Hook para actualizar la configuración de WhatsApp
export function useUpdateWhatsAppConfig() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<WhatsAppConfig>) => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .update(config)
        .eq('organization_id', organization?.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast({
        title: 'Configuración actualizada',
        description: 'La configuración de WhatsApp se ha actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar la configuración: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Hook para obtener la configuración de un número de teléfono específico
export function useWhatsAppPhoneConfig(phoneNumber: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-phone-config', organization?.id, phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) return null;

      const { data, error } = await supabase
        .from('whatsapp_phone_config')
        .select('*')
        .eq('organization_id', organization?.id)
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 es el código de error cuando no se encuentra un registro
        throw new Error(error.message);
      }

      return data as WhatsAppPhoneConfig | null;
    },
    enabled: !!organization?.id && !!phoneNumber,
  });
}

// Hook para actualizar la configuración de un número de teléfono
export function useUpdateWhatsAppPhoneConfig() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      phoneNumber,
      config,
    }: {
      phoneNumber: string;
      config: Partial<WhatsAppPhoneConfig>;
    }) => {
      // Primero verificamos si ya existe una configuración para este número
      const { data: existingConfig, error: checkError } = await supabase
        .from('whatsapp_phone_config')
        .select('id')
        .eq('organization_id', organization?.id)
        .eq('phone_number', phoneNumber)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(checkError.message);
      }

      let result;

      if (existingConfig) {
        // Actualizar configuración existente
        const { data, error } = await supabase
          .from('whatsapp_phone_config')
          .update(config)
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        result = data;
      } else {
        // Crear nueva configuración
        const { data, error } = await supabase
          .from('whatsapp_phone_config')
          .insert({
            organization_id: organization?.id,
            phone_number: phoneNumber,
            ...config,
          })
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        result = data;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-phone-config', organization?.id, variables.phoneNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-chats'],
      });
      toast({
        title: 'Configuración actualizada',
        description: 'La configuración del número se ha actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al actualizar la configuración: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Hook para vincular o desvincular un contacto a un número de teléfono
export function useLinkContactToPhone() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      phoneNumber,
      contactId,
    }: {
      phoneNumber: string;
      contactId: string | null;
    }) => {
      // Primero verificamos si ya existe una configuración para este número
      const { data: existingConfig, error: checkError } = await supabase
        .from('whatsapp_phone_config')
        .select('id, bot_enabled')
        .eq('organization_id', organization?.id)
        .eq('phone_number', phoneNumber)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(checkError.message);
      }

      let result;

      if (existingConfig) {
        // Actualizar configuración existente
        const { data, error } = await supabase
          .from('whatsapp_phone_config')
          .update({ contact_id: contactId })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        result = data;
      } else {
        // Obtener la configuración global para usar como default para bot_enabled
        const { data: globalConfig, error: globalConfigError } = await supabase
          .from('whatsapp_config')
          .select('bot_enabled')
          .eq('organization_id', organization?.id)
          .single();

        if (globalConfigError) {
          throw new Error(globalConfigError.message);
        }

        // Crear nueva configuración
        const { data, error } = await supabase
          .from('whatsapp_phone_config')
          .insert({
            organization_id: organization?.id,
            phone_number: phoneNumber,
            contact_id: contactId,
            bot_enabled: globalConfig.bot_enabled,
          })
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        result = data;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-phone-config', organization?.id, variables.phoneNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-chats'],
      });
      toast({
        title: variables.contactId ? 'Contacto vinculado' : 'Contacto desvinculado',
        description: variables.contactId
          ? 'El contacto ha sido vinculado al número de teléfono'
          : 'El contacto ha sido desvinculado del número de teléfono',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Error al vincular el contacto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Hook para obtener los mensajes de un chat de WhatsApp
export function useWhatsAppMessages(phoneNumber?: string) {
  const { organization } = useAuth();
  const [debugInfo, setDebugInfo] = useState<{
    organizationId: string | null;
    phoneNumber: string | null;
    timestamp: string;
    error: string | null;
  }>({
    organizationId: null,
    phoneNumber: null,
    timestamp: new Date().toISOString(),
    error: null,
  });

  // Actualizar información de depuración cuando cambian los parámetros
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      organizationId: organization?.id || null,
      phoneNumber: phoneNumber || null,
      timestamp: new Date().toISOString(),
    }));
    
    console.log('useWhatsAppMessages - Debug Info:', {
      organizationId: organization?.id,
      phoneNumber,
      timestamp: new Date().toISOString(),
    });
  }, [organization?.id, phoneNumber]);

  return useQuery({
    queryKey: ['whatsapp-messages', organization?.id, phoneNumber],
    queryFn: async () => {
      try {
        if (!organization?.id) {
          const error = 'No organization ID';
          console.error(`useWhatsAppMessages - ${error}`);
          setDebugInfo(prev => ({ ...prev, error }));
          throw new Error(error);
        }

        if (!phoneNumber) {
          const error = 'No phone number';
          console.error(`useWhatsAppMessages - ${error}`);
          setDebugInfo(prev => ({ ...prev, error }));
          throw new Error(error);
        }

        console.log(`useWhatsAppMessages - Fetching messages for org: ${organization.id}, phone: ${phoneNumber}`);
        
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('phone_number', phoneNumber)
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) {
          console.error('useWhatsAppMessages - Supabase Error:', error);
          setDebugInfo(prev => ({ ...prev, error: error.message }));
          throw new Error(error.message);
        }

        const messagesCount = data?.length || 0;
        console.log(`useWhatsAppMessages - Success! ${messagesCount} messages obtained`);
        
        if (messagesCount > 0) {
          console.log('useWhatsAppMessages - First message sample:', {
            id: data[0].id,
            timestamp: data[0].timestamp,
            from_admin: data[0].is_from_admin,
          });
        }
        
        setDebugInfo(prev => ({ ...prev, error: null }));
        return data as WhatsAppMessage[];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('useWhatsAppMessages - Unexpected error:', error);
        setDebugInfo(prev => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    enabled: !!organization?.id && !!phoneNumber,
    retry: 1, // Limitar reintentos para evitar bucles infinitos
    retryDelay: 1000, // Esperar 1 segundo entre reintentos
  });
}

// Hook para obtener los chats de WhatsApp
export function useWhatsAppChats() {
  const { organization } = useAuth();

  console.log('useWhatsAppChats - organization:', organization);

  return useQuery({
    queryKey: ['whatsapp-chats', organization?.id],
    queryFn: async () => {
      console.log('useWhatsAppChats - queryFn - organization_id:', organization?.id);
      
      // Consulta para obtener los chats con la última información de mensaje
      const { data, error } = await supabase.rpc('get_whatsapp_chats', {
        org_id: organization?.id,
      });

      if (error) {
        console.error('useWhatsAppChats - Error:', error);
        throw new Error(error.message);
      }

      console.log('useWhatsAppChats - Chats obtenidos:', data);
      return data as WhatsAppChat[];
    },
    enabled: !!organization?.id,
  });
}

// Hook para enviar un mensaje de WhatsApp
export function useSendWhatsAppMessage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      phoneNumber,
      message,
      isFromBot = false,
      mediaUrl,
      mediaType,
    }: SendMessageParams) => {
      // Obtenemos el ID de la organización del usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const organizationId = session?.user?.user_metadata?.organization_id;

      if (!organizationId) {
        throw new Error("No se pudo obtener el ID de la organización");
      }

      // Llamamos a la función Edge para enviar el mensaje a n8n
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          organization_id: organizationId,
          phone_number: phoneNumber,
          message,
          is_from_bot: isFromBot,
          media_url: mediaUrl,
          media_type: mediaType,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onError: (error) => {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "El mensaje ha sido enviado correctamente",
      });
      // Ya no necesitamos invalidar la caché aquí, ya que n8n
      // insertará el mensaje en la base de datos y la suscripción
      // en tiempo real actualizará la UI automáticamente
      toast({
        title: "Mensaje enviado",
        description: "El mensaje se ha enviado correctamente",
      });
    },
  });
}

// Hook para suscribirse a actualizaciones en tiempo real
export function useWhatsAppRealtime(phoneNumber?: string) {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;

    // Suscripción a mensajes nuevos
    const messagesChannel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage;

          // Si estamos viendo los mensajes de este número, actualizamos la caché
          if (phoneNumber && newMessage.phone_number === phoneNumber) {
            queryClient.setQueryData(
              ['whatsapp-messages', organization.id, phoneNumber],
              (old: WhatsAppMessage[] | undefined) => {
                if (!old) return [newMessage];
                return [newMessage, ...old];
              }
            );
          }

          // Actualizamos la lista de chats
          queryClient.invalidateQueries({
            queryKey: ['whatsapp-chats', organization.id],
          });
        }
      )
      .subscribe();

    setIsSubscribed(true);

    return () => {
      supabase.removeChannel(messagesChannel);
      setIsSubscribed(false);
    };
  }, [organization?.id, phoneNumber, queryClient]);

  return { isSubscribed };
}

// Hook para obtener contactos
export function useContacts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      try {
        // Usamos una consulta SQL directa para evitar problemas de tipo
        const { data, error } = await supabase.rpc('get_organization_contacts', {
          org_id: organization?.id
        });

        if (error) {
          throw new Error(error.message);
        }

        // Adaptamos los datos al formato esperado por la interfaz Contact
        return (data || []).map((contact: any) => ({
          id: contact.id,
          organization_id: organization?.id || '',
          name: contact.contact_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          created_at: contact.created_at || '',
          updated_at: contact.updated_at || ''
        })) as Contact[];
      } catch (e) {
        console.error('Error al obtener contactos:', e);
        return [] as Contact[];
      }
    },
    enabled: !!organization?.id,
  });
}
