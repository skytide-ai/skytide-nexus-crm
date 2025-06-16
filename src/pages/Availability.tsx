import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { 
  useMemberAvailability,
  useMemberSpecialDates,
  useOrganizationAvailability,
  useOrganizationSpecialDates,
  useCreateMemberAvailability,
  useDeleteMemberAvailability,
  useCreateMemberSpecialDate,
  useDeleteMemberSpecialDate,
  useCreateOrganizationAvailability,
  useDeleteOrganizationAvailability,
  useCreateOrganizationSpecialDate,
  useDeleteOrganizationSpecialDate
} from '@/hooks/useAvailability';
import { WeeklyAvailability } from '@/components/availability/WeeklyAvailability';
import { SpecialDates } from '@/components/availability/SpecialDates';

export function Availability() {
  const { profile } = useAuth();
  const { members } = useMembers();
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(profile?.id);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const targetMemberId = selectedMemberId || profile?.id;

  // Hooks para disponibilidad del miembro
  const { data: memberAvailability = [], isLoading: loadingMemberAvailability } = useMemberAvailability(targetMemberId);
  const { data: memberSpecialDates = [], isLoading: loadingMemberSpecialDates } = useMemberSpecialDates(targetMemberId);
  
  // Hooks para disponibilidad de la organización
  const { data: orgAvailability = [], isLoading: loadingOrgAvailability } = useOrganizationAvailability();
  const { data: orgSpecialDates = [], isLoading: loadingOrgSpecialDates } = useOrganizationSpecialDates();

  // Mutations para miembros
  const createMemberAvailability = useCreateMemberAvailability();
  const deleteMemberAvailability = useDeleteMemberAvailability();
  const createMemberSpecialDate = useCreateMemberSpecialDate();
  const deleteMemberSpecialDate = useDeleteMemberSpecialDate();

  // Mutations para organización
  const createOrgAvailability = useCreateOrganizationAvailability();
  const deleteOrgAvailability = useDeleteOrganizationAvailability();
  const createOrgSpecialDate = useCreateOrganizationSpecialDate();
  const deleteOrgSpecialDate = useDeleteOrganizationSpecialDate();

  const selectedMember = members?.find(m => m.id === targetMemberId);
  const canEditMember = isAdmin || targetMemberId === profile?.id;
  const canEditOrganization = isAdmin;

  const handleAddMemberAvailability = async (data: any) => {
    if (targetMemberId) {
      await createMemberAvailability.mutateAsync({
        ...data,
        member_id: targetMemberId,
      });
    }
  };

  const handleAddMemberSpecialDate = async (data: any) => {
    if (targetMemberId) {
      await createMemberSpecialDate.mutateAsync({
        ...data,
        member_id: targetMemberId,
      });
    }
  };

  if (loadingMemberAvailability || loadingMemberSpecialDates || loadingOrgAvailability || loadingOrgSpecialDates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Disponibilidad</h1>
          <p className="text-gray-600 mt-1">
            Configura los horarios de trabajo y fechas especiales
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Horarios Semanales</p>
                <p className="text-2xl font-bold text-gray-900">{memberAvailability.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fechas Especiales</p>
                <p className="text-2xl font-bold text-gray-900">{memberSpecialDates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Horarios Globales</p>
                <p className="text-2xl font-bold text-gray-900">{orgAvailability.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Miembros Activos</p>
                <p className="text-2xl font-bold text-gray-900">{members?.filter(m => m.is_active).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="member" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="member" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Disponibilidad de Miembros
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Disponibilidad Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="member" className="space-y-6">
          {/* Member Selection with Dropdown and Info */}
          {isAdmin && (
            <>
              <Card className="mb-6 bg-violet-50 border border-violet-200 rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pt-5 pb-4 px-5">
                  <div className="p-2.5 bg-violet-100 rounded-lg mt-0.5">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">Seleccionar Miembro</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      Elige un miembro del equipo para gestionar su disponibilidad
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-5 px-5">
                  <Select
                    value={selectedMemberId}
                    onValueChange={(value) => setSelectedMemberId(value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300 hover:border-gray-400 focus:ring-violet-500 text-gray-700">
                      <SelectValue placeholder="Selecciona un miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} - {member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedMember && (
                <Card className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-base font-semibold text-violet-600">
                        {selectedMember.first_name?.[0]?.toUpperCase()}{selectedMember.last_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {selectedMember.first_name} {selectedMember.last_name}
                        </h3>
                        <span 
                          className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${selectedMember.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {selectedMember.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{selectedMember.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Member Availability - Changed to grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyAvailability
              availability={memberAvailability}
              onAdd={handleAddMemberAvailability}
              onDelete={(id) => deleteMemberAvailability.mutate(id)}
              title="Disponibilidad Semanal"
              description="Define los horarios semanales regulares del miembro"
              canEdit={canEditMember}
            />

            <SpecialDates
              specialDates={memberSpecialDates}
              onAdd={handleAddMemberSpecialDate}
              onDelete={(id) => deleteMemberSpecialDate.mutate(id)}
              title="Fechas Especiales"
              description="Excepciones y días especiales para este miembro"
              canEdit={canEditMember}
            />
          </div>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          {!canEditOrganization && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-900">Solo lectura</h3>
                    <p className="text-sm text-amber-700">
                      Solo los administradores pueden editar la disponibilidad global de la organización.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Availability - Changed to grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyAvailability
              availability={orgAvailability}
              onAdd={(data) => createOrgAvailability.mutate(data)}
              onDelete={(id) => deleteOrgAvailability.mutate(id)}
              title="Disponibilidad Global Semanal"
              description="Horarios generales de la organización que afectan a todos los miembros"
              canEdit={canEditOrganization}
            />

            <SpecialDates
              specialDates={orgSpecialDates}
              onAdd={(data) => createOrgSpecialDate.mutate(data)}
              onDelete={(id) => deleteOrgSpecialDate.mutate(id)}
              title="Fechas Especiales Globales"
              description="Días festivos, cierres y excepciones que afectan a toda la organización"
              canEdit={canEditOrganization}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
