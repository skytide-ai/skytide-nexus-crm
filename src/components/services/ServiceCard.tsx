
import React from 'react';
import { Clock, DollarSign, Users, MoreHorizontal, Edit, Trash2, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Service } from '@/hooks/useServices';

interface ServiceCardProps {
  service: Service;
  canManage: boolean;
  onEdit: () => void;
  onManageMembers: () => void;
  onDelete: () => void;
}

export function ServiceCard({ service, canManage, onEdit, onManageMembers, onDelete }: ServiceCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}min`
        : `${hours}h`;
    }
    return `${minutes}min`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {service.name}
            </CardTitle>
            {service.description && (
              <CardDescription className="mt-1 text-sm text-gray-600 line-clamp-2">
                {service.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant={service.is_active ? 'default' : 'secondary'}>
              {service.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onManageMembers}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Gestionar Miembros
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Service Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(service.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-primary">
            <DollarSign className="h-4 w-4" />
            <span>{formatPrice(service.price_cop)}</span>
          </div>
        </div>

        {/* Assigned Members */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Miembros asignados ({service.assigned_members?.length || 0})
            </span>
          </div>
          
          {service.assigned_members && service.assigned_members.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {service.assigned_members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {getInitials(member.first_name, member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {service.assigned_members.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{service.assigned_members.length - 3} más
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No hay miembros asignados
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
