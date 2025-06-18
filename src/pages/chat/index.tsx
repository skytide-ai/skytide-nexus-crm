import { useState } from 'react';
import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatPlatformStatus } from '@/components/chat/ChatPlatformStatus';
import { ChatConversation } from '@/types/chat';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-shrink-0">
        <ChatPlatformStatus />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="md:col-span-1 lg:col-span-1 h-full">
          <ChatConversationList
            selectedId={selectedChat?.id}
            onSelect={setSelectedChat}
          />
        </div>

        <div className="hidden md:block md:col-span-2 lg:col-span-3 h-full">
          {selectedChat ? (
            <ChatMessages key={selectedChat.id} chatIdentity={selectedChat} />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-lg font-semibold">Selecciona un chat</p>
                <p className="text-muted-foreground">Elige una conversación de la lista para ver los mensajes.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TODO: En móvil, se podría mostrar una vista diferente
// La lista de chats y, al seleccionar uno, se navega a la vista de mensajes.
