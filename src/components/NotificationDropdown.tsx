import React from 'react';
import { Bell, Calendar, Clock, User, CheckCircle, AlertCircle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'appointment_created':
      return <Calendar className="h-4 w-4 text-green-500" />;
    case 'appointment_updated':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'appointment_deleted':
      return <X className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function NotificationItem({ notification, onMarkAsRead }: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  const appointmentData = notification.appointment_data;

  return (
    <div 
      className={cn(
        "p-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4",
        notification.is_read 
          ? "border-l-gray-200 bg-white" 
          : "border-l-blue-500 bg-blue-50/30"
      )}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              "text-sm font-medium truncate",
              notification.is_read ? "text-gray-900" : "text-gray-900 font-semibold"
            )}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>

          {appointmentData && (
            <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 space-y-1">
              {appointmentData.contact_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{appointmentData.contact_name}</span>
                </div>
              )}
              {appointmentData.appointment_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {appointmentData.appointment_date} • {appointmentData.start_time}
                  </span>
                </div>
              )}
              {appointmentData.service_name && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{appointmentData.service_name}</span>
                </div>
              )}
              {notification.type === 'appointment_updated' && 
               appointmentData.previous_status !== appointmentData.status && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Estado: {appointmentData.previous_status} → {appointmentData.status}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-2">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isMarkingAllAsRead 
  } = useNotifications();

  // Log para diagnosticar
  console.log('NotificationDropdown - notifications:', notifications);
  console.log('NotificationDropdown - notifications.length:', notifications.length);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-sm min-w-[1.25rem] px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0 shadow-lg border border-gray-200/50">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 font-medium transition-colors"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllAsRead}
              >
                {isMarkingAllAsRead ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2" />
                ) : (
                  <Check className="h-3 w-3 mr-2" />
                )}
                Marcar todas como leídas
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} {unreadCount === 1 ? 'notificación nueva' : 'notificaciones nuevas'}
            </p>
          )}
        </div>

        <ScrollArea className="h-96 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification, index) => {
                console.log(`Rendering notification ${index}:`, notification.title);
                return (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 bg-gray-50/50">
              <p className="text-xs text-gray-500 text-center">
                Mostrando {notifications.length} de {notifications.length} notificaciones
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 