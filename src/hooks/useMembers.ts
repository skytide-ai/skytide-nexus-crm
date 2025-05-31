import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MemberProfile, CreateMemberForm } from '@/types/member';

export const useMembers = () => {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener miembros de la organización
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MemberProfile[];
    },
    enabled: !!profile?.organization_id && isAdmin,
  });

  // Obtener invitaciones pendientes
  const { data: pendingInvitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['pending-invitations', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_invitations')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id && isAdmin,
  });

  // Mutación para invitar miembro - usando send-invitation
  const inviteMemberMutation = useMutation({
    mutationFn: async (memberData: CreateMemberForm) => {
      console.log('Enviando invitación...', memberData);
      
      // Obtener el token de sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Error getting session:', sessionError);
        throw new Error('No se pudo obtener la sesión de usuario');
      }

      console.log('Session token available:', !!session.access_token);
      
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: memberData.email,
          firstName: memberData.firstName,
          lastName: memberData.lastName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error invoking function:', error);
        throw new Error(error.message || 'Error al enviar la invitación');
      }

      console.log('Respuesta de la función:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Invitación enviada exitosamente:', data);
      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación por email a ${variables.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
    },
    onError: (error: any) => {
      console.error('Error completo:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar la invitación",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar estado del miembro
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, updates }: { memberId: string; updates: Partial<MemberProfile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Miembro actualizado",
        description: "Los cambios han sido guardados correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Error al actualizar el miembro",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar miembro - ahora elimina completamente la fila
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('Eliminando miembro con ID:', memberId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error al eliminar miembro:', error);
        throw error;
      }
      
      console.log('Miembro eliminado exitosamente');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado completamente del sistema.",
      });
    },
    onError: (error: any) => {
      console.error('Error en deleteMemberMutation:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el miembro: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para cancelar invitación - ahora elimina completamente la fila
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('Eliminando invitación con ID:', invitationId);
      
      const { error } = await supabase
        .from('member_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error al eliminar invitación:', error);
        throw error;
      }
      
      console.log('Invitación eliminada exitosamente');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast({
        title: "Invitación eliminada",
        description: "La invitación ha sido eliminada completamente del sistema.",
      });
    },
    onError: (error: any) => {
      console.error('Error en cancelInvitationMutation:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la invitación: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    members,
    membersLoading,
    pendingInvitations,
    invitationsLoading,
    inviteMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
    cancelInvitationMutation,
  };
};
