
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteService, Service } from '@/hooks/useServices';

interface DeleteServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteServiceDialog({ service, open, onOpenChange }: DeleteServiceDialogProps) {
  const deleteService = useDeleteService();

  const handleDelete = async () => {
    try {
      await deleteService.mutateAsync(service.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar el servicio "{service.name}". Esta acción no se puede deshacer.
            {service.assigned_members && service.assigned_members.length > 0 && (
              <span className="block mt-2 font-medium text-orange-600">
                Advertencia: Este servicio tiene {service.assigned_members.length} miembro(s) asignado(s).
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteService.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteService.isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
