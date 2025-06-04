import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditAppointmentDialog } from "./EditAppointmentDialog";
import { AppointmentWithDetails } from '@/hooks/useAppointments';
import { MemberProfile } from '@/types/member';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';

interface WeekAgendaViewProps {
  appointments: AppointmentWithDetails[];
  selectedDate: Date;
  members: MemberProfile[];
  selectedMemberId?: string;
  onMemberChange: (memberId: string) => void;
}

const statusConfig = {
  programada: { label: 'Programada', color: 'bg-gray-100 text-gray-800 border-l-gray-500' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-l-green-500' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-l-red-500' },
  no_asistio: { label: 'No asistió', color: 'bg-orange-100 text-orange-800 border-l-orange-500' },
  en_curso: { label: 'En curso', color: 'bg-purple-100 text-purple-800 border-l-purple-500' },
  completada: { label: 'Completada', color: 'bg-blue-100 text-blue-800 border-l-blue-500' },
};

const BOGOTA_TIMEZONE = 'America/Bogota';

export function WeekAgendaView({ appointments, selectedDate, members, selectedMemberId, onMemberChange }: WeekAgendaViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  // Get the start and end of the week for the selected date
  const weekStart = startOfWeek(selectedDate, { locale: es });
  const weekEnd = endOfWeek(selectedDate, { locale: es });
  
  // Get all days of the week
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate time slots from 4 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 4; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get current time in Bogota timezone
  const getCurrentTimeInfo = () => {
    const now = new Date();
    const currentTimeInBogota = formatInTimeZone(now, BOGOTA_TIMEZONE, 'HH:mm');
    const [currentHour, currentMinute] = currentTimeInBogota.split(':').map(Number);
    
    return {
      currentTime: currentTimeInBogota,
      currentHour,
      currentMinute,
      shouldShowLine: currentHour >= 4 && currentHour <= 22
    };
  };

  const currentTimeInfo = getCurrentTimeInfo();

  // Calculate position for current time line
  const getCurrentTimePosition = (timeSlot: string) => {
    const slotHour = parseInt(timeSlot.split(':')[0]);
    if (slotHour === currentTimeInfo.currentHour) {
      return (currentTimeInfo.currentMinute / 60) * 84; // 84px per hour
    }
    return null;
  };

  // Get appointments for a specific day and time slot
  const getAppointmentsForSlot = (date: Date, timeSlot: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    return appointments.filter(appointment => {
      if (appointment.appointment_date !== dateStr) return false;
      
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
    const startTime = appointment.start_time;
    const endTime = appointment.end_time;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    if (startHour > slotHour || endHour < slotHour) return null;
    
    const top = startHour === slotHour ? (startMinute / 60) * 84 : 0;
    const height = endHour === slotHour 
      ? (endMinute / 60) * 84 - top - 4 // -4px para margen inferior
      : 84 - top - 4; // -4px para margen inferior
    
    return {
      position: 'absolute' as const,
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px',
    };
  };

  // Filtrar citas por miembro seleccionado
  const filteredAppointments = selectedMemberId
    ? appointments.filter(app => app.member_id === selectedMemberId)
    : appointments;

  // Encontrar el miembro seleccionado
  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;

  return (
    <div className="space-y-4">
      {/* Encabezado con imagen de perfil y nombre del profesional */}
      {selectedMember && (
        <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow mb-4">
          <Avatar className="h-12 w-12 mr-3">
            <AvatarImage src={selectedMember.avatar_url || ''} alt={`${selectedMember.first_name} ${selectedMember.last_name}`} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-medium">
            {selectedMember.first_name} {selectedMember.last_name}
          </h3>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${daysOfWeek.length}, 1fr)` }}>
            {/* Header row with days */}
            <div className="sticky top-0 z-30 bg-background border-b">
              <div className="h-14 border-r flex items-center justify-center bg-gray-50">
                <span className="text-sm text-gray-500 font-medium">Hora</span>
              </div>
            </div>

            {daysOfWeek.map((date) => (
              <div key={format(date, 'yyyy-MM-dd')} className="sticky top-0 z-30 bg-background border-b border-r last:border-r-0">
                <div className={cn(
                  "h-14 p-2 flex flex-col justify-center",
                  isToday(date) && "bg-primary/5"
                )}>
                  <div className="text-sm font-medium">
                    {format(date, 'EEEE', { locale: es })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(date, 'd MMM', { locale: es })}
                  </div>
                </div>
              </div>
            ))}

            {/* Time slots */}
            <div className="max-h-[600px] overflow-y-auto col-span-full">
              <div className="grid" style={{ gridTemplateColumns: `80px repeat(${daysOfWeek.length}, 1fr)` }}>
                {timeSlots.map((timeSlot) => {
                  const currentTimePosition = getCurrentTimePosition(timeSlot);
                  
                  return (
                    <React.Fragment key={timeSlot}>
                      {/* Time column */}
                      <div className="p-2 border-r border-b bg-gray-50 flex items-start relative min-h-[84px]">
                        <span className="text-sm text-gray-600 font-mono">{timeSlot}</span>
                        {/* Current time indicator in time column */}
                        {currentTimeInfo.shouldShowLine && currentTimePosition !== null && (
                          <div 
                            className="absolute right-0 w-2 h-0.5 bg-red-500 z-20"
                            style={{ top: `${currentTimePosition + 8}px` }}
                          />
                        )}
                      </div>
                      
                      {/* Day columns */}
                      {daysOfWeek.map((date) => {
                        const slotAppointments = getAppointmentsForSlot(date, timeSlot)
                          .filter(app => !selectedMemberId || app.member_id === selectedMemberId);
                        
                        return (
                          <div 
                            key={`${format(date, 'yyyy-MM-dd')}-${timeSlot}`} 
                            className={cn(
                              "border-r last:border-r-0 border-b relative min-h-[84px] p-2",
                              isToday(date) && "bg-primary/5"
                            )}
                          >
                            {/* Current time line */}
                            {currentTimeInfo.shouldShowLine && isToday(date) && currentTimePosition !== null && (
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
                                  className={cn(
                                    "absolute rounded border-l-4 p-2 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow z-10 overflow-hidden hover:overflow-visible hover:min-h-fit group my-0.5",
                                    status.color
                                  )}
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowEditDialog(true);
                                  }}
                                  onMouseEnter={(e) => {
                                    const element = e.currentTarget;
                                    element.style.zIndex = '20';
                                  }}
                                  onMouseLeave={(e) => {
                                    const element = e.currentTarget;
                                    element.style.zIndex = '10';
                                  }}
                                >
                                  <div className="flex flex-col gap-1.5 min-w-0">
                                    <div className="w-full">
                                      <div className="font-medium text-gray-900 truncate group-hover:whitespace-normal group-hover:break-words leading-tight text-xs">
                                        {appointment.contacts.first_name} {appointment.contacts.last_name}
                                      </div>
                                      <div className="text-gray-600 truncate text-[10px] leading-none">
                                        {appointment.start_time} - {appointment.end_time}
                                      </div>
                                      {appointment.services && (
                                        <div className="text-gray-600 truncate text-[10px] leading-none">
                                          {appointment.services.name}
                                        </div>
                                      )}
                                    </div>
                                    <Badge className={cn("text-[10px] shrink-0 mt-1", 
                                      appointment.status === 'programada' ? 'bg-gray-400 text-white' :
                                      appointment.status === 'no_asistio' ? 'bg-orange-400 text-white' :
                                      status.color.replace('border-l-', 'bg-').replace('100', '200')
                                    )}>
                                      {status.label}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Modal de edición */}
        {selectedAppointment && (
          <EditAppointmentDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            appointment={selectedAppointment}
          />
        )}
      </Card>
    </div>
  );
}
