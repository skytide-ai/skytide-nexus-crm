import { useState } from 'react';
import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatPlatformStatus } from '@/components/chat/ChatPlatformStatus';
import { LinkContactDialog } from '@/components/chat/LinkContactDialog';
import { ChatConversation } from '@/types/chat';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<ChatConversation>();

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Chat Omnicanal</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona todas tus conversaciones de WhatsApp, Messenger e Instagram en un solo lugar.
        </p>
      </div>
      <div className="mb-4">
        <ChatPlatformStatus />
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100%-5rem)]">
        <div className="col-span-4 h-full">
          <ChatConversationList
            selectedId={selectedChat?.id}
            onSelect={setSelectedChat}
          />
        </div>

        <div className="col-span-8 h-full">
          <div className="h-full flex flex-col gap-4">
            <ChatMessages chatIdentity={selectedChat} />

            {selectedChat && !selectedChat.contact_id && (
              <div className="flex justify-end">
                <LinkContactDialog
                  chatIdentityId={selectedChat.id}
                  platformUserId={selectedChat.platform_user_id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
