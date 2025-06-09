import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatIdentity, ChatMessage, ChatConversation } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export function useChatConversations() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['chat-conversations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: identities, error } = await supabase
        .from('chat_identities')
        .select(`
          *,
          contact:contacts (id, first_name, last_name, email, phone, country_code),
          latest_message:chat_messages (id, message, media_type, timestamp)
        `)
        .eq('organization_id', organization.id)
        .order('last_seen', { ascending: false })
        .limit(1, { foreignTable: 'latest_message' });

      if (error) throw error;
      return identities as ChatConversation[];
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
      mediaType?: 'image' | 'audio' | 'video' | 'file';
      mediaMimeType?: string;
    }) => {
      const { data: identity, error: identityError } = await supabase
        .from('chat_identities')
        .select('platform, platform_user_id, organization_id')
        .eq('id', chatIdentityId)
        .single();

      if (identityError) throw identityError;

      // First insert the message in our database
      const { data: chatMessage, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          chat_identity_id: chatIdentityId,
          direction: 'outgoing',
          message,
          media_type: mediaType,
          media_url: mediaUrl,
          media_mime_type: mediaMimeType,
          sent_by: (await supabase.auth.getUser()).data.user?.id,
          received_via: identity.platform
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Then send to external webhook
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
        return chatMessage;
      }

      // Send to webhook
      const response = await fetch(webhook.message_outgoing_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_identity_id: chatIdentityId,
          message,
          media_url: mediaUrl,
          media_type: mediaType,
          platform: identity.platform,
          platform_user_id: identity.platform_user_id,
          organization_id: identity.organization_id,
          sent_by: (await supabase.auth.getUser()).data.user?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }

      return chatMessage;
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