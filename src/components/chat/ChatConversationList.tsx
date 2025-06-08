import { useChatConversations } from '@/hooks/useChat';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatConversation } from '@/types/chat';
import { WhatsappIcon, MessengerIcon, InstagramIcon } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatConversationListProps {
  selectedId?: string;
  onSelect: (conversation: ChatConversation) => void;
}

const platformIcons = {
  whatsapp: WhatsappIcon,
  messenger: MessengerIcon,
  instagram: InstagramIcon
};

export function ChatConversationList({ selectedId, onSelect }: ChatConversationListProps) {
  const { data: conversations, isLoading } = useChatConversations();

  if (isLoading) {
    return (
      <Card className="h-full">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    );
  }

  if (!conversations?.length) {
    return (
      <Card className="h-full">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No hay conversaciones aún
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <ScrollArea className="h-full">
        <div className="divide-y">
          {conversations.map((conversation) => {
            const Icon = platformIcons[conversation.platform];
            const isSelected = selectedId === conversation.id;

            return (
              <button
                key={conversation.id}
                className={`w-full p-4 flex items-start space-x-4 hover:bg-accent text-left ${isSelected ? 'bg-accent' : ''}`}
                onClick={() => onSelect(conversation)}
              >
                <div className="relative">
                  <Icon className="h-12 w-12" />
                  {conversation.unread_count ? (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {conversation.contact ? (
                        `${conversation.contact.first_name} ${conversation.contact.last_name}`
                      ) : (
                        conversation.platform_user_id
                      )}
                    </p>
                    {conversation.latest_message && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.latest_message.timestamp), {
                          addSuffix: true,
                          locale: es
                        })}
                      </p>
                    )}
                  </div>

                  {conversation.latest_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.latest_message.media_type ? (
                        `[${conversation.latest_message.media_type}]`
                      ) : (
                        conversation.latest_message.message
                      )}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}