
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Users } from 'lucide-react';
import { AppointmentWithDetails } from '@/hooks/useAppointments';
import { MemberProfile } from '@/types/member';
import { cn } from '@/lib/utils';

interface TimeAgendaViewProps {
  appointments: AppointmentWithDetails[];
  members: MemberProfile[];
  selectedDate: Date;
}

const statusConfig = {
  programada: { label: 'Programada', color: 'bg-blue-100 text-blue-800 border-l-blue-500' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-l-green-500' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-l-red-500' },
  no_asistida: { label: 'No asistió', color: 'bg-orange-100 text-orange-800 border-l-orange-500' },
  en_curso: { label: 'En curso', color: 'bg-purple-100 text-purple-800 border-l-purple-500' },
  completada: { label: 'Completada', color: 'bg-gray-100 text-gray-800 border-l-gray-500' },
};

export function TimeAgendaView({ appointments, members, selectedDate }: TimeAgendaViewProps) {
  const activeMembers = members.filter(m => m.is_active);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    activeMembers.map(m => m.id)
  );
  const [showMemberFilter, setShowMemberFilter] = useState(false);

  console.log('TimeAgendaView - appointments:', appointments);
  console.log('TimeAgendaView - selectedDate:', selectedDate);

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const visibleMembers = activeMembers.filter(m => selectedMembers.includes(m.id));

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

  // Get appointments for a specific member and time slot
  const getAppointmentsForSlot = (memberId: string, timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    return appointments.filter(appointment => {
      if (appointment.member_id !== memberId) return false;
      
      console.log('Checking appointment:', {
        id: appointment.id,
        member_id: appointment.member_id,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        timeSlot,
        slotHour
      });
      
      const startTime = appointment.start_time;
      const endTime = appointment.end_time;
      
      // Parse start and end times
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      // Check if appointment starts in this hour slot or spans through it
      const appointmentStartsInSlot = startHour === slotHour;
      const appointmentSpansSlot = startHour < slotHour && endHour > slotHour;
      
      console.log('Slot check:', {
        appointmentStartsInSlot,
        appointmentSpansSlot,
        startHour,
        endHour,
        slotHour
      });
      
      return appointmentStartsInSlot || appointmentSpansSlot;
    });
  };

  // Calculate appointment position and height
  const getAppointmentStyle = (appointment: AppointmentWithDetails, timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const startTime = appointment.start_time;
    const endTime = appointment.end_time;
    
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    
    // Calculate if this appointment should be shown in this time slot
    if (startHour === slotHour) {
      const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      const height = Math.max(40, (durationMinutes / 60) * 60); // 60px per hour, minimum 40px
      const top = (startMinute / 60) * 60; // Position within the hour
      
      return {
        position: 'absolute' as const,
        top: `${top}px`,
        height: `${height}px`,
        width: 'calc(100% - 8px)',
        left: '4px',
        zIndex: 10,
      };
    }
    
    // If appointment spans through this slot but doesn't start here
    if (startHour < slotHour && endHour > slotHour) {
      return {
        position: 'absolute' as const,
        top: '0px',
        height: '60px', // Full hour height
        width: 'calc(100% - 8px)',
        left: '4px',
        zIndex: 10,
      };
    }
    
    return null;
  };

  if (visibleMembers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay miembros seleccionados
          </h3>
          <p className="text-gray-600 mb-4">
            Selecciona al menos un miembro para ver las citas
          </p>
          <Button onClick={() => setShowMemberFilter(!showMemberFilter)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrar Miembros
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Member Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowMemberFilter(!showMemberFilter)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showMemberFilter ? 'Ocultar' : 'Filtros'}
            </Button>
          </div>
        </CardHeader>
        {showMemberFilter && (
          <CardContent className="pt-0">
            <div className="space-y-3">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
            </div>
          </CardContent>
        )}
      </Card>

      {/* Time Agenda */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Header with member names */}
        <div className="grid border-b bg-gray-50" style={{ gridTemplateColumns: `80px repeat(${visibleMembers.length}, 1fr)` }}>
          <div className="p-3 border-r bg-gray-100">
            <span className="text-sm font-medium text-gray-600">Hora</span>
          </div>
          {visibleMembers.map((member) => (
            <div key={member.id} className="p-3 border-r last:border-r-0 text-center">
              <div className="font-medium text-sm">
                {member.first_name} {member.last_name}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="grid border-b last:border-b-0 min-h-[60px]" style={{ gridTemplateColumns: `80px repeat(${visibleMembers.length}, 1fr)` }}>
              {/* Time column */}
              <div className="p-2 border-r bg-gray-50 flex items-start">
                <span className="text-sm text-gray-600 font-mono">{timeSlot}</span>
              </div>
              
              {/* Member columns */}
              {visibleMembers.map((member) => {
                const slotAppointments = getAppointmentsForSlot(member.id, timeSlot);
                
                return (
                  <div key={member.id} className="border-r last:border-r-0 relative min-h-[60px] p-1">
                    {slotAppointments.map((appointment) => {
                      const style = getAppointmentStyle(appointment, timeSlot);
                      if (!style) return null;
                      
                      const status = statusConfig[appointment.status];
                      
                      return (
                        <div
                          key={appointment.id}
                          style={style}
                          className={cn(
                            "rounded border-l-4 p-2 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                            status.color
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {appointment.contacts.first_name} {appointment.contacts.last_name}
                              </div>
                              <div className="text-gray-600 truncate">
                                {appointment.start_time} - {appointment.end_time}
                              </div>
                              {appointment.services && (
                                <div className="text-gray-600 truncate">
                                  {appointment.services.name}
                                </div>
                              )}
                            </div>
                            <Badge className={cn("text-xs shrink-0", status.color.replace('border-l-', 'bg-').replace('100', '200'))}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
