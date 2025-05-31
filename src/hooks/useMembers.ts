
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

  // Mutación para eliminar miembro - con mejor manejo de errores
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('Iniciando eliminación de miembro con ID:', memberId);
      
      // Primero verificar que el miembro existe
      const { data: existingMember, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', memberId)
        .single();

      if (fetchError) {
        console.error('Error al buscar miembro:', fetchError);
        throw new Error('No se pudo encontrar el miembro a eliminar');
      }

      console.log('Miembro encontrado:', existingMember);

      // Realizar la eliminación
      const { error: deleteError, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('id', memberId);

      if (deleteError) {
        console.error('Error al eliminar miembro:', deleteError);
        throw new Error(`Error al eliminar miembro: ${deleteError.message}`);
      }

      console.log('Eliminación completada. Filas eliminadas:', count);
      
      if (count === 0) {
        throw new Error('No se eliminó ningún registro. El miembro podría no existir.');
      }

      return { memberId, deletedMember: existingMember };
    },
    onSuccess: (data) => {
      console.log('Miembro eliminado exitosamente:', data);
      
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      // También actualizar manualmente el caché para una respuesta más inmediata
      queryClient.setQueryData(['members', profile?.organization_id], (oldData: MemberProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(member => member.id !== data.memberId);
      });

      toast({
        title: "Miembro eliminado",
        description: `${data.deletedMember.first_name} ${data.deletedMember.last_name} ha sido eliminado del sistema.`,
      });
    },
    onError: (error: any) => {
      console.error('Error en deleteMemberMutation:', error);
      toast({
        title: "Error al eliminar miembro",
        description: error.message || "Error desconocido al eliminar el miembro",
        variant: "destructive",
      });
    },
  });

  // Mutación para cancelar invitación - con mejor manejo de errores
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('Iniciando eliminación de invitación con ID:', invitationId);
      
      // Primero verificar que la invitación existe
      const { data: existingInvitation, error: fetchError } = await supabase
        .from('member_invitations')
        .select('id, email, first_name, last_name')
        .eq('id', invitationId)
        .single();

      if (fetchError) {
        console.error('Error al buscar invitación:', fetchError);
        throw new Error('No se pudo encontrar la invitación a eliminar');
      }

      console.log('Invitación encontrada:', existingInvitation);

      // Realizar la eliminación
      const { error: deleteError, count } = await supabase
        .from('member_invitations')
        .delete({ count: 'exact' })
        .eq('id', invitationId);

      if (deleteError) {
        console.error('Error al eliminar invitación:', deleteError);
        throw new Error(`Error al eliminar invitación: ${deleteError.message}`);
      }

      console.log('Eliminación completada. Filas eliminadas:', count);
      
      if (count === 0) {
        throw new Error('No se eliminó ningún registro. La invitación podría no existir.');
      }

      return { invitationId, deletedInvitation: existingInvitation };
    },
    onSuccess: (data) => {
      console.log('Invitación eliminada exitosamente:', data);
      
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['member_invitations'] });
      
      // También actualizar manualmente el caché
      queryClient.setQueryData(['pending-invitations', profile?.organization_id], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(invitation => invitation.id !== data.invitationId);
      });

      toast({
        title: "Invitación eliminada",
        description: `La invitación para ${data.deletedInvitation.email} ha sido eliminada del sistema.`,
      });
    },
    onError: (error: any) => {
      console.error('Error en cancelInvitationMutation:', error);
      toast({
        title: "Error al eliminar invitación",
        description: error.message || "Error desconocido al eliminar la invitación",
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
