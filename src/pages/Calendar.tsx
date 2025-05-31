
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, List, Grid, Filter } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppointments } from '@/hooks/useAppointments';
import { useMembers } from '@/hooks/useMembers';
import { AppointmentCard } from '@/components/calendar/AppointmentCard';
import { CreateAppointmentDialog } from '@/components/calendar/CreateAppointmentDialog';
import { cn } from '@/lib/utils';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'agenda' | 'list'>('agenda');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: appointments = [], isLoading } = useAppointments(selectedDate);
  const { members } = useMembers();

  // Filtrar citas por miembro seleccionado
  const filteredAppointments = appointments.filter(appointment => 
    selectedMember === 'all' || appointment.member_id === selectedMember
  );

  // Agrupar citas por miembro para vista agenda
  const appointmentsByMember = filteredAppointments.reduce((acc, appointment) => {
    const memberId = appointment.member_id || 'unassigned';
    if (!acc[memberId]) {
      acc[memberId] = [];
    }
    acc[memberId].push(appointment);
    return acc;
  }, {} as Record<string, any[]>);

  // Obtener nombre del miembro
  const getMemberName = (memberId: string) => {
    if (memberId === 'unassigned') return 'Sin asignar';
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Miembro no encontrado';
  };

  // Generar horas del día (de 6 AM a 10 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-semibold">{filteredAppointments.length}</span>
          </Badge>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <p className="text-gray-600 -mt-4">
        Gestiona las citas y agenda del día
      </p>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            ←
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPPP', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            →
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Hoy
          </Button>
        </div>

        {/* Filters and View Mode */}
        <div className="flex items-center gap-2">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por miembro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los miembros</SelectItem>
              {members.filter(m => m.is_active).map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'agenda' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('agenda')}
              className="h-8"
            >
              <Grid className="h-4 w-4 mr-1" />
              Agenda
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'agenda' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.keys(appointmentsByMember).length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay citas programadas
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No hay citas para la fecha seleccionada
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Cita
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            Object.entries(appointmentsByMember).map(([memberId, memberAppointments]) => (
              <Card key={memberId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {getMemberName(memberId)}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {memberAppointments.length} cita{memberAppointments.length !== 1 ? 's' : ''}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {memberAppointments
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay citas programadas
                </h3>
                <p className="text-gray-600 mb-4">
                  No hay citas para la fecha seleccionada
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Cita
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAppointments
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((appointment) => (
                    <div key={appointment.id} className="p-4">
                      <AppointmentCard appointment={appointment} variant="list" />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        selectedDate={selectedDate}
      />
    </div>
  );
}
