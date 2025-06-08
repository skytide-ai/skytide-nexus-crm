
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, CheckCircle2, XCircle, Mail } from 'lucide-react';
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
        <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-8">Cargando miembros...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No se encontraron miembros con ese criterio' : 'No hay miembros en la organización'}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-indigo-500 text-white">
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="truncate max-w-[200px]">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
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
                      <span className={`inline-flex items-center gap-1 text-sm ${member.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {member.is_active ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingMember(member);
                          setIsEditDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="Editar miembro"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {member.id !== profile?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDeleteMember(member.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          title="Eliminar miembro"
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
