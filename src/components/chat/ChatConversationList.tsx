import { useChatConversations } from '@/hooks/useChat';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ChatConversation } from '@/types/chat';
import { WhatsappIcon, MessengerIcon, InstagramIcon } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface ChatConversationListProps {
  selectedId?: string;
  onSelect: (conversation: ChatConversation) => void;
}

const platformIcons = {
  whatsapp: WhatsappIcon,
  messenger: MessengerIcon,
  instagram: InstagramIcon
};

const platformColors = {
  whatsapp: 'bg-green-500',
  messenger: 'bg-blue-500',
  instagram: 'bg-pink-500'
};

const platformLabels = {
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  instagram: 'Instagram'
};

/**
 * Formatea una fecha en un formato relativo en español
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  const diffDays = differenceInDays(now, date);
  
  // Casos para diferentes intervalos de tiempo
  if (diffMinutes < 1) return 'ahora';
  if (diffMinutes === 1) return 'hace 1 minuto';
  if (diffMinutes < 60) return `hace ${diffMinutes} minutos`;
  if (diffHours === 1) return 'hace 1 hora';
  if (diffHours < 24) return `hace ${diffHours} horas`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  
  // Para fechas más antiguas, usar formato de fecha
  return format(date, 'dd/MM/yy');
}

export function ChatConversationList({ selectedId, onSelect }: ChatConversationListProps) {
  const { data: conversations, isLoading } = useChatConversations();
  
  // Forzar actualización de la fecha actual
  const now = new Date();

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <ScrollArea className="flex-1">
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
      <Card className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No hay conversaciones aún
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b font-semibold text-lg bg-card/50 flex items-center justify-between">
        <span>Conversaciones</span>
      </div>
      <ScrollArea className="flex-1 w-full">
        <div className="divide-y w-full overflow-hidden">
          {conversations.map((conversation) => {
            const Icon = platformIcons[conversation.platform];
            const isSelected = selectedId === conversation.id;

            return (
              <button
                key={conversation.id}
                className={`w-full p-4 flex gap-3 items-start hover:bg-accent/50 text-left transition-colors border-l-4 ${isSelected ? 'border-primary bg-accent/30' : 'border-transparent'} overflow-hidden`}
                onClick={() => onSelect(conversation)}
              >
                <div className="relative">
                  <div className={`h-12 w-12 rounded-full ${platformColors[conversation.platform]} text-white flex items-center justify-center shadow-sm`}>
                    <User className="h-6 w-6" />
                  </div>
                  {conversation.unread_count && conversation.unread_count > 0 ? (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center shadow-sm">
                      {conversation.unread_count}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start w-full">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {conversation.contact ? (
                          `${conversation.contact.first_name} ${conversation.contact.last_name}`
                        ) : (
                          conversation.platform_user_id
                        )}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap text-[10px] text-muted-foreground">
                        <Badge variant="outline" className={`py-0.5 px-2 ${platformColors[conversation.platform]} text-white flex-shrink-0`}>
                          {platformLabels[conversation.platform]}
                        </Badge>
                        <span className="truncate max-w-[120px]">
                          {conversation.contact_id ? `ID: ${conversation.contact_id.substring(0, 6)}...` : `ID: ${conversation.platform_user_id.substring(0, 6)}...`}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap ml-2">
                      {conversation.latest_message
                        ? formatTimeAgo(new Date(conversation.latest_message.timestamp))
                        : formatTimeAgo(new Date(conversation.last_seen))}
                    </p>
                  </div>

                  {conversation.latest_message && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
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