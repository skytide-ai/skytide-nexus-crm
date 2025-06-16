
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        <CardContent className="p-0">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando invitaciones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay invitaciones pendientes
            </h3>
            <p className="text-gray-600">
              Las invitaciones aparecerán aquí cuando invites a nuevos miembros
            </p>
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
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Invitado por</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="truncate max-w-[200px]">{invitation.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {invitation.first_name} {invitation.last_name}
                  </div>
                </TableCell>
                <TableCell>
                  {invitation.invited_by_name}
                </TableCell>
                <TableCell>
                  <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                    Pendiente
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(invitation.created_at), {
                        addSuffix: true,
                        locale: es
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancelInvitation(invitation.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    title="Cancelar invitación"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
