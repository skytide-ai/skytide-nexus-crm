
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
    <Card className="hover:shadow-md transition-shadow duration-200 border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {service.name}
              </CardTitle>
            </div>
            {service.description && (
              <CardDescription className="text-sm text-gray-600 line-clamp-2">
                {service.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3">
            <Badge 
              variant={service.is_active ? 'default' : 'secondary'}
              className={service.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              {service.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar servicio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onManageMembers} className="cursor-pointer">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Gestionar miembros
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-red-600 cursor-pointer focus:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar servicio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Service Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{formatDuration(service.duration_minutes)}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-lg text-gray-900">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>{formatPrice(service.price_cop)}</span>
            </div>
          </div>
        </div>

        {/* Assigned Members */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Equipo asignado
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {service.assigned_members?.length || 0}
            </Badge>
          </div>
          
          {service.assigned_members && service.assigned_members.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {service.assigned_members.slice(0, 4).map((member) => (
                    <Avatar 
                      key={member.id} 
                      className="w-8 h-8 border-2 border-white"
                    >
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {service.assigned_members.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{service.assigned_members.length - 4} más
                  </span>
                )}
              </div>
              
              {/* Show first 2 member names */}
              <div className="text-xs text-gray-600">
                {service.assigned_members.slice(0, 2).map((member, index) => (
                  <span key={member.id}>
                    {member.first_name} {member.last_name}
                    {index < Math.min(1, service.assigned_members!.length - 1) && ', '}
                  </span>
                ))}
                {service.assigned_members.length > 2 && (
                  <span className="text-gray-500"> y {service.assigned_members.length - 2} más</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-xs text-gray-500">
                Sin miembros asignados
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
