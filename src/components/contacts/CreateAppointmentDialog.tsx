
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAppointment } from '@/hooks/useContacts';
import { useServices } from '@/hooks/useServices';
import { useMembers } from '@/hooks/useMembers';
import type { Contact } from '@/types/contact';

interface CreateAppointmentDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAppointmentDialog({ contact, open, onOpenChange }: CreateAppointmentDialogProps) {
  const [formData, setFormData] = useState({
    appointment_date: '',
    start_time: '',
    end_time: '',
    service_id: '',
    member_id: '',
    notes: '',
  });

  const createAppointment = useCreateAppointment();
  const { data: services = [] } = useServices();
  const { members } = useMembers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appointment_date || !formData.start_time || !formData.end_time) {
      return;
    }

    const appointmentData = {
      contact_id: contact.id,
      appointment_date: formData.appointment_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      service_id: formData.service_id || undefined,
      member_id: formData.member_id || undefined,
      notes: formData.notes || undefined,
      status: 'programada' as const,
    };

    try {
      await createAppointment.mutateAsync(appointmentData);
      setFormData({
        appointment_date: '',
        start_time: '',
        end_time: '',
        service_id: '',
        member_id: '',
        notes: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            Crear una nueva cita para {contact.first_name} {contact.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appointment_date">Fecha de la Cita *</Label>
            <Input
              id="appointment_date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de Inicio *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de Fin *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Servicio</Label>
            <Select value={formData.service_id} onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {services.filter(s => s.is_active).map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Profesional</Label>
            <Select value={formData.member_id} onValueChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional (opcional)" />
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre la cita..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
