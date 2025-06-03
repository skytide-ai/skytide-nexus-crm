
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { InviteMemberDialog } from '@/components/members/InviteMemberDialog';
import { SearchMembers } from '@/components/members/SearchMembers';
import { MembersTable } from '@/components/members/MembersTable';
import { PendingInvitationsTable } from '@/components/members/PendingInvitationsTable';

export default function Members() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const {
    members,
    membersLoading,
    pendingInvitations,
    invitationsLoading,
    inviteMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
    cancelInvitationMutation,
  } = useMembers();

  const handleToggleActive = (memberId: string, isActive: boolean) => {
    updateMemberMutation.mutate({
      memberId,
      updates: { is_active: isActive }
    });
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este miembro?')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta invitación?')) {
      cancelInvitationMutation.mutate(invitationId);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para gestionar miembros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Miembros</h1>
          <p className="text-gray-600">Administra los miembros de tu organización</p>
        </div>
        
        <InviteMemberDialog
          onInvite={(formData) => inviteMemberMutation.mutate(formData)}
          isLoading={inviteMemberMutation.isPending}
        />
      </div>

      {/* Información sobre el nuevo sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Sistema de invitaciones mejorado
              </p>
              <p className="text-xs text-blue-700">
                Los nuevos miembros recibirán un email con un enlace seguro para crear su cuenta y elegir su contraseña
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitaciones pendientes */}
      <PendingInvitationsTable
        invitations={pendingInvitations}
        isLoading={invitationsLoading}
        onCancelInvitation={handleCancelInvitation}
      />

      {/* Búsqueda */}
      <SearchMembers searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Lista de miembros */}
      <MembersTable
        members={members}
        isLoading={membersLoading}
        searchTerm={searchTerm}
        onToggleActive={handleToggleActive}
        onDeleteMember={handleDeleteMember}
        onUpdateMember={(memberId, updates) => {
          updateMemberMutation.mutate({
            memberId,
            updates
          });
        }}
      />
    </div>
  );
}
