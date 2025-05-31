
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Briefcase } from 'lucide-react';
import { useContactAppointments } from '@/hooks/useContacts';

interface ContactAppointmentsProps {
  contactId: string;
}

export function ContactAppointments({ contactId }: ContactAppointmentsProps) {
  const { data: appointments = [], isLoading } = useContactAppointments(contactId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'programada': return 'bg-blue-100 text-blue-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'completada': return 'bg-gray-100 text-gray-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      case 'no_asistio': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'programada': return 'Programada';
      case 'confirmada': return 'Confirmada';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      case 'no_asistio': return 'No Asistió';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (isLoading) {
    return <div>Cargando citas...</div>;
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay citas registradas</h3>
          <p className="text-gray-600">Las citas programadas aparecerán aquí</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <Card key={appointment.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                  <Clock className="h-4 w-4 text-gray-400 ml-2" />
                  <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                </div>

                {appointment.services && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{appointment.services.name}</span>
                  </div>
                )}

                {appointment.profiles && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {appointment.profiles.first_name} {appointment.profiles.last_name}
                    </span>
                  </div>
                )}

                {appointment.notes && (
                  <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                )}
              </div>

              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
