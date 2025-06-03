import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Wrench, MoreVertical, Phone, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppointmentWithDetails } from '@/hooks/useAppointments';
import { useUpdateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
import { EditAppointmentDialog } from './EditAppointmentDialog';

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  variant?: 'card' | 'list';
}

const statusConfig = {
  programada: { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  no_asistida: { label: 'No asistió', color: 'bg-orange-100 text-orange-800' },
  en_curso: { label: 'En curso', color: 'bg-purple-100 text-purple-800' },
  completada: { label: 'Completada', color: 'bg-gray-100 text-gray-800' },
};

export function AppointmentCard({ appointment, variant = 'card' }: AppointmentCardProps) {
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusChange = (status: keyof typeof statusConfig) => {
    updateAppointment.mutate({
      id: appointment.id,
      data: { status }
    });
  };

  const handleDelete = () => {
    deleteAppointment.mutate(appointment.id);
  };

  const status = statusConfig[appointment.status];

  return (
    <>
      {variant === 'list' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-900">
              {appointment.start_time} - {appointment.end_time}
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {appointment.contacts.first_name} {appointment.contacts.last_name}
              </span>
            </div>
            {appointment.services && (
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{appointment.services.name}</span>
              </div>
            )}
            {appointment.profiles && (
              <div className="text-sm text-gray-600">
                con {appointment.profiles.first_name} {appointment.profiles.last_name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.color}>
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStatusChange(key as keyof typeof statusConfig)}
                    disabled={updateAppointment.isPending}
                  >
                    {config.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar cita
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar cita
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        <div className="p-3 border rounded-lg space-y-2 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">
                {appointment.start_time} - {appointment.end_time}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStatusChange(key as keyof typeof statusConfig)}
                    disabled={updateAppointment.isPending}
                  >
                    {config.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar cita
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar cita
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">
                {appointment.contacts.first_name} {appointment.contacts.last_name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{appointment.contacts.phone}</span>
            </div>

            {appointment.services && (
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{appointment.services.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Badge className={status.color}>
              {status.label}
            </Badge>
            {appointment.notes && (
              <span className="text-xs text-gray-500 truncate max-w-[100px]">
                {appointment.notes}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Diálogo de edición */}
      <EditAppointmentDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        appointment={appointment} 
      />

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cita con {appointment.contacts.first_name} {appointment.contacts.last_name} programada para el {appointment.appointment_date} a las {appointment.start_time}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAppointment.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
