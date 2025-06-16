import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, Link, User, MessageSquare, Bot, ChevronDown } from 'lucide-react';
import { useChatMessages, useSendMessage, useUpdateChatIdentity } from '@/hooks/useChat';
import { ChatIdentity, ChatMessage, ChatPlatform } from '@/types/chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LinkContactDialog } from './LinkContactDialog';
import { BotWarningDialog } from './BotWarningDialog';

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
  const { mutate: updateChatIdentity } = useUpdateChatIdentity();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<MessageFormData>();
  
  // Estado local para el switch del bot para respuesta inmediata
  const [botEnabled, setBotEnabled] = useState(chatIdentity?.bot_enabled || false);
  
  // Estado para el modal de advertencia del bot
  const [showBotWarning, setShowBotWarning] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  
  // Actualizar el estado local cuando cambia chatIdentity
  useEffect(() => {
    if (chatIdentity) {
      setBotEnabled(chatIdentity.bot_enabled || false);
    }
  }, [chatIdentity?.bot_enabled]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Actualiza last_seen cuando se abre la conversación o llegan nuevos mensajes
  useEffect(() => {
    if (!chatIdentity) return;

    // Timestamp del último mensaje o fecha actual si no hay mensajes
    const lastTimestamp = messages && messages.length > 0
      ? messages[messages.length - 1].timestamp
      : new Date().toISOString();

    // Solo actualizamos si el timestamp es más reciente que el last_seen almacenado
    if (new Date(lastTimestamp) > new Date(chatIdentity.last_seen)) {
      updateChatIdentity({
        chatIdentityId: chatIdentity.id,
        data: { last_seen: lastTimestamp }
      });
    }
  }, [chatIdentity, messages, updateChatIdentity]);

  if (!chatIdentity) {
    return (
      <Card className="flex flex-col h-full border-border/40">
        <div className="p-4 border-b bg-muted/30 flex-shrink-0">
          <h3 className="font-semibold text-lg">Chat</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 space-y-4">
          <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
          <div className="text-center">
            <h3 className="text-lg font-medium mb-1">Selecciona una conversación</h3>
            <p className="text-sm text-muted-foreground">Elige un chat de la lista para comenzar</p>
          </div>
        </div>
      </Card>
    );
  }

  // Función para enviar mensaje directamente
  const sendMessageDirectly = (message: string) => {
    if (!chatIdentity?.id || !message.trim()) return;
    
    sendMessage({
      chatIdentityId: chatIdentity.id,
      message: message.trim()
    });
    
    reset();
  };
  
  // Función para desactivar el bot y enviar mensaje
  const disableBotAndSend = () => {
    if (!chatIdentity?.id || !pendingMessage) return;
    
    // Desactivar el bot
    setBotEnabled(false);
    updateChatIdentity({
      chatIdentityId: chatIdentity.id,
      data: { bot_enabled: false }
    });
    
    // Enviar el mensaje
    sendMessageDirectly(pendingMessage);
    
    // Cerrar el modal
    setShowBotWarning(false);
    setPendingMessage("");
  };
  
  // Función que se ejecuta al enviar el formulario
  const onSubmit = handleSubmit((data) => {
    // Si el bot está activado, mostrar advertencia
    if (botEnabled) {
      setPendingMessage(data.message.trim());
      setShowBotWarning(true);
      return;
    }
    
    // Si el bot está desactivado, enviar directamente
    sendMessageDirectly(data.message.trim());
  });

  // Función para obtener el color de la plataforma
  const getPlatformColor = (platform: ChatPlatform) => {
    switch (platform) {
      case 'whatsapp': return 'bg-green-500';
      case 'messenger': return 'bg-blue-500';
      case 'instagram': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  // Función para obtener el nombre de la plataforma
  const getPlatformName = (platform: ChatPlatform) => {
    switch (platform) {
      case 'whatsapp': return 'WhatsApp';
      case 'messenger': return 'Messenger';
      case 'instagram': return 'Instagram';
      default: return platform;
    }
  };

  // Función para obtener el color de borde de la plataforma
  const getPlatformBorderColor = (platform: ChatPlatform) => {
    switch (platform) {
      case 'whatsapp': return 'border-green-500';
      case 'messenger': return 'border-blue-500';
      case 'instagram': return 'border-pink-500';
      default: return 'border-gray-500';
    }
  };

  // Determinar si mostrar iniciales o icono de usuario
  const showInitials = chatIdentity?.contact;
  const initials = showInitials 
    ? `${chatIdentity.contact.first_name.charAt(0)}${chatIdentity.contact.last_name.charAt(0)}` 
    : '';

  return (
    <Card className="flex flex-col h-full border-border/40">
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar
            className={`h-10 w-10 border-2 flex items-center justify-center rounded-full ${
              showInitials 
                ? `${getPlatformBorderColor(chatIdentity.platform)} text-white` // For Initials: Platform Border, White Text
                : `bg-gray-100 ${getPlatformBorderColor(chatIdentity.platform)}` // For Icon: Light Gray BG, Platform Border
            }`}
          >
            {showInitials ? (
              <AvatarFallback
                className={`flex items-center justify-center w-full h-full rounded-full ${getPlatformColor(chatIdentity.platform)}`} // Platform BG for Initials
              >
                {initials}
              </AvatarFallback>
            ) : (
              <User className="h-6 w-6 text-gray-600" /> // Dark Gray Icon
            )}
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {chatIdentity.contact ? (
                  `${chatIdentity.contact.first_name} ${chatIdentity.contact.last_name}`
                ) : (
                  chatIdentity.platform_user_id
                )}
              </h3>
              <Badge variant="outline" className={`text-xs py-0.5 px-3 ${getPlatformColor(chatIdentity.platform)} text-white`}>
                {getPlatformName(chatIdentity.platform)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              ID: {chatIdentity.platform_user_id.substring(0, 10)}...
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!chatIdentity.contact_id && (
            <LinkContactDialog 
              chatIdentityId={chatIdentity.id}
              platformUserId={chatIdentity.platform_user_id}
              onLinked={() => {
                // Forzar recarga de datos después de vincular
                window.location.reload();
              }}
            />
          )}
          
          <div className="flex items-center gap-2 border-l pl-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={botEnabled}
                      onCheckedChange={(checked) => {
                        // Actualizar estado local inmediatamente para UI responsiva
                        setBotEnabled(checked);
                        
                        // Luego actualizar en la base de datos
                        updateChatIdentity({
                          chatIdentityId: chatIdentity.id,
                          data: { bot_enabled: checked }
                        });
                      }}
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Bot className="h-4 w-4" />
                      Bot
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Activar/desactivar respuestas automáticas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-auto" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isMine={message.direction === 'outgoing'}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-1">Comienza la conversación</h4>
              <p className="text-sm text-muted-foreground max-w-xs">
                Envía un mensaje para iniciar la conversación con {chatIdentity.contact ? 
                  `${chatIdentity.contact.first_name}` : 'este contacto'}.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/30 flex-shrink-0">
        <form onSubmit={onSubmit} className="flex items-center gap-2 bg-background rounded-lg p-1 pl-3 border shadow-sm">
          <Input
            {...register('message')}
            placeholder="Escribe un mensaje..."
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  disabled
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Adjuntar archivo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            type="submit" 
            size="icon" 
            className="shrink-0 rounded-full h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {/* Modal de advertencia de bot activo */}
      <BotWarningDialog 
        isOpen={showBotWarning}
        onClose={() => setShowBotWarning(false)}
        onDisableAndSend={disableBotAndSend}
      />
    </Card>
  );
}

interface MessageProps {
  message: ChatMessage;
  isMine: boolean;
}

function Message({ message, isMine }: MessageProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`
          max-w-[70%] p-3 relative
          ${
            isMine
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-md'
              : 'bg-background rounded-2xl rounded-bl-sm border shadow-sm'
          }
        `}
      >
        {message.media_type ? (
          <div className="space-y-3">
            {message.media_type === 'image' ? (
              <div className="rounded-lg overflow-hidden border border-border/30">
                <img
                  src={message.media_url}
                  alt=""
                  className="max-h-[300px] w-full object-cover"
                />
              </div>
            ) : message.media_type === 'video' ? (
              <div className="rounded-lg overflow-hidden border border-border/30">
                <video
                  src={message.media_url}
                  controls
                  className="max-h-[300px] w-full object-cover"
                />
              </div>
            ) : message.media_type === 'audio' ? (
              <div className="rounded-lg overflow-hidden">
                <AudioPlayer src={message.media_url} />
              </div>
            ) : (
              <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm">Archivo adjunto</span>
                </div>
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline text-sm"
                >
                  Descargar
                </a>
              </div>
            )}

            {message.message && (
              <p className="text-sm">{message.message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm">{message.message}</p>
        )}

        <div className={`
          flex items-center gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity
        `}>
          <p className={`
            text-xs
            ${isMine ? 'text-primary-foreground/80' : 'text-muted-foreground'}
          `}>
            {format(new Date(message.timestamp), 'p', { locale: es })}
          </p>
          
          {isMine && (
            <span className="text-xs text-primary-foreground/80">
              • Enviado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom audio player UI

interface AudioPlayerProps {
  src?: string | null;
}

function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <div className="flex items-center space-x-3 w-full bg-background/50 p-2 rounded-md">
      <button
        type="button"
        onClick={togglePlay}
        className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 focus:outline-none shadow-sm"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={progress}
        onChange={handleSeek}
        className="flex-1 h-1 rounded-lg cursor-pointer accent-primary"
      />
      <audio
        ref={audioRef}
        src={src ?? undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}