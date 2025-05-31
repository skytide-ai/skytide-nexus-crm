
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useMembers } from '@/hooks/useMembers';
import { useContacts, useCreateContact } from '@/hooks/useContacts';
import { format } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

export function CreateAppointmentDialog({ open, onOpenChange, selectedDate }: CreateAppointmentDialogProps) {
  const [step, setStep] = useState<'contact' | 'appointment'>('contact');
  const [searchContact, setSearchContact] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showCreateContact, setShowCreateContact] = useState(false);
  
  // Contact form data
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });

  // Appointment form data
  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    service_id: '',
    member_id: '',
    notes: '',
  });

  const createAppointment = useCreateAppointment();
  const createContact = useCreateContact();
  const { data: services = [] } = useServices();
  const { members } = useMembers();
  const { data: contacts = [] } = useContacts();

  // Filtrar contactos por búsqueda
  const filteredContacts = contacts.filter(contact =>
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchContact.toLowerCase()) ||
    contact.phone.includes(searchContact)
  );

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setStep('appointment');
  };

  const handleCreateContact = async () => {
    if (!contactForm.first_name || !contactForm.last_name || !contactForm.phone) {
      return;
    }

    try {
      const newContact = await createContact.mutateAsync({
        first_name: contactForm.first_name,
        last_name: contactForm.last_name,
        phone: contactForm.phone,
        country_code: '+57',
        email: contactForm.email,
      });
      
      setSelectedContact(newContact);
      setShowCreateContact(false);
      setStep('appointment');
      setContactForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
      });
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedContact || !appointmentForm.start_time || !appointmentForm.end_time) {
      return;
    }

    try {
      await createAppointment.mutateAsync({
        contact_id: selectedContact.id,
        appointment_date: appointmentForm.appointment_date,
        start_time: appointmentForm.start_time,
        end_time: appointmentForm.end_time,
        service_id: appointmentForm.service_id || undefined,
        member_id: appointmentForm.member_id || undefined,
        notes: appointmentForm.notes || undefined,
      });

      // Reset form
      setStep('contact');
      setSelectedContact(null);
      setSearchContact('');
      setAppointmentForm({
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
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

  const handleBack = () => {
    if (step === 'appointment') {
      setStep('contact');
      setSelectedContact(null);
    }
  };

  const resetDialog = () => {
    setStep('contact');
    setSelectedContact(null);
    setSearchContact('');
    setShowCreateContact(false);
    setContactForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
    });
    setAppointmentForm({
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      service_id: '',
      member_id: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            {step === 'contact' ? 'Selecciona o crea un contacto' : 'Configura los detalles de la cita'}
          </DialogDescription>
        </DialogHeader>

        {step === 'contact' && (
          <div className="space-y-4">
            {!showCreateContact ? (
              <>
                {/* Búsqueda de contactos */}
                <div className="space-y-2">
                  <Label>Buscar contacto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre o teléfono..."
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Lista de contactos */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{contact.phone}</p>
                        </div>
                        <Badge variant="outline">Seleccionar</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {searchContact && filteredContacts.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-600 mb-4">No se encontró el contacto</p>
                    <Button onClick={() => setShowCreateContact(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear nuevo contacto
                    </Button>
                  </div>
                )}

                {!searchContact && (
                  <div className="text-center py-4">
                    <Button onClick={() => setShowCreateContact(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear nuevo contacto
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Formulario de crear contacto */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={contactForm.first_name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellido *</Label>
                      <Input
                        id="last_name"
                        value={contactForm.last_name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateContact(false)}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleCreateContact}
                    disabled={createContact.isPending || !contactForm.first_name || !contactForm.last_name || !contactForm.phone}
                  >
                    {createContact.isPending ? 'Creando...' : 'Crear y Continuar'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'appointment' && selectedContact && (
          <div className="space-y-4">
            {/* Contacto seleccionado */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedContact.first_name} {selectedContact.last_name}</p>
              <p className="text-sm text-gray-600">{selectedContact.phone}</p>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Fecha de la Cita</Label>
              <Input
                id="appointment_date"
                type="date"
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                required
              />
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Hora de Inicio *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={appointmentForm.start_time}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">Hora de Fin *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={appointmentForm.end_time}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Servicio */}
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select value={appointmentForm.service_id} onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, service_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Miembro */}
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={appointmentForm.member_id} onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, member_id: value }))}>
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

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre la cita..."
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Volver
              </Button>
              <Button 
                onClick={handleCreateAppointment} 
                disabled={createAppointment.isPending || !appointmentForm.start_time || !appointmentForm.end_time}
              >
                {createAppointment.isPending ? 'Creando...' : 'Crear Cita'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
