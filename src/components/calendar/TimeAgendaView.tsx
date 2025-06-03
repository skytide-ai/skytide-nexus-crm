import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { AppointmentWithDetails } from '@/hooks/useAppointments';
import { MemberProfile } from '@/types/member';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { EditAppointmentDialog } from './EditAppointmentDialog';

interface TimeAgendaViewProps {
  appointments: AppointmentWithDetails[];
  members: MemberProfile[];
  selectedDate: Date;
  selectedMembers: string[];
  showMemberFilter?: boolean;
}

interface EditDialogState {
  isOpen: boolean;
  appointment: AppointmentWithDetails | null;
}

const statusConfig = {
  programada: { label: 'Programada', color: 'bg-blue-100 text-blue-800 border-l-blue-500' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-l-green-500' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-l-red-500' },
  no_asistida: { label: 'No asistió', color: 'bg-orange-100 text-orange-800 border-l-orange-500' },
  en_curso: { label: 'En curso', color: 'bg-purple-100 text-purple-800 border-l-purple-500' },
  completada: { label: 'Completada', color: 'bg-gray-100 text-gray-800 border-l-gray-500' },
};

const BOGOTA_TIMEZONE = 'America/Bogota';

export function TimeAgendaView({ 
  appointments, 
  members, 
  selectedDate, 
  selectedMembers,
  showMemberFilter = true 
}: TimeAgendaViewProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    isOpen: false,
    appointment: null
  });

  const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
    console.log('Clicked appointment:', appointment);
    setEditDialog({
      isOpen: true,
      appointment
    });
  };

  const activeMembers = members.filter(m => m.is_active);
  const visibleMembers = activeMembers.filter(m => selectedMembers.includes(m.id));

  console.log('TimeAgendaView - appointments:', appointments);
  console.log('TimeAgendaView - selectedDate:', selectedDate);
  console.log('TimeAgendaView - selectedMembers:', selectedMembers);
  console.log('TimeAgendaView - visibleMembers:', visibleMembers);

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get current time in Bogota timezone
  const getCurrentTimeInfo = () => {
    const now = new Date();
    const currentTimeInBogota = formatInTimeZone(now, BOGOTA_TIMEZONE, 'HH:mm');
    const isToday = isSameDay(now, selectedDate);
    
    const [currentHour, currentMinute] = currentTimeInBogota.split(':').map(Number);
    
    return {
      currentTime: currentTimeInBogota,
      currentHour,
      currentMinute,
      isToday,
      shouldShowLine: isToday && currentHour >= 6 && currentHour <= 22
    };
  };

  const currentTimeInfo = getCurrentTimeInfo();

  // Calculate position for current time line
  const getCurrentTimePosition = (timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    if (slotHour === currentTimeInfo.currentHour) {
      return (currentTimeInfo.currentMinute / 60) * 60; // 60px per hour
    }
    return null;
  };

  // Get appointments for a specific member and time slot
  const getAppointmentsForSlot = (memberId: string, timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    return appointments.filter(appointment => {
      if (appointment.member_id !== memberId) return false;
      
      const startTime = appointment.start_time;
      const endTime = appointment.end_time;
      
      // Parse start and end times
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      // Check if appointment starts in this hour slot or spans through it
      const appointmentStartsInSlot = startHour === slotHour;
      const appointmentSpansSlot = startHour < slotHour && endHour > slotHour;
      
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
            Selecciona al menos un miembro en los filtros para ver las citas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Agenda */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Member headers */}
        <div className="grid border-b" style={{ gridTemplateColumns: `80px repeat(${visibleMembers.length}, 1fr)` }}>
          <div className="p-2 border-r bg-gray-50">
            <span className="text-sm font-medium text-gray-600">Hora</span>
          </div>
          {visibleMembers.map((member) => (
            <div key={member.id} className="p-2 border-r last:border-r-0 text-center">
              <div className="flex flex-col items-center gap-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-gray-100 text-gray-800">
                    {member.first_name[0]}{member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium truncate text-sm">{member.first_name} {member.last_name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((timeSlot) => {
            const currentTimePosition = getCurrentTimePosition(timeSlot);
            
            return (
              <div key={timeSlot} className="grid border-b last:border-b-0 min-h-[60px]" style={{ gridTemplateColumns: `80px repeat(${visibleMembers.length}, 1fr)` }}>
                {/* Time column */}
                <div className="p-2 border-r bg-gray-50 flex items-start relative">
                  <span className="text-sm text-gray-600 font-mono">{timeSlot}</span>
                  {/* Current time indicator in time column */}
                  {currentTimeInfo.shouldShowLine && currentTimePosition !== null && (
                    <div 
                      className="absolute right-0 w-2 h-0.5 bg-red-500 z-20"
                      style={{ top: `${currentTimePosition + 8}px` }}
                    />
                  )}
                </div>
                
                {/* Member columns */}
                {visibleMembers.map((member) => {
                  const slotAppointments = getAppointmentsForSlot(member.id, timeSlot);
                  
                  return (
                    <div key={member.id} className="border-r last:border-r-0 relative min-h-[60px] p-1">
                      {/* Current time line across member columns */}
                      {currentTimeInfo.shouldShowLine && currentTimePosition !== null && (
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                          style={{ top: `${currentTimePosition}px` }}
                        />
                      )}
                      
                      {slotAppointments.map((appointment) => {
                        const style = getAppointmentStyle(appointment, timeSlot);
                        if (!style) return null;
                        
                        const status = statusConfig[appointment.status];
                        
                        return (
                          <div
                            key={appointment.id}
                            style={style}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(appointment);
                            }}
                            className={cn(
                              "rounded border-l-4 p-2 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                              status.color
                            )}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {appointment.contacts.first_name} {appointment.contacts.last_name}
                                </div>
                                <div className="text-gray-600 truncate text-xs">
                                  {appointment.start_time} - {appointment.end_time}
                                </div>
                                {appointment.services && (
                                  <div className="text-gray-600 truncate text-xs">
                                    {appointment.services.name}
                                  </div>
                                )}
                              </div>
                              <Badge className={cn("text-xs shrink-0 ml-1", status.color.replace('border-l-', 'bg-').replace('100', '200'))}>
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
            );
          })}
        </div>
      </div>

      {/* Diálogo de edición */}
      <EditAppointmentDialog
        open={editDialog.isOpen}
        onOpenChange={(open) => setEditDialog({ isOpen: open, appointment: open ? editDialog.appointment : null })}
        appointment={editDialog.appointment}
      />
    </div>
  );
}
