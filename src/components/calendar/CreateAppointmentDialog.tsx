
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
import { useCreateAppointment, CreateAppointmentData } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

export function CreateAppointmentDialog({ open, onOpenChange, selectedDate }: CreateAppointmentDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateAppointmentData>>({
    appointment_date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    notes: '',
    status: 'programada'
  });
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [newContactData, setNewContactData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  const { members } = useMembers();
  const { data: services = [] } = useServices();
  const { data: contacts = [] } = useContacts();
  const createAppointment = useCreateAppointment();

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
    
    if (!formData.contact_id || !formData.member_id || !formData.start_time || !formData.end_time) {
      return;
    }

    try {
      await createAppointment.mutateAsync(formData as CreateAppointmentData);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '10:00',
      notes: '',
      status: 'programada'
    });
    setShowCreateContact(false);
    setNewContactData({
      first_name: '',
      last_name: '',
      phone: '',
      email: ''
    });
  };

  const availableServices = getAvailableServices();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Miembro</Label>
            <Select
              value={formData.member_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar miembro" />
              </SelectTrigger>
              <SelectContent>
                {members.filter(m => m.is_active).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Servicio</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio (opcional)" />
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
              value={formData.start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              required
            />
            {formData.service_id && formData.end_time && (
              <p className="text-sm text-gray-500 mt-1">
                Fin estimado: {formData.end_time}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Contacto</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateContact(!showCreateContact)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear nuevo
              </Button>
            </div>
            
            {!showCreateContact ? (
              <Select
                value={formData.contact_id}
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
            ) : (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre"
                    value={newContactData.first_name}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                  <Input
                    placeholder="Apellido"
                    value={newContactData.last_name}
                    onChange={(e) => setNewContactData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Teléfono"
                  value={newContactData.phone}
                  onChange={(e) => setNewContactData(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email (opcional)"
                  type="email"
                  value={newContactData.email}
                  onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Información adicional..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAppointment.isPending}>
              {createAppointment.isPending ? 'Creando...' : 'Crear Cita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
