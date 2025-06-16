import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMembers } from '@/hooks/useMembers';
import { useServices } from '@/hooks/useServices';
import { useContacts } from '@/hooks/useContacts';
import { useUpdateAppointment, useDeleteAppointment, useUpdateAppointmentStatus, AppointmentWithDetails } from '@/hooks/useAppointments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithDetails | null;
}

export function EditAppointmentDialog({ open, onOpenChange, appointment }: EditAppointmentDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<AppointmentWithDetails>>({
    contact_id: '',
    member_id: '',
    service_id: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'programada'
  });

  const { members } = useMembers();
  const { data: services = [] } = useServices();
  const { data: contacts = [] } = useContacts();
  const updateAppointment = useUpdateAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();

  // Inicializar el formulario cuando se abre el diálogo con los datos de la cita
  useEffect(() => {
    if (appointment && open) {
      setFormData({
        contact_id: appointment.contact_id,
        member_id: appointment.member_id,
        service_id: appointment.service_id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time.substring(0, 5),
        end_time: appointment.end_time.substring(0, 5),
        notes: appointment.notes,
        status: appointment.status
      });
    }
  }, [appointment, open]);

  // Filtrar servicios por miembro seleccionado
  const getAvailableServices = () => {
    if (!formData.member_id) {
      return services.filter(s => s.is_active);
    }
    
    return services.filter(s => 
      s.is_active && 
      s.assigned_members?.some(member => member.id === formData.member_id)
    );
  };

  // Calcular hora de fin automáticamente cuando cambia el servicio o la hora de inicio
  useEffect(() => {
    if (formData.service_id && formData.start_time) {
      const service = services.find(s => s.id === formData.service_id);
      if (service) {
        const startTime = new Date(`2000-01-01T${formData.start_time}:00`);
        const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
        const endTimeString = endTime.toTimeString().slice(0, 5);
        
        setFormData(prev => ({
          ...prev,
          end_time: endTimeString
        }));
      }
    }
  }, [formData.service_id, formData.start_time, services]);

  // Limpiar servicio seleccionado cuando cambia el miembro
  useEffect(() => {
    if (formData.member_id) {
      const availableServices = getAvailableServices();
      if (formData.service_id && !availableServices.find(s => s.id === formData.service_id)) {
        setFormData(prev => ({ ...prev, service_id: undefined }));
      }
    }
  }, [formData.member_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment) return;

    try {
      // Obtener solo los campos que han cambiado
      const changedFields = Object.entries(formData).reduce((acc, [key, value]) => {
        const appointmentKey = key as keyof typeof appointment;
        const formValue = value as typeof appointment[keyof typeof appointment];
        
        if (formValue !== appointment[appointmentKey]) {
          acc[key] = formValue;
        }
        return acc;
      }, {} as Partial<typeof formData>);

      // Si no hay cambios, cerrar el diálogo
      if (Object.keys(changedFields).length === 0) {
        onOpenChange(false);
        return;
      }

      // Si solo se está cambiando el estado, no validar otros campos
      if (Object.keys(changedFields).length === 1 && 'status' in changedFields) {
        await updateAppointment.mutateAsync({
          id: appointment.id,
          data: { status: changedFields.status }
        });
        onOpenChange(false);
        return;
      }

      // Para otros cambios, validar campos requeridos
      if (!formData.contact_id || !formData.start_time || !formData.end_time) {
        return;
      }

      await updateAppointment.mutateAsync({
        id: appointment.id,
        data: changedFields
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const availableServices = getAvailableServices();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="appointment_date">Fecha</Label>
            <Input
              id="appointment_date"
              type="date"
              value={formData.appointment_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="member_id">Profesional</Label>
            <Select
              value={formData.member_id || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter(m => m.is_active)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="service_id">Servicio</Label>
            <Select
              value={formData.service_id || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.member_id && availableServices.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Este miembro no tiene servicios asignados
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="start_time">Hora inicio</Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              required
            />
            {formData.service_id && formData.end_time && (
              <p className="text-sm text-gray-500 mt-1">
                Fin estimado: {formData.end_time.substring(0, 5)}
              </p>
            )}
          </div>

          <div>
            <Label>Contacto</Label>
            <Select
              value={formData.contact_id || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar contacto" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={formData.status || 'programada'}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="en_curso">En curso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="no_asistio">No asistió</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="button" 
                onClick={() => {
                  if (appointment && formData.status) {
                    updateStatus.mutate({
                      id: appointment.id,
                      status: formData.status
                    });
                  }
                }}
                disabled={updateStatus.isPending}
                className="whitespace-nowrap"
              >
                {updateStatus.isPending ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Puedes actualizar solo el estado sin modificar otros campos usando el botón "Actualizar Estado"</p>
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Información adicional..."
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateAppointment.isPending}>
                {updateAppointment.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la cita
            {appointment && ` con ${appointment.contacts.first_name} ${appointment.contacts.last_name} programada para el ${appointment.appointment_date} a las ${appointment.start_time}`}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              if (appointment) {
                deleteAppointment.mutate(appointment.id);
                onOpenChange(false);
              }
            }}
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
