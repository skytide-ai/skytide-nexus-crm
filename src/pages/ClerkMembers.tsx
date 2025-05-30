
import React, { useState } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Search, Edit, Trash2 } from 'lucide-react';

export default function ClerkMembers() {
  const { organization, memberships, invitations } = useOrganization({
    memberships: {
      infinite: true,
    },
    invitations: {
      infinite: true,
    },
  });
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member'
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization) return;

    try {
      await organization.inviteUser({
        emailAddress: inviteForm.email,
        role: inviteForm.role,
      });

      toast({
        title: "Invitación enviada",
        description: "La invitación ha sido enviada correctamente por email.",
      });

      setInviteForm({ email: '', role: 'member' });
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al enviar la invitación",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: 'admin' | 'member') => {
    if (!organization) return;

    try {
      await organization.updateMember({
        userId,
        role,
      });

      toast({
        title: "Miembro actualizado",
        description: "El rol del miembro ha sido actualizado correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al actualizar el miembro",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!organization) return;

    if (confirm('¿Estás seguro de que quieres eliminar este miembro?')) {
      try {
        await organization.removeMember(userId);

        toast({
          title: "Miembro eliminado",
          description: "El miembro ha sido eliminado correctamente.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Error al eliminar el miembro",
          variant: "destructive",
        });
      }
    }
  };

  const filteredMembers = memberships?.data?.filter(membership =>
    membership.publicUserData.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membership.publicUserData.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membership.publicUserData.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar Miembro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
              <DialogDescription>
                Envía una invitación por email para que se una a la organización
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as 'admin' | 'member'})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Enviar Invitación
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar miembros por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invitaciones pendientes */}
      {invitations?.data && invitations.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones Pendientes</CardTitle>
            <CardDescription>
              Invitaciones enviadas que aún no han sido aceptadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.data.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium">{invitation.emailAddress}</p>
                    <p className="text-sm text-gray-600">Rol: {invitation.role}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Enviada {new Date(invitation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de miembros */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros Activos</CardTitle>
          <CardDescription>
            {filteredMembers.length} miembro{filteredMembers.length !== 1 ? 's' : ''} encontrado{filteredMembers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron miembros con ese criterio' : 'No hay miembros en la organización'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={membership.publicUserData.imageUrl || undefined} />
                          <AvatarFallback>
                            {membership.publicUserData.firstName?.[0]}{membership.publicUserData.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {membership.publicUserData.firstName} {membership.publicUserData.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Miembro desde {new Date(membership.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{membership.publicUserData.identifier}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        membership.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {membership.role === 'admin' ? 'Administrador' : 'Miembro'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateMemberRole(
                            membership.publicUserData.userId, 
                            membership.role === 'admin' ? 'member' : 'admin'
                          )}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRemoveMember(membership.publicUserData.userId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
