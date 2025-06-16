import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  organization_id: string;
  user_id?: string;
  type: 'appointment_created' | 'appointment_updated' | 'appointment_deleted';
  title: string;
  message: string;
  appointment_id?: string;
  appointment_data?: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Determinar qué notificaciones mostrar según el rol
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const queryKey = isAdmin 
    ? ['notifications', 'org', profile?.organization_id] 
    : ['notifications', 'user', profile?.id];

  // Obtener notificaciones según el rol
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!profile?.id) return [];
      
      console.log('useNotifications - fetching for profile:', profile);
      console.log('useNotifications - isAdmin:', isAdmin);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (isAdmin && profile?.organization_id) {
        // Admins ven todas las notificaciones de la organización
        console.log('useNotifications - Admin query for org:', profile.organization_id);
        query = query.eq('organization_id', profile.organization_id);
      } else {
        // Miembros solo ven sus notificaciones
        console.log('useNotifications - Member query for user:', profile.id);
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      console.log('useNotifications - Raw fetched data:', data);
      console.log('useNotifications - Fetched count:', data?.length || 0);
      return data as Notification[];
    },
    enabled: !!profile?.id,
    staleTime: 0, // Siempre considerar los datos como obsoletos
    gcTime: 1000 * 60 * 5, // Mantener en cache por 5 minutos (nueva sintaxis)
  });

  // Marcar notificación como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('Marking notification as read:', notificationId);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
      console.log('Successfully marked notification as read');
    },
    onSuccess: (_, notificationId) => {
      console.log('Refetching after mark as read');
      
      // Actualizar el cache inmediatamente
      queryClient.setQueryData(queryKey, (oldData: Notification[] = []) => {
        return oldData.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        );
      });
      
      // También hacer refetch por si acaso
      refetch();
    },
  });

  // Marcar todas como leídas según el rol
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      
      console.log('Marking all notifications as read for user:', profile.id);
      console.log('Current notifications before update:', notifications);
      
      // Obtener los IDs de las notificaciones no leídas que están actualmente visibles
      const unreadNotificationIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      console.log('Unread notification IDs to update:', unreadNotificationIds);
      
      if (unreadNotificationIds.length === 0) {
        console.log('No unread notifications to update');
        return;
      }
      
      // Usar IDs específicos independientemente del rol
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadNotificationIds);
        
      if (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
      }
      
      console.log('Successfully marked all notifications as read');
    },
    onSuccess: async () => {
      console.log('Refetching after mark all as read');
      
      // Actualizar el cache inmediatamente
      queryClient.setQueryData(queryKey, (oldData: Notification[] = []) => {
        const updatedData = oldData.map(notification => ({
          ...notification,
          is_read: true
        }));
        console.log('Updated cache data:', updatedData);
        return updatedData;
      });
      
      // Invalidar cache completamente y refetch
      await queryClient.invalidateQueries({ queryKey });
      
      // Esperar un poco y hacer refetch manual
      setTimeout(async () => {
        console.log('Doing manual refetch after timeout');
        const result = await refetch();
        console.log('Manual refetch result:', result.data);
      }, 100);
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
} 