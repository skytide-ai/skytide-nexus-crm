import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageCircle, Phone, Send, AlertTriangle, Bug, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

import {
  useWhatsAppConfig,
  useUpdateWhatsAppConfig,
  useWhatsAppMessages,
  useWhatsAppChats,
  useSendWhatsAppMessage,
  useWhatsAppRealtime,
  useWhatsAppPhoneConfig,
  useUpdateWhatsAppPhoneConfig,
  useContacts,
  useLinkContactToPhone,
} from "@/hooks/useWhatsApp";
import DebugAuth from "@/components/DebugAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminWhatsApp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { phoneNumber } = useParams<{ phoneNumber: string }>();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Consultas y mutaciones
  const { data: config, isLoading: isLoadingConfig } = useWhatsAppConfig();
  const { mutate: updateConfig } = useUpdateWhatsAppConfig();
  const { data: chats, isLoading: isLoadingChats, error: chatsError } = useWhatsAppChats();
  const { data: messages, isLoading: isLoadingMessages } = useWhatsAppMessages(phoneNumber);
  const { mutate: sendMessage, isPending: isSendingMessage } = useSendWhatsAppMessage();
  const { isSubscribed } = useWhatsAppRealtime(phoneNumber);
  const { data: phoneConfig, isLoading: isLoadingPhoneConfig } = useWhatsAppPhoneConfig(phoneNumber || "");
  const { mutate: updatePhoneConfig } = useUpdateWhatsAppPhoneConfig();
  const { data: contacts, isLoading: isLoadingContacts } = useContacts();
  const { mutate: linkContact } = useLinkContactToPhone();

  // Efecto para cargar la URL del webhook cuando cambia la configuración
  useEffect(() => {
    if (config?.webhook_url) {
      setWebhookUrl(config.webhook_url);
    }
  }, [config]);

  // Manejador para guardar la URL del webhook
  const handleSaveWebhookUrl = () => {
    updateConfig({ webhook_url: webhookUrl });
  };

  // Manejador para enviar un mensaje
  const handleSendMessage = () => {
    if (!phoneNumber || !message.trim()) return;

    sendMessage(
      {
        phoneNumber,
        message: message.trim(),
      },
      {
        onSuccess: () => {
          setMessage("");
        },
      }
    );
  };

  // Ya no se usa un bot global, solo por número de teléfono individual

  // Manejador para cambiar el estado del bot para un número específico
  const handleTogglePhoneBot = (enabled: boolean) => {
    if (!phoneNumber) return;

    updatePhoneConfig({
      phoneNumber,
      config: { bot_enabled: enabled },
    });
  };

  // Manejador para vincular un contacto
  const handleLinkContact = (contactId: string) => {
    if (!phoneNumber) return;

    // Si el valor es "none", lo tratamos como null (sin contacto)
    const finalContactId = contactId === "none" ? null : contactId;

    linkContact({
      phoneNumber,
      contactId: finalContactId,
    });
    
    setSelectedContactId(finalContactId);
  };

  // Obtener el contacto vinculado al número actual
  useEffect(() => {
    if (phoneConfig?.contact_id) {
      setSelectedContactId(phoneConfig.contact_id);
    } else {
      setSelectedContactId(null);
    }
  }, [phoneConfig]);

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Función para obtener las iniciales de un nombre
  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "?"; // Valor seguro por defecto
    
    try {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    } catch (error) {
      console.error('Error en getInitials:', error);
      return "?"; // Valor seguro por defecto
    }
  };

  // Función para obtener el nombre del contacto
  const getContactName = (phoneNum: string) => {
    try {
      // Primero intentar obtener el nombre del chat (que ya viene concatenado de la función SQL)
      const chat = chats?.find((c) => c.phone_number === phoneNum);
      if (chat?.contact_name) return chat.contact_name;
      
      // Buscar en contactos si no hay nombre en el chat
      const contact = contacts?.find((c) => c.id === chat?.contact_id);
      if (contact && contact.name) {
        return contact.name;
      }
      
      return phoneNum;
    } catch (error) {
      console.error('Error en getContactName:', error);
      return phoneNum; // Devolver el número como fallback seguro
    }
  };

  // Obtener la referencia al contexto de autenticación
  const { organization } = useAuth();
  
  // Referencia al contenedor de mensajes para scroll automático
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Efecto para hacer scroll automático cuando cambian los mensajes
  useEffect(() => {
    if (messagesContainerRef.current && messages && messages.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);
  
  // Componente de depuración eliminado

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Administración de WhatsApp</h1>

      <ErrorBoundary>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lista de chats */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Conversaciones</CardTitle>
                <CardDescription>
                  Selecciona una conversación para ver los mensajes
                </CardDescription>
              </CardHeader>
              <CardContent>

                {isLoadingChats ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : chats && chats.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    {chats.map((chat) => {
                      const isActive = chat.phone_number === phoneNumber;
                      const contactName = getContactName(chat.phone_number);
                      const hasContact = !!chat.contact_id;

                      return (
                        <div
                          key={chat.phone_number}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2 ${
                            isActive
                              ? "bg-primary/10"
                              : "hover:bg-muted transition-colors"
                          }`}
                          onClick={() =>
                            navigate(`/admin/whatsapp/${chat.phone_number}`)
                          }
                        >
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(contactName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate flex items-center gap-2">
                                <User className="h-4 w-4" style={{ color: "#cc88ff" }} />
                                {contactName}
                              </p>
                              <small className="text-xs text-muted-foreground">
                                {formatDate(chat.last_message_at)}
                              </small>
                            </div>
                            <div className="flex items-center gap-1">
                              {hasContact && (
                                <Badge variant="outline" className="text-xs">
                                  Contacto
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground truncate">
                                {chat.phone_number}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No hay conversaciones disponibles
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mensajes y configuración de chat */}
            {phoneNumber ? (
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8" style={{ color: "#cc88ff" }} />
                    <div>
                      <CardTitle>{getContactName(phoneNumber)}</CardTitle>
                      <CardDescription>{phoneNumber}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoadingPhoneConfig ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="phone-bot" className="text-sm">
                          Bot
                        </Label>
                        <Switch
                          id="phone-bot"
                          checked={phoneConfig?.bot_enabled}
                          onCheckedChange={handleTogglePhoneBot}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-[600px]">
                    <ErrorBoundary
                      fallback={
                        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                          <h3 className="font-bold text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Error al mostrar mensajes
                          </h3>
                          <p className="mt-2">Ha ocurrido un error al renderizar los mensajes. Intenta recargar la página o seleccionar otra conversación.</p>
                        </div>
                      }
                    >
                      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {(() => {
                          // Validar que tenemos los datos necesarios antes de intentar renderizar
                          if (isLoadingMessages) {
                            return (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              </div>
                            );
                          }
                          
                          if (!messages) {
                            return (
                              <div className="p-4 border border-amber-300 bg-amber-50 rounded-md">
                                <p className="text-amber-700">No se pudieron cargar los mensajes. Intenta recargar la página.</p>
                              </div>
                            );
                          }
                          
                          if (messages.length === 0) {
                            return <p className="text-center text-gray-500">No hay mensajes disponibles</p>;
                          }
                          
                          // Si llegamos aquí, tenemos mensajes para mostrar
                          try {
                            // Crear una copia segura del array de mensajes
                            const safeMessages = [...messages];
                            
                            // Ordenar los mensajes de forma segura
                            const sortedMessages = safeMessages.sort((a, b) => {
                              try {
                                const timeA = new Date(a.timestamp).getTime();
                                const timeB = new Date(b.timestamp).getTime();
                                return timeA - timeB;
                              } catch (error) {
                                console.error('Error al ordenar mensajes:', error);
                                return 0; // Mantener el orden original si hay error
                              }
                            });
                            
                            // Renderizar cada mensaje con manejo de errores
                            return sortedMessages.map((msg) => {
                              // Validar que el mensaje tiene un ID válido
                              if (!msg.id) {
                                console.error('Mensaje sin ID:', msg);
                                return null;
                              }
                              
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.is_from_admin ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[70%] p-3 rounded-lg ${
                                      msg.is_from_admin
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}
                                  >
                                    {msg.media_url && (
                                      <div className="mb-2">
                                        {msg.media_type?.startsWith("image/") ? (
                                          <img
                                            src={msg.media_url}
                                            alt="Media"
                                            className="max-w-full rounded"
                                            onError={(e) => {
                                              console.error('Error al cargar imagen');
                                              e.currentTarget.src = 'https://via.placeholder.com/150?text=Error+al+cargar';
                                            }}
                                          />
                                        ) : msg.media_type?.startsWith("video/") ? (
                                          <video
                                            src={msg.media_url}
                                            controls
                                            className="max-w-full rounded"
                                            onError={() => console.error('Error al cargar video')}
                                          />
                                        ) : (
                                          <a
                                            href={msg.media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline"
                                          >
                                            Descargar archivo
                                          </a>
                                        )}
                                      </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.message || '[Sin contenido]'}</p>
                                    <p className="text-xs mt-1 opacity-70">
                                      {(() => {
                                        try {
                                          return format(new Date(msg.timestamp), "HH:mm - dd/MM/yyyy");
                                        } catch (error) {
                                          console.error('Error al formatear fecha:', error);
                                          return msg.timestamp || 'Fecha desconocida';
                                        }
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              );
                            });
                          } catch (error) {
                            console.error('Error al renderizar mensajes:', error);
                            return (
                              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                                <h3 className="font-bold text-red-700">Error al procesar mensajes</h3>
                                <p className="mt-2">{error instanceof Error ? error.message : 'Error desconocido'}</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </ErrorBoundary>
                  </div>
                </CardContent>
                <CardFooter>
                  <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={isSendingMessage}
                    />
                    <Button
                      type="submit"
                      disabled={isSendingMessage || !message.trim()}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="ml-2">Enviar</span>
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            ) : (
              <Card className="md:col-span-2">
                <div className="flex flex-col items-center justify-center h-[500px] text-center p-6">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">
                    Selecciona una conversación
                  </h3>
                  <p className="text-muted-foreground">
                    Elige un chat de la lista para ver los mensajes y enviar respuestas
                  </p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de WhatsApp</CardTitle>
              <CardDescription>
                Configura la integración con n8n para WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL del webhook de n8n</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    placeholder="https://n8n.example.com/webhook/whatsapp"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveWebhookUrl}>Guardar</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL del webhook de n8n para enviar mensajes desde el CRM
                </p>
              </div>

              {/* La configuración del bot ahora es solo por número de teléfono individual */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </ErrorBoundary>
    </div>
  );
}
