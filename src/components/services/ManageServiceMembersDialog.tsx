
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, UserMinus } from 'lucide-react';
import { Service, useAssignMemberToService, useUnassignMemberFromService } from '@/hooks/useServices';
import { useMembers } from '@/hooks/useMembers';

interface ManageServiceMembersDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageServiceMembersDialog({ service, open, onOpenChange }: ManageServiceMembersDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: members } = useMembers();
  const assignMember = useAssignMemberToService();
  const unassignMember = useUnassignMemberFromService();

  const assignedMemberIds = new Set(service.assigned_members?.map(member => member.id) || []);
  
  const filteredMembers = members?.filter(member =>
    member.is_active &&
    (member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const availableMembers = filteredMembers.filter(member => !assignedMemberIds.has(member.id));
  const assignedMembers = filteredMembers.filter(member => assignedMemberIds.has(member.id));

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleAssignMember = async (memberId: string) => {
    try {
      await assignMember.mutateAsync({ serviceId: service.id, memberId });
    } catch (error) {
      console.error('Error assigning member:', error);
    }
  };

  const handleUnassignMember = async (memberId: string) => {
    try {
      await unassignMember.mutateAsync({ serviceId: service.id, memberId });
    } catch (error) {
      console.error('Error unassigning member:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gestionar Miembros - {service.name}</DialogTitle>
          <DialogDescription>
            Asigna o desasigna miembros que pueden prestar este servicio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar miembros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto">
            {/* Assigned Members */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                Miembros Asignados
                <Badge variant="secondary">{assignedMembers.length}</Badge>
              </h3>
              <div className="space-y-2">
                {assignedMembers.length > 0 ? (
                  assignedMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnassignMember(member.id)}
                        disabled={unassignMember.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No hay miembros asignados a este servicio
                  </p>
                )}
              </div>
            </div>

            {/* Available Members */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                Miembros Disponibles
                <Badge variant="secondary">{availableMembers.length}</Badge>
              </h3>
              <div className="space-y-2">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {getInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAssignMember(member.id)}
                        disabled={assignMember.isPending}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {searchTerm 
                      ? 'No se encontraron miembros disponibles'
                      : 'Todos los miembros ya están asignados'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
