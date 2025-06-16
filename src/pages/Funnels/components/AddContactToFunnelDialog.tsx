import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FunnelStage } from '@/types/funnel';
import { Contact } from '@/types/contact'; // Contact type is defined in contact.ts
import { useContacts } from '@/hooks/useContacts'; // Hook to fetch all contacts

interface AddContactToFunnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelId: string;
  stages: FunnelStage[];
  onAddContacts: (contactIds: string[], stageId: string) => void; // Callback to handle adding contacts
}

export function AddContactToFunnelDialog({ open, onOpenChange, funnelId, stages, onAddContacts }: AddContactToFunnelDialogProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(stages.length > 0 ? stages[0].id : undefined);
  
  const { data: contactsData, isLoading: isLoadingContacts } = useContacts();
  const contacts: Contact[] = contactsData || [];

  useEffect(() => {
    if (stages.length > 0 && !selectedStageId) {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId]);

  const handleContactToggle = (contactId: string) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSubmit = () => {
    if (selectedContactIds.length > 0 && selectedStageId) {
      onAddContacts(selectedContactIds, selectedStageId);
      onOpenChange(false);
      setSelectedContactIds([]);
    } else {
      // TODO: Show some validation error
      console.error('No contacts or stage selected');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Agregar Contactos al Embudo</DialogTitle>
          <DialogDescription>
            Selecciona los contactos que deseas agregar y la etapa de destino.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium col-span-1">Etapa Destino</span>
            <Select value={selectedStageId} onValueChange={setSelectedStageId} disabled={stages.length === 0}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-2">
            <span className="text-sm font-medium">Seleccionar Contactos</span>
            {isLoadingContacts ? (
              <p>Cargando contactos...</p>
            ) : (
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={() => handleContactToggle(contact.id)}
                    />
                    <label
                      htmlFor={`contact-${contact.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {contact.first_name} {contact.last_name} ({contact.email})
                    </label>
                  </div>
                ))}
                {contacts.length === 0 && <p className="text-sm text-muted-foreground">No hay contactos disponibles.</p>}
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={selectedContactIds.length === 0 || !selectedStageId}>
            Agregar Contactos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
