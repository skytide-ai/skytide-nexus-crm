
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  invited_by_name: string;
  created_at: string;
  expires_at: string;
}

interface PendingInvitationsTableProps {
  invitations: PendingInvitation[];
  isLoading: boolean;
  onCancelInvitation: (invitationId: string) => void;
}

export const PendingInvitationsTable: React.FC<PendingInvitationsTableProps> = ({
  invitations,
  isLoading,
  onCancelInvitation
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Invitaciones Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Cargando invitaciones...</div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Invitaciones Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            No hay invitaciones pendientes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Invitaciones Pendientes ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">Invitado por</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Enviado</th>
                <th className="text-right py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {invitation.email}
                    </div>
                  </td>
                  <td className="py-3">
                    {invitation.first_name} {invitation.last_name}
                  </td>
                  <td className="py-3">
                    {invitation.invited_by_name}
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pendiente
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(invitation.created_at), {
                      addSuffix: true,
                      locale: es
                    })}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
