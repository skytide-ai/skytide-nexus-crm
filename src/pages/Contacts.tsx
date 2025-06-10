import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContactTags } from '@/components/contacts/ContactTags';
import { TagsFilter } from '@/components/contacts/TagsFilter';
import { useContactsByTags } from '@/hooks/useContactsByTags';
import { Plus, Search, Users, Phone, Mail, MapPin, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { CreateContactDialog } from '@/components/contacts/CreateContactDialog';
import { ContactDetailDialog } from '@/components/contacts/ContactDetailDialog';
import { EditContactDialog } from '@/components/contacts/EditContactDialog';
import { DeleteContactDialog } from '@/components/contacts/DeleteContactDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Contact } from '@/types/contact';

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const { data: allContacts = [], isLoading: isLoadingContacts } = useContacts();
  const { data: tagFilteredContacts = [], isLoading: isLoadingTagContacts } = useContactsByTags(selectedTagIds);

  const contacts = selectedTagIds.length > 0 ? tagFilteredContacts : allContacts;
  const isLoading = isLoadingContacts || isLoadingTagContacts;

  const filteredContacts = contacts.filter(contact =>
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Title, Description, and New Contact Button */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{contacts.length}</span>
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Gestiona tu base de datos de contactos y clientes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <TagsFilter
              selectedTagIds={selectedTagIds}
              onTagsChange={setSelectedTagIds}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredContacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron contactos' : 'No hay contactos aún'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer contacto'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Contacto
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold">{contact.first_name} {contact.last_name}</p>
                          {contact.age && (
                            <p className="text-sm text-gray-500">{contact.age} años</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{contact.country_code} {contact.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span className="truncate max-w-[200px]">{contact.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.city ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span>{contact.city}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ContactTags contactId={contact.id} />
                    </TableCell>
                    <TableCell>
                      {contact.document_type && contact.document_number ? (
                        <Badge variant="secondary" className="text-xs">
                          {contact.document_type}: {contact.document_number}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{formatDate(contact.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContact(contact)}
                          className="h-8 w-8 p-0"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setContactToEdit(contact)}
                          className="h-8 w-8 p-0"
                          title="Editar contacto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setContactToDelete(contact)}
                          className="h-8 w-8 p-0"
                          title="Eliminar contacto"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {selectedContact && (
        <ContactDetailDialog
          contact={selectedContact}
          open={!!selectedContact}
          onOpenChange={(open) => !open && setSelectedContact(null)}
        />
      )}

      {contactToEdit && (
        <EditContactDialog
          contact={contactToEdit}
          open={!!contactToEdit}
          onOpenChange={(open) => !open && setContactToEdit(null)}
        />
      )}

      {contactToDelete && (
        <DeleteContactDialog
          contact={contactToDelete}
          open={!!contactToDelete}
          onOpenChange={(open) => !open && setContactToDelete(null)}
        />
      )}
    </div>
  );
}
