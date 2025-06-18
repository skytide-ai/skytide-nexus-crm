import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, Link, User, MessageSquare, Bot, ChevronDown, X } from 'lucide-react';
import { useChatMessages, useSendMessage, useUpdateChatIdentity, useUploadChatFile } from '@/hooks/useChat';
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
  const { user, organization } = useAuth();
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: updateChatIdentity } = useUpdateChatIdentity();
  const { mutate: uploadChatFile, isPending: isUploading } = useUploadChatFile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset, watch } = useForm<MessageFormData>();
  
  // Estado local para el switch del bot para respuesta inmediata
  const [botEnabled, setBotEnabled] = useState(chatIdentity?.bot_enabled || false);
  
  // Estado para el modal de advertencia del bot
  const [showBotWarning, setShowBotWarning] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  
  // Estado para archivos cargados (pero no enviados aún)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    name: string;
    mediaUrl: string;
    mediaType: 'image' | 'audio' | 'video' | 'file';
    mediaMimeType: string;
    size: number;
  }>>([]);
  
  // Observar el valor del mensaje para validar si hay contenido
  const messageValue = watch('message');
  
  // Actualizar el estado local cuando cambia chatIdentity
  useEffect(() => {
    if (chatIdentity) {
      setBotEnabled(chatIdentity.bot_enabled || false);
    }
  }, [chatIdentity?.bot_enabled]);

  // Limpiar archivos cargados cuando cambia la conversación
  useEffect(() => {
    setUploadedFiles([]);
    reset();
  }, [chatIdentity?.id, reset]);

  // Función para hacer scroll al final
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      // El ScrollArea de shadcn/ui tiene un viewport interno
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        console.log('📜 Haciendo scroll al final - viewport encontrado');
        // Usar setTimeout para asegurar que el DOM se haya actualizado
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
          console.log('📜 Scroll ejecutado:', viewport.scrollTop, '/', viewport.scrollHeight);
        }, 150);
      } else {
        console.log('📜 Haciendo scroll al final - usando fallback');
        // Fallback al método anterior si no encuentra el viewport
        setTimeout(() => {
          scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
          console.log('📜 Scroll fallback ejecutado');
        }, 150);
      }
    } else {
      console.log('📜 No se puede hacer scroll - ref no disponible');
    }
  };

  // Scroll al final cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll al final cuando se cambia de conversación (después de cargar mensajes)
  useEffect(() => {
    if (chatIdentity?.id && messages) {
      scrollToBottom();
    }
  }, [chatIdentity?.id, messages]);

  // Scroll al final cuando terminan de cargar los mensajes
  useEffect(() => {
    if (!isLoading && messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [isLoading, messages]);

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
    if (!chatIdentity?.id) return;
    
    // Si hay archivos cargados, enviar con archivos
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        sendMessage({
          chatIdentityId: chatIdentity.id,
          message: message.trim() || `📎 ${file.name}`,
          mediaUrl: file.mediaUrl,
          mediaType: file.mediaType,
          mediaMimeType: file.mediaMimeType
        });
      });
      // Limpiar archivos después del envío
      setUploadedFiles([]);
    } else {
      // Enviar solo texto con media_type: "text"
      sendMessage({
        chatIdentityId: chatIdentity.id,
        message: message.trim(),
        mediaType: 'text' as any // Agregamos 'text' como tipo
      });
    }
    
    reset();
    
    // Hacer scroll al final después de enviar
    setTimeout(() => {
      scrollToBottom();
    }, 200);
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
    // Verificar que hay contenido para enviar (mensaje o archivos)
    if (!data.message.trim() && uploadedFiles.length === 0) return;
    
    // Si el bot está activado, mostrar advertencia
    if (botEnabled) {
      setPendingMessage(data.message.trim());
      setShowBotWarning(true);
      return;
    }
    
    // Si el bot está desactivado, enviar directamente
    sendMessageDirectly(data.message.trim());
  });

  // Función para manejar la selección de archivos (solo cargar, no enviar)
  const handleFileSelect = (files: FileList | null) => {
    if (!files || !chatIdentity?.id || !organization?.id) return;
    
    Array.from(files).forEach(file => {
      uploadFileOnly(file);
    });
  };

  // Función para subir archivo sin enviarlo
  const uploadFileOnly = async (file: File) => {
    if (!chatIdentity?.id || !organization?.id) return;

    try {
      // Subir el archivo
      const result = await new Promise<{
        mediaUrl: string;
        mediaType: 'image' | 'audio' | 'video' | 'file';
        mediaMimeType: string;
        fileName: string;
      }>((resolve, reject) => {
        uploadChatFile(
          {
            chatIdentityId: chatIdentity.id,
            file,
            organizationId: organization.id
          },
          {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error)
          }
        );
      });

      // Agregar el archivo a la lista de archivos cargados
      const newFile = {
        id: Date.now().toString(),
        name: result.fileName,
        mediaUrl: result.mediaUrl,
        mediaType: result.mediaType,
        mediaMimeType: result.mediaMimeType,
        size: file.size
      };

      setUploadedFiles(prev => [...prev, newFile]);

    } catch (error) {
      console.error('Error al subir archivo:', error);
    }
  };

  // Función para remover un archivo cargado
  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

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
    <Card className="flex flex-col h-full border-border/40 overflow-hidden">
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar
            className={`h-10 w-10 border-2 flex items-center justify-center rounded-full ${
              showInitials 
                ? `${getPlatformBorderColor(chatIdentity.platform)} text-white`
                : `bg-gray-100 ${getPlatformBorderColor(chatIdentity.platform)}`
            }`}
          >
            {showInitials ? (
              <AvatarFallback
                className={`flex items-center justify-center w-full h-full rounded-full ${getPlatformColor(chatIdentity.platform)}`}
              >
                {initials}
              </AvatarFallback>
            ) : (
              <User className="h-6 w-6 text-gray-600" />
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
                        setBotEnabled(checked);
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

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
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

      {/* Archivos cargados */}
      {uploadedFiles.length > 0 && (
        <div className="p-4 space-y-3 border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <Paperclip className="h-4 w-4" />
            Archivos listos para enviar ({uploadedFiles.length})
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-200/60 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex-shrink-0">
                  {file.mediaType === 'image' ? (
                    <div className="relative">
                      <img 
                        src={file.mediaUrl} 
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-sm"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Paperclip className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="capitalize">{file.mediaType}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadedFile(file.id)}
                  className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de envío mejorado */}
      <div className="p-4 bg-gradient-to-r from-gray-50/50 to-white">
        <form onSubmit={onSubmit}>
          {/* Línea principal con todos los controles */}
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all duration-200">
            {/* Botón de adjuntar archivo */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white">
                  <p>{isUploading ? 'Subiendo archivo...' : 'Adjuntar archivo'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Área de texto expandible */}
            <div className="flex-1 relative">
              <textarea
                {...register('message')}
                placeholder={uploadedFiles.length > 0 ? "Añade un mensaje (opcional)..." : "Escribe tu mensaje..."}
                className="w-full min-h-[40px] max-h-32 px-3 py-2 text-sm bg-transparent border-0 resize-none focus:outline-none placeholder:text-gray-400"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              
              {/* Contador de caracteres */}
              {messageValue && messageValue.length > 0 && (
                <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                  {messageValue.length}
                </div>
              )}
            </div>

            {/* Botón de enviar */}
            <Button 
              type="submit" 
              size="sm"
              className="h-10 px-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              disabled={!messageValue?.trim() && uploadedFiles.length === 0}
            >
              <Send className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">Enviar</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Input de archivos oculto */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        multiple
      />
      
      {/* Modal de advertencia de bot activo */}
      <BotWarningDialog 
        isOpen={showBotWarning}
        onClose={() => {
          setShowBotWarning(false);
          setPendingMessage("");
        }}
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