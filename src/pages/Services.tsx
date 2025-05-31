
import React, { useState } from 'react';
import { Plus, Search, Users, AlertCircle, RefreshCw, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/hooks/useServices';
import { CreateServiceDialog } from '@/components/services/CreateServiceDialog';
import { EditServiceDialog } from '@/components/services/EditServiceDialog';
import { ManageServiceMembersDialog } from '@/components/services/ManageServiceMembersDialog';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { ServiceCard } from '@/components/services/ServiceCard';
import { useAuth } from '@/contexts/AuthContext';

export default function Services() {
  const { isAdmin, isSuperAdmin, profile } = useAuth();
  const { data: services, isLoading, error, refetch } = useServices();
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

  // Statistics
  const activeServices = services?.filter(s => s.is_active).length || 0;
  const totalMembers = new Set(
    services?.flatMap(s => s.assigned_members?.map(m => m.id) || [])
  ).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-700">Cargando servicios...</p>
            <p className="text-sm text-gray-500">Preparando tu catálogo de servicios</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
            <p className="text-gray-600 mt-1">Gestiona los servicios de tu organización</p>
          </div>
        </div>

        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-semibold">Error al cargar los servicios</p>
              <p className="text-sm">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Servicios
            </h1>
            <p className="text-lg text-gray-600">
              Gestiona y organiza los servicios de tu empresa
            </p>
          </div>
          {canManageServices && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Servicio
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        {services && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total de servicios</p>
                    <p className="text-2xl font-bold text-blue-900">{services.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Servicios activos</p>
                    <p className="text-2xl font-bold text-green-900">{activeServices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Miembros asignados</p>
                    <p className="text-2xl font-bold text-purple-900">{totalMembers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar servicios por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-200 focus:border-primary"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Actualizar servicios"
              className="h-11 w-11 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {searchTerm && (
              <Badge variant="secondary" className="text-sm">
                {filteredServices.length} resultado{filteredServices.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Grid or Empty State */}
      {filteredServices.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {searchTerm ? 'No se encontraron servicios' : 'Aún no tienes servicios'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda o revisa los filtros aplicados'
                    : 'Comienza creando tu primer servicio para ofrecer a tus clientes'
                  }
                </p>
              </div>
              {canManageServices && !searchTerm && (
                <div className="pt-4">
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/90"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Crear mi primer servicio
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
