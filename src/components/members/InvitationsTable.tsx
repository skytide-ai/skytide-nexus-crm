
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, X } from 'lucide-react';
import { MemberInvitation } from '@/types/member';

interface InvitationsTableProps {
  invitations: MemberInvitation[];
  isLoading: boolean;
  searchTerm: string;
  onRevokeInvitation: (invitationId: string) => void;
}

export const InvitationsTable: React.FC<InvitationsTableProps> = ({
  invitations,
  isLoading,
  searchTerm,
  onRevokeInvitation
}) => {
  const filteredInvitations = invitations.filter(invitation =>
    invitation.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invitation.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invitation.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Invitaciones Pendientes
        </CardTitle>
        <CardDescription>
          {filteredInvitations.length} invitación{filteredInvitations.length !== 1 ? 'es' : ''} pendiente{filteredInvitations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Cargando invitaciones...</div>
        ) : filteredInvitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No se encontraron invitaciones con ese criterio' : 'No hay invitaciones pendientes'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invitado</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviada</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {invitation.first_name[0]}{invitation.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{invitation.first_name} {invitation.last_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isExpired(invitation.expires_at) 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {isExpired(invitation.expires_at) ? 'Expirada' : 'Pendiente'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revocar invitación</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que quieres revocar la invitación para {invitation.first_name} {invitation.last_name}? 
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onRevokeInvitation(invitation.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Revocar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
