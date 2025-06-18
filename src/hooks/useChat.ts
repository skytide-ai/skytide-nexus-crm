import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatIdentity, ChatMessage, ChatConversation } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useChatConversations() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['chat-conversations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Primero obtenemos las identidades de chat
      const { data: identities, error: identitiesError } = await supabase
        .from('chat_identities')
        .select(`
          *,
          contact:contacts (id, first_name, last_name, email, phone, country_code)
        `)
        .eq('organization_id', organization.id)
        .order('last_seen', { ascending: false });

      if (identitiesError) {
        console.error('Error fetching chat identities:', identitiesError);
        throw identitiesError;
      }

      if (!identities || identities.length === 0) return [];

      // Luego obtenemos los últimos mensajes para cada identidad
      const result: ChatConversation[] = [];
      
      for (const identity of identities) {
        // Obtenemos el último mensaje para esta identidad
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_identity_id', identity.id)
          .order('timestamp', { ascending: false })
          .limit(1);
          
        if (messagesError) {
          console.error(`Error fetching messages for chat ${identity.id}:`, messagesError);
          // Continuamos con la siguiente identidad
          result.push({
            ...identity,
            latest_message: undefined,
            unread_count: 0
          });
          continue;
        }
        
        // Obtenemos el conteo de mensajes no leídos basados en last_seen
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_identity_id', identity.id)
          .eq('direction', 'incoming')
          .gt('timestamp', identity.last_seen);
        
        // Añadimos esta conversación al resultado
        result.push({
          ...identity,
          latest_message: messages && messages.length > 0 ? messages[0] : undefined,
          unread_count: unreadCount || 0
        });
      }
      
      return result;
    },
    enabled: !!organization?.id
  });
}

export function useChatMessages(chatIdentityId?: string) {
  return useQuery({
    queryKey: ['chat-messages', chatIdentityId],
    queryFn: async () => {
      if (!chatIdentityId) return [];

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_identity_id', chatIdentityId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return messages as ChatMessage[];
    },
    enabled: !!chatIdentityId
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      chatIdentityId, 
      message, 
      mediaUrl, 
      mediaType, 
      mediaMimeType 
    }: {
      chatIdentityId: string;
      message?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'audio' | 'video' | 'file' | 'text';
      mediaMimeType?: string;
    }) => {
      const { data: identity, error: identityError } = await supabase
        .from('chat_identities')
        .select('platform, platform_user_id, organization_id')
        .eq('id', chatIdentityId)
        .single();

      if (identityError) throw identityError;

      // Verificamos si hay un webhook configurado
      const { data: webhook, error: webhookError } = await supabase
        .from('organization_webhooks')
        .select('message_outgoing_webhook_url')
        .eq('organization_id', identity.organization_id)
        .single();

      if (webhookError) {
        toast({
          title: 'Error al enviar mensaje',
          description: 'No se encontró un webhook configurado para este canal',
          variant: 'destructive'
        });
        throw new Error('No se encontró un webhook configurado para este canal');
      }

      // Verificamos que la URL del webhook exista
      if (!webhook.message_outgoing_webhook_url) {
        toast({
          title: 'Error al enviar mensaje',
          description: 'La URL del webhook no está configurada',
          variant: 'destructive'
        });
        throw new Error('La URL del webhook no está configurada');
      }

      // Enviamos al webhook
      try {
        // Preparar el payload - solo incluir media_url y media_type si no es texto
        const payload: any = {
          chat_identity_id: chatIdentityId,
          message,
          media_type: mediaType,
          platform: identity.platform,
          platform_user_id: identity.platform_user_id,
          organization_id: identity.organization_id,
          sent_by: (await supabase.auth.getUser()).data.user?.id
        };

        // Solo agregar media_url si hay un archivo (no para texto)
        if (mediaType !== 'text' && mediaUrl) {
          payload.media_url = mediaUrl;
        }

        const response = await fetch(webhook.message_outgoing_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Error al enviar mensaje: ${response.statusText}`);
        }
        
        // Solo si el webhook fue exitoso, guardamos en la base de datos
        // Para la BD, convertir 'text' a null para media_type
        const dbMediaType = mediaType === 'text' ? null : mediaType;
        
        const { data: chatMessage, error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            chat_identity_id: chatIdentityId,
            direction: 'outgoing',
            message,
            media_type: dbMediaType,
            media_url: mediaType === 'text' ? null : mediaUrl,
            media_mime_type: mediaType === 'text' ? null : mediaMimeType,
            sent_by: (await supabase.auth.getUser()).data.user?.id,
            received_via: identity.platform
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        return chatMessage;
      } catch (error) {
        console.error('Error al enviar mensaje al webhook:', error);
        throw new Error(`Error al enviar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat-messages', variables.chatIdentityId]
      });
      queryClient.invalidateQueries({
        queryKey: ['chat-conversations']
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al enviar mensaje',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateChatIdentity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      chatIdentityId,
      data
    }: {
      chatIdentityId: string;
      data: Partial<ChatIdentity>;
    }) => {
      const { data: updated, error } = await supabase
        .from('chat_identities')
        .update(data)
        .eq('id', chatIdentityId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-conversations']
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar chat',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useUploadChatFile() {
  const { mutate: sendMessage } = useSendMessage();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      chatIdentityId, 
      file, 
      organizationId 
    }: {
      chatIdentityId: string;
      file: File;
      organizationId: string;
    }) => {
      // Validar tamaño y tipo de archivo
      const maxSizeInBytes = 50 * 1024 * 1024; // 50MB (límite configurado en Supabase)
      
      if (file.size > maxSizeInBytes) {
        throw new Error(`El archivo es demasiado grande. El tamaño máximo permitido es 50MB.`);
      }

      // Determinar el tipo de media basado en el MIME type
      let mediaType: 'image' | 'audio' | 'video' | 'file' = 'file';
      
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      }

      // Crear un nombre de archivo único
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}.${fileExt}`;
      
      // Crear la ruta del archivo: organization_id/chat_identity_id/filename
      const filePath = `${organizationId}/${chatIdentityId}/${fileName}`;
      
      console.log('📁 Subiendo archivo de chat:', { 
        fileName: file.name,
        filePath, 
        mediaType, 
        mimeType: file.type,
        size: file.size 
      });

      // Subir el archivo a Supabase Storage en el bucket 'chat-media'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // No sobrescribir archivos existentes
        });

      if (uploadError) {
        console.error('❌ Error al subir archivo de chat:', uploadError);
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('No se pudo obtener información del archivo subido');
      }

      console.log('✅ Archivo de chat subido correctamente:', uploadData.path);

      // Obtener la URL pública del archivo
      const { data } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo');
      }

      console.log('🔗 URL pública obtenida:', data.publicUrl);

      // Retornar información del archivo para enviar el mensaje
      return {
        mediaUrl: data.publicUrl,
        mediaType,
        mediaMimeType: file.type,
        fileName: file.name
      };
    },
    onError: (error) => {
      console.error('❌ Error al subir archivo de chat:', error);
      toast({
        title: 'Error al subir archivo',
        description: error.message || 'No se pudo subir el archivo',
        variant: 'destructive'
      });
    }
  });
}