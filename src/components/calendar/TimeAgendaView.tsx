
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const activeMembers = members.filter(m => m.is_active);

  // Get appointments for a specific member and time slot
  const getAppointmentsForSlot = (memberId: string, timeSlot: string) => {
    return appointments.filter(appointment => {
      if (appointment.member_id !== memberId) return false;
      
      const appointmentStart = appointment.start_time;
      const appointmentEnd = appointment.end_time;
      const slotTime = timeSlot;
      
      // Check if appointment overlaps with this time slot
      return appointmentStart <= slotTime && appointmentEnd > slotTime;
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
    
    return null;
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header with member names */}
      <div className="grid grid-cols-[80px_1fr] border-b bg-gray-50">
        <div className="p-3 border-r bg-gray-100">
          <span className="text-sm font-medium text-gray-600">Hora</span>
        </div>
        <div className={cn("grid", `grid-cols-${activeMembers.length}`)}>
          {activeMembers.map((member) => (
            <div key={member.id} className="p-3 border-r last:border-r-0 text-center">
              <div className="font-medium text-sm">
                {member.first_name} {member.last_name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map((timeSlot, index) => (
          <div key={timeSlot} className="grid grid-cols-[80px_1fr] border-b last:border-b-0 min-h-[60px]">
            {/* Time column */}
            <div className="p-2 border-r bg-gray-50 flex items-start">
              <span className="text-sm text-gray-600 font-mono">{timeSlot}</span>
            </div>
            
            {/* Member columns */}
            <div className={cn("grid", `grid-cols-${activeMembers.length}`)}>
              {activeMembers.map((member) => {
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
                          <Badge className={cn("mt-1 text-xs", status.color.replace('border-l-', 'bg-').replace('100', '200'))}>
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
