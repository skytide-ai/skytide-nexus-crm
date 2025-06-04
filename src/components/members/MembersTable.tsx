
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2 } from 'lucide-react';
import { MemberProfile } from '@/types/member';
import { useAuth } from '@/contexts/AuthContext';
import { EditMemberDialog } from './EditMemberDialog';

interface MembersTableProps {
  members: MemberProfile[];
  isLoading: boolean;
  searchTerm: string;
  onToggleActive: (memberId: string, isActive: boolean) => void;
  onDeleteMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, updates: Partial<MemberProfile>) => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  isLoading,
  searchTerm,
  onToggleActive,
  onDeleteMember,
  onUpdateMember
}) => {
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { profile } = useAuth();

  const filteredMembers = members.filter(member =>
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Miembros Activos</CardTitle>
          <CardDescription>
            {filteredMembers.length} miembro{filteredMembers.length !== 1 ? 's' : ''} encontrado{filteredMembers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading ? (
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
                        onCheckedChange={(checked) => onToggleActive(member.id, checked)}
                        disabled={member.id === profile?.id}
                      />
                      <span className="text-sm">
                        {member.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingMember(member);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {member.id !== profile?.id && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onDeleteMember(member.id)}
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

      {/* Diálogo de edición de miembro */}
      {editingMember && (
        <EditMemberDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          member={editingMember}
          onUpdate={onUpdateMember}
        />
      )}
    </>
  );
};
