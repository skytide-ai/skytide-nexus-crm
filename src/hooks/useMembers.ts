
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MemberProfile, MemberInvitation, CreateMemberForm } from '@/types/member';

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
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_invitations')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('used', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MemberInvitation[];
    },
    enabled: !!profile?.organization_id && isAdmin,
  });

  // Mutación para invitar miembro
  const inviteMemberMutation = useMutation({
    mutationFn: async (memberData: CreateMemberForm) => {
      console.log('Invitando miembro...', memberData);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No hay sesión activa');
      }

      const requestBody = {
        email: memberData.email,
        firstName: memberData.firstName,
        lastName: memberData.lastName
      };

      console.log('Enviando petición con body:', requestBody);

      const response = await fetch(`https://fyyzaysmpephomhmudxt.supabase.co/functions/v1/invite-member`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eXpheXNtcGVwaG9taG11ZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2Mzc4MzEsImV4cCI6MjA2NDIxMzgzMX0.4Y9ZxRANOQmmKEbVmmsA5ZMrQcbdOzs2XgvcizR3ZJQ'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Respuesta del edge function:', data);
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Invitación enviada exitosamente:', data);
      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación por email a ${variables.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
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

  // Mutación para revocar invitación
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('member_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: "Invitación revocada",
        description: "La invitación ha sido revocada correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Error al revocar la invitación",
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

  // Mutación para eliminar miembro
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Error al eliminar el miembro",
        variant: "destructive",
      });
    },
  });

  return {
    members,
    membersLoading,
    invitations,
    invitationsLoading,
    inviteMemberMutation,
    revokeInvitationMutation,
    updateMemberMutation,
    deleteMemberMutation,
  };
};
