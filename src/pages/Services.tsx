
import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useServices } from '@/hooks/useServices';
import { CreateServiceDialog } from '@/components/services/CreateServiceDialog';
import { EditServiceDialog } from '@/components/services/EditServiceDialog';
import { ManageServiceMembersDialog } from '@/components/services/ManageServiceMembersDialog';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { ServiceCard } from '@/components/services/ServiceCard';
import { useAuth } from '@/contexts/AuthContext';

export default function Services() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { data: services, isLoading } = useServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [managingMembersService, setManagingMembersService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const canManageServices = isAdmin || isSuperAdmin;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600 mt-1">Gestiona los servicios de tu organización</p>
        </div>
        {canManageServices && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron servicios' : 'No hay servicios'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando tu primer servicio'
              }
            </p>
            {canManageServices && !searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Servicio
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              canManage={canManageServices}
              onEdit={() => setEditingService(service)}
              onManageMembers={() => setManagingMembersService(service)}
              onDelete={() => setDeletingService(service)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateServiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {editingService && (
        <EditServiceDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={() => setEditingService(null)}
        />
      )}

      {managingMembersService && (
        <ManageServiceMembersDialog
          service={managingMembersService}
          open={!!managingMembersService}
          onOpenChange={() => setManagingMembersService(null)}
        />
      )}

      {deletingService && (
        <DeleteServiceDialog
          service={deletingService}
          open={!!deletingService}
          onOpenChange={() => setDeletingService(null)}
        />
      )}
    </div>
  );
}
