export type ChatPlatform = 'whatsapp' | 'messenger' | 'instagram';
export type MessageDirection = 'incoming' | 'outgoing';
export type MediaType = 'image' | 'audio' | 'video' | 'file';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  country_code?: string;
}

export interface ChatIdentity {
  id: string;
  organization_id: string;
  platform: ChatPlatform;
  platform_user_id: string;
  contact_id?: string;
  contact?: Contact;
  bot_enabled: boolean;
  first_seen: string;
  last_seen: string;
}

export interface ChatMessage {
  id: string;
  chat_identity_id: string;
  direction: MessageDirection;
  message?: string;
  media_type?: MediaType;
  media_url?: string;
  media_mime_type?: string;
  timestamp: string;
  sent_by?: string;
  received_via: ChatPlatform;
}

export interface ChatConversation extends ChatIdentity {
  latest_message?: ChatMessage;
  unread_count?: number;
}