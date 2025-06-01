
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Plus, List, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppointments } from '@/hooks/useAppointments';
import { useMembers } from '@/hooks/useMembers';
import { AppointmentCard } from '@/components/calendar/AppointmentCard';
import { CreateAppointmentDialog } from '@/components/calendar/CreateAppointmentDialog';
import { TimeAgendaView } from '@/components/calendar/TimeAgendaView';
import { cn } from '@/lib/utils';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'agenda' | 'list'>('agenda');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: appointments = [], isLoading } = useAppointments(selectedDate);
  const { members } = useMembers();

  const activeMembers = members.filter(m => m.is_active);

  // Initialize selected members when members are loaded
  React.useEffect(() => {
    if (activeMembers.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(activeMembers.map(m => m.id));
    }
  }, [activeMembers, selectedMembers.length]);

  // Filtrar citas por miembros seleccionados
  const filteredAppointments = appointments.filter(appointment => 
    selectedMembers.length === 0 || selectedMembers.includes(appointment.member_id || '')
  );

  // Toggle member selection
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Select/deselect all members
  const toggleAllMembers = () => {
    setSelectedMembers(prev => 
      prev.length === activeMembers.length ? [] : activeMembers.map(m => m.id)
    );
  };

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
      {/* Header - Full Width */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-semibold">{filteredAppointments.length}</span>
          </Badge>
        </div>
        <p className="text-gray-600">
          Gestiona las citas y agenda del día
        </p>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Left Sidebar with Controls */}
        <div className="w-80 space-y-6">
          {/* Date Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Fecha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoy
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Date Display */}
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'EEEE', { locale: es })}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {format(selectedDate, 'd')}
                </div>
                <div className="text-sm text-gray-600">
                  {format(selectedDate, 'MMMM yyyy', { locale: es })}
                </div>
              </div>

              {/* Calendar Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Seleccionar fecha
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
            </CardContent>
          </Card>

          {/* View Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Vista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={viewMode === 'agenda' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('agenda')}
                  className="h-10"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Agenda
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-10"
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Member Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filtrar por Miembros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedMembers.length === activeMembers.length}
                  onCheckedChange={toggleAllMembers}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Seleccionar todos ({activeMembers.length})
                </label>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <label htmlFor={member.id} className="text-sm">
                      {member.first_name} {member.last_name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t">
                {selectedMembers.length} de {activeMembers.length} seleccionados
              </div>
            </CardContent>
          </Card>

          {/* New Appointment Button */}
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="w-full flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {viewMode === 'agenda' ? (
            filteredAppointments.length === 0 ? (
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
            ) : (
              <TimeAgendaView 
                appointments={filteredAppointments}
                members={members}
                selectedDate={selectedDate}
                selectedMembers={selectedMembers}
                showMemberFilter={false}
              />
            )
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
        </div>
      </div>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        selectedDate={selectedDate}
      />
    </div>
  );
}
