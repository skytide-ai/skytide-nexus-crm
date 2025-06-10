import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useFunnelContacts } from '@/hooks/useFunnelContacts';
import { useFunnels } from '@/hooks/useFunnels';
import { Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { FunnelStageColumn } from './components/FunnelStageColumn';
import { FunnelStageDialog } from './components/FunnelStageDialog';
import { AddContactToFunnelDialog } from './components/AddContactToFunnelDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Funnel, FunnelContact, FunnelStage } from '@/types/funnel';
import { ContactCard } from './components/ContactCard';

export default function FunnelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { funnels } = useFunnels();
  const { stages, isLoading: isLoadingStages, deleteStage, updateStagePositions } = useFunnelStages(id);
  const { contacts, isLoading: isLoadingContacts, updateContactPositions, addContactsToStage } = useFunnelContacts(id);

  // Cast to array to fix typing issues from react-query
  const typedFunnels = useMemo(() => (funnels as Funnel[]) || [], [funnels]);
  const typedContacts = (contacts ?? []) as FunnelContact[];
  const typedStages = (stages ?? []) as FunnelStage[];

  const funnel = useMemo(() => typedFunnels.find(f => f.id === id), [typedFunnels, id]);

  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<FunnelStage | undefined>(undefined);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [activeDraggedFunnelContact, setActiveDraggedFunnelContact] = useState<FunnelContact | null>(null);

  const handleAddContactsToFunnel = (contactIds: string[], stageId: string) => {
    if (!id) {
      console.error('Funnel ID is missing');
      // Consider showing an error toast to the user
      return;
    }
    addContactsToStage.mutate(
      { contactIds, stageId },
      {
        onSuccess: () => {
          setIsAddContactDialogOpen(false); // Close dialog on success
        },
        // onError: (error) => { /* Handle error, e.g., show toast */ }
      }
    );
  };

  const handleAddNewStage = () => {
    setSelectedStage(undefined);
    setIsStageDialogOpen(true);
  };

  const handleEditStage = (stage: FunnelStage) => {
    setSelectedStage(stage);
    setIsStageDialogOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    // Aquí podrías agregar un diálogo de confirmación si lo deseas
    deleteStage.mutate(stageId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Contact') {
      const contact = typedContacts.find(c => c.id === active.id);
      if (contact) {
        setActiveDraggedFunnelContact(contact);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDraggedFunnelContact(null);
    const { active, over } = event;

    if (!over) return;

    if (active.data.current?.type === 'Contact' && over.data.current?.type === 'Stage') {
      const activeContact = active.data.current.contact as FunnelContact;
      const overStage = over.data.current.stage as FunnelStage;

      if (activeContact.stage_id === overStage.id) return;

      // Encontrar la mayor posición en la etapa de destino
      const maxPosition = typedContacts
        .filter(c => c.stage_id === overStage.id)
        .reduce((max, contact) => Math.max(max, contact.position), -1);
      
      // Nueva posición: una después de la máxima encontrada
      const newPosition = maxPosition + 1;

      updateContactPositions.mutate([{
        id: activeContact.id,
        stage_id: overStage.id,
        position: newPosition,
        contact_id: activeContact.contact_id,
        funnel_id: id!,
      }]);
    }
  };

  if (isLoadingStages || isLoadingContacts) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 h-full flex flex-col max-w-[1400px] mx-auto">
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{funnel?.name}</h1>
          <p className="text-muted-foreground text-lg">{funnel?.description || 'Sin descripción'}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button 
            onClick={() => setIsAddContactDialogOpen(true)} 
            variant="outline"
            size="lg"
            className="h-10"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Agregar Contacto
          </Button>
          <Button 
            onClick={handleAddNewStage}
            size="lg"
            className="h-10"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Etapa
          </Button>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          {/* SortableContext para etapas eliminado ya que no se reordenan etapas */}
          <div className="flex gap-4 overflow-x-auto flex-grow pb-6 h-full px-1">
          {typedStages.map((stage: FunnelStage) => (
            <FunnelStageColumn
              key={stage.id}
              stage={stage}
              contacts={typedContacts.filter(c => c.stage_id === stage.id)}
              onEdit={handleEditStage}
              onDelete={handleDeleteStage}
            />
          ))}
          </div>
        <DragOverlay>
          {activeDraggedFunnelContact ? (
            <ContactCard contact={activeDraggedFunnelContact} /> // Podríamos necesitar un prop isOverlay aquí si el estilo interfiere
          ) : null}
        </DragOverlay>
      </DndContext>

      <FunnelStageDialog
        open={isStageDialogOpen}
        onOpenChange={setIsStageDialogOpen}
        funnelId={id!}
        stage={selectedStage}
        stagesCount={typedStages.length}
      />

      {id && (
        <AddContactToFunnelDialog
          open={isAddContactDialogOpen}
          onOpenChange={setIsAddContactDialogOpen}
          funnelId={id}
          stages={typedStages}
          onAddContacts={handleAddContactsToFunnel}
        />
      )}
    </div>
  );
}
