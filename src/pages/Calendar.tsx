
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Plus, List, Grid, ChevronLeft, ChevronRight, Users, Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Funciones de utilidad para manejar fechas
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const startOfWeek = (date: Date, options?: { locale: any }): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // ajustar cuando el día es domingo
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date: Date, options?: { locale: any }): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() + (day === 0 ? 0 : 7 - day); // ajustar cuando el día es domingo
  result.setDate(diff);
  result.setHours(23, 59, 59, 999);
  return result;
};
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppointments } from '@/hooks/useAppointments';
import { useMembers } from '@/hooks/useMembers';
import { AppointmentCard } from '@/components/calendar/AppointmentCard';
import { CreateAppointmentDialog } from '@/components/calendar/CreateAppointmentDialog';
import { TimeAgendaView } from '@/components/calendar/TimeAgendaView';
import { cn } from '@/lib/utils';
import { WeekAgendaView } from '@/components/calendar/WeekAgendaView';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'agenda' | 'list' | 'week'>('agenda');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: appointments = [], isLoading } = useAppointments({ date: selectedDate, viewMode });
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
      {/* Header: Title, Description, Badge, and View Mode Buttons */}
      <div className="flex items-start justify-between">
        {/* Left Side: Title, Badge, Description */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
            <Badge className="bg-indigo-100 text-indigo-700 flex items-center gap-1 px-2 py-1 text-sm">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="font-semibold">{filteredAppointments.length}</span>
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Gestiona las citas y agenda
          </p>
        </div>

        {/* Right Side: View Mode Buttons */}
        <div className="border rounded-lg p-1 flex items-center gap-1 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('agenda')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm",
              viewMode === 'agenda' 
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Grid className="h-4 w-4" />
            Día
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm",
              viewMode === 'week' 
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" 
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            Semana
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm",
              viewMode === 'list' 
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" 
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
        </div>
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
                  onClick={() => setSelectedDate(subDays(selectedDate, viewMode === 'week' ? 7 : 1))}
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
                  onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'week' ? 7 : 1))}
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
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {viewMode === 'week' ? (
                      format(startOfWeek(selectedDate, { locale: es }), "d 'de' MMMM", { locale: es }) +
                      " - " +
                      format(endOfWeek(selectedDate, { locale: es }), "d 'de' MMMM", { locale: es })
                    ) : (
                      format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Member Filter - Different for each view */}
          {viewMode === 'agenda' ? (
            <Card className="overflow-hidden border-border/40 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3 bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Filtrar por Miembros
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    {selectedMembers.length} de {activeMembers.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-3 border-b bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={toggleAllMembers}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedMembers.length === activeMembers.length ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'}`}>
                        {selectedMembers.length === activeMembers.length && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-sm font-medium">Seleccionar todos</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{activeMembers.length}</Badge>
                  </div>
                </div>
                <div className="divide-y max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  {activeMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className={`flex items-center justify-between p-2.5 hover:bg-muted/10 transition-colors cursor-pointer ${selectedMembers.includes(member.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleMember(member.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedMembers.includes(member.id) ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'}`}>
                          {selectedMembers.includes(member.id) && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 bg-muted">
                            <AvatarFallback className="text-xs font-medium">{member.first_name.charAt(0)}{member.last_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.first_name} {member.last_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 py-3 border-t text-center font-medium">
                  {selectedMembers.length} de {activeMembers.length} seleccionados
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'week' ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Profesional</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                  value={selectedMembers.length === 1 ? selectedMembers[0] : ''}
                  onChange={(e) => setSelectedMembers(e.target.value ? [e.target.value] : [])}
                >
                  <option value="">Todos los profesionales</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          ) : null}

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
          {viewMode === 'week' ? (
            <WeekAgendaView
              appointments={appointments}
              selectedDate={selectedDate}
              members={members}
              selectedMemberId={viewMode === 'week' ? selectedMembers[0] : undefined}
              onMemberChange={(memberId) => setSelectedMembers(memberId ? [memberId] : [])}
            />
          ) : viewMode === 'agenda' ? (
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
