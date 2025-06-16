import { useState } from 'react';
import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatPlatformStatus } from '@/components/chat/ChatPlatformStatus';
import { LinkContactDialog } from '@/components/chat/LinkContactDialog';
import { ChatConversation } from '@/types/chat';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<ChatConversation>();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat Omnicanal</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona todas tus conversaciones de WhatsApp, Messenger e Instagram en un solo lugar.
            </p>
          </div>
          <ChatPlatformStatus />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-grow overflow-hidden">
        <div className="col-span-4 h-full w-full overflow-hidden">
          <ChatConversationList
            selectedId={selectedChat?.id}
            onSelect={setSelectedChat}
          />
        </div>

        <div className="col-span-8 h-full overflow-hidden">
          <div className="h-full flex flex-col gap-4 overflow-hidden">
            <ChatMessages chatIdentity={selectedChat} />

            {/* Se eliminó el botón duplicado de LinkContactDialog */}
          </div>
        </div>
      </div>
    </div>
  );
}
