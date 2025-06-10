
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, Phone, Mail, MapPin, Calendar, FileText, 
  Paperclip, Clock, Edit, Trash2, Plus 
} from 'lucide-react';
import type { Contact } from '@/types/contact';
import { useContactNotes, useContactFiles, useContactAppointments } from '@/hooks/useContacts';
import { ContactNotes } from './ContactNotes';
import { ContactFiles } from './ContactFiles';
import { ContactAppointments } from './ContactAppointments';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { ContactDialog } from './ContactDialog';

interface ContactDetailDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailDialog({ contact, open, onOpenChange }: ContactDetailDialogProps) {
  const [showCreateAppointment, setShowCreateAppointment] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const { data: notes = [] } = useContactNotes(contact.id);
  const { data: files = [] } = useContactFiles(contact.id);
  const { data: appointments = [] } = useContactAppointments(contact.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'masculino': return 'Masculino';
      case 'femenino': return 'Femenino';
      case 'otro': return 'Otro';
      case 'prefiero_no_decir': return 'Prefiere no decir';
      default: return 'No especificado';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {contact.first_name[0]}{contact.last_name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{contact.first_name} {contact.last_name}</h2>
                  <p className="text-sm text-gray-600">Cliente desde {formatDate(contact.created_at)}</p>
                </div>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditContact(true);
                }} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Información
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notas ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Archivos ({files.length})
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Citas ({appointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información de Contacto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{contact.country_code} {contact.phone}</span>
                    </div>
                    
                    {contact.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    
                    {contact.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{contact.address}</span>
                      </div>
                    )}
                    
                    {contact.city && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">Ciudad:</span>
                        <span>{contact.city}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Información Personal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contact.age && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{contact.age} años</span>
                      </div>
                    )}
                    
                    {contact.birth_date && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">Nacimiento:</span>
                        <span>{formatDate(contact.birth_date)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">Género:</span>
                      <Badge variant="outline">{getGenderLabel(contact.gender)}</Badge>
                    </div>
                    
                    {contact.document_type && contact.document_number && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{contact.document_type}:</span>
                        <span>{contact.document_number}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <ContactNotes contactId={contact.id} />
            </TabsContent>

            <TabsContent value="files">
              <ContactFiles contactId={contact.id} />
            </TabsContent>

            <TabsContent value="appointments">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Historial de Citas</h3>
                  <Button onClick={() => setShowCreateAppointment(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Cita
                  </Button>
                </div>
                <ContactAppointments contactId={contact.id} />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreateAppointmentDialog
        contact={contact}
        open={showCreateAppointment}
        onOpenChange={setShowCreateAppointment}
      />

      <ContactDialog
        contact={contact}
        open={showEditContact}
        onOpenChange={setShowEditContact}
      />
    </>
  );
}
