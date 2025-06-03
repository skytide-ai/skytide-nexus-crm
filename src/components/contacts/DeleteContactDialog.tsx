import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteContact } from '@/hooks/useContacts';
import type { Contact } from '@/types/contact';

interface DeleteContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteContactDialog({
  contact,
  open,
  onOpenChange,
  onDeleted,
}: DeleteContactDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteContact = useDeleteContact();

  const handleDelete = async () => {
    if (!contact) return;
    
    setIsDeleting(true);
    try {
      await deleteContact.mutateAsync(contact.id);
      onOpenChange(false);
      if (onDeleted) onDeleted();
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar contacto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar a {contact?.first_name} {contact?.last_name}?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
