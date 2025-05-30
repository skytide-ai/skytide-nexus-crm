import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Edit, Trash2, Search } from 'lucide-react';

interface MemberProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'member' | 'superadmin';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface MemberInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

export default function Members() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });

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
  const { data: invitations = [] } = useQuery({
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

  // Mutación para enviar invitación
  const inviteMutation = useMutation({
    mutationFn: async (inviteData: typeof inviteForm) => {
      console.log('Enviando invitación...', inviteData);
      
      // Obtener el token de sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Error obteniendo sesión:', sessionError);
        throw new Error('No hay sesión activa');
      }

      console.log('Token obtenido, llamando función...');

      const { data, error } = await supabase.functions.invoke('send-member-invitation', {
        body: {
          email: inviteData.email,
          firstName: inviteData.firstName,
          lastName: inviteData.lastName
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta de función:', { data, error });

      if (error) {
        console.error('Error en función:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Invitación enviada",
        description: "La invitación ha sido enviada correctamente por email.",
      });
      setInviteForm({ email: '', firstName: '', lastName: '' });
      setIsInviteDialogOpen(false);
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

  const filteredMembers = members.filter(member =>
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? 'Enviando...' : 'Enviar Invitación'}
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
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitaciones Pendientes
            </CardTitle>
            <CardDescription>
              Invitaciones enviadas que aún no han sido aceptadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium">{invitation.first_name} {invitation.last_name}</p>
                    <p className="text-sm text-gray-600">{invitation.email}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Enviada {new Date(invitation.created_at).toLocaleDateString()}
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
          {membersLoading ? (
            <div className="text-center py-8">Cargando miembros...</div>
          ) : filteredMembers.length === 0 ? (
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.first_name[0]}{member.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.first_name} {member.last_name}</p>
                          <p className="text-sm text-gray-500">
                            Miembro desde {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'admin' ? 'Administrador' :
                         member.role === 'superadmin' ? 'Super Admin' : 'Miembro'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={(checked) => handleToggleActive(member.id, checked)}
                          disabled={member.id === profile?.id} // No puede desactivarse a sí mismo
                        />
                        <span className="text-sm">
                          {member.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {member.id !== profile?.id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
