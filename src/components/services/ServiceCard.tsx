
import React from 'react';
import { Clock, DollarSign, Users, MoreHorizontal, Edit, Trash2, UserCheck, Star } from 'lucide-react';
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
    <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-primary/30 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/70"></div>
              <CardTitle className="text-xl font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                {service.name}
              </CardTitle>
            </div>
            {service.description && (
              <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {service.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3">
            <Badge 
              variant={service.is_active ? 'default' : 'secondary'}
              className={`
                ${service.is_active 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-600'
                } transition-all duration-200
              `}
            >
              {service.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-gray-100 transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2 text-blue-500" />
                    Editar servicio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onManageMembers} className="cursor-pointer">
                    <UserCheck className="h-4 w-4 mr-2 text-green-500" />
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
        {/* Service Details with enhanced styling */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">{formatDuration(service.duration_minutes)}</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
              <div className="p-1.5 bg-green-100 rounded-full">
                <DollarSign className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span>{formatPrice(service.price_cop)}</span>
            </div>
          </div>
        </div>

        {/* Assigned Members with improved design */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-full">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
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
                      className="w-8 h-8 border-2 border-white shadow-sm hover:scale-105 transition-transform"
                    >
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs font-semibold">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {service.assigned_members.length > 4 && (
                  <span className="text-xs text-gray-500 font-medium">
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
            <div className="text-center py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-xs text-gray-500 font-medium">
                Sin miembros asignados
              </p>
              <p className="text-xs text-gray-400">
                Asigna miembros para este servicio
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
