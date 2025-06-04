
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Calendar } from 'lucide-react';
import { useContactNotes, useCreateContactNote } from '@/hooks/useContacts';

interface ContactNotesProps {
  contactId: string;
}

export function ContactNotes({ contactId }: ContactNotesProps) {
  const [newNote, setNewNote] = useState('');
  const { data: notes = [], isLoading } = useContactNotes(contactId);
  const createNote = useCreateContactNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote.mutateAsync({
        contact_id: contactId,
        note: newNote.trim(),
      });
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO');
  };

  if (isLoading) {
    return <div>Cargando notas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add new note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Nueva Nota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Escribe una nota sobre este contacto..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddNote} 
              disabled={!newNote.trim() || createNote.isPending}
            >
              {createNote.isPending ? 'Guardando...' : 'Agregar Nota'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay notas aún</h3>
            <p className="text-gray-600">Agrega la primera nota sobre este contacto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-gray-900 whitespace-pre-wrap">{note.note}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
