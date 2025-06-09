import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Send } from 'lucide-react';
import { useChatMessages, useSendMessage } from '@/hooks/useChat';
import { ChatIdentity, ChatMessage } from '@/types/chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessagesProps {
  chatIdentity?: ChatIdentity;
}

interface MessageFormData {
  message: string;
}

export function ChatMessages({ chatIdentity }: ChatMessagesProps) {
  const { data: messages, isLoading } = useChatMessages(chatIdentity?.id);
  const { user } = useAuth();
  const { mutate: sendMessage } = useSendMessage();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<MessageFormData>();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!chatIdentity) {
    return (
      <Card className="h-full">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Selecciona una conversación
        </div>
      </Card>
    );
  }

  const onSubmit = handleSubmit((data) => {
    if (!chatIdentity?.id || !data.message.trim()) return;

    sendMessage({
      chatIdentityId: chatIdentity.id,
      message: data.message.trim()
    });

    reset();
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">
          {chatIdentity.contact ? (
            `${chatIdentity.contact.first_name} ${chatIdentity.contact.last_name}`
          ) : (
            chatIdentity.platform_user_id
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {chatIdentity.platform}
        </p>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="p-4 space-y-4">
          {messages?.map((message) => (
            <Message
              key={message.id}
              message={message}
              isMine={message.sent_by === user?.id}
            />
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={onSubmit} className="p-4 border-t flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Input
          {...register('message')}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />

        <Button type="submit" size="icon" className="shrink-0">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </Card>
  );
}

interface MessageProps {
  message: ChatMessage;
  isMine: boolean;
}

function Message({ message, isMine }: MessageProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[70%] rounded-lg p-3
          ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'}
        `}
      >
        {message.media_type ? (
          <div className="space-y-2">
            {message.media_type === 'image' ? (
              <img
                src={message.media_url}
                alt=""
                className="rounded-lg max-h-[300px] object-cover"
              />
            ) : message.media_type === 'video' ? (
              <video
                src={message.media_url}
                controls
                className="rounded-lg max-h-[300px] object-cover"
              />
            ) : message.media_type === 'audio' ? (
              <audio
                src={message.media_url}
                controls
                className="w-full"
              />
            ) : (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Descargar archivo
              </a>
            )}

            {message.message && (
              <p>{message.message}</p>
            )}
          </div>
        ) : (
          <p>{message.message}</p>
        )}

        <p className={`
          text-xs mt-1
          ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}
        `}>
          {format(new Date(message.timestamp), 'p', { locale: es })}
        </p>
      </div>
    </div>
  );
}