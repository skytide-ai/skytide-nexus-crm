import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FunnelStage, FunnelContact } from '@/types/funnel';
import { ContactCard } from './ContactCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface FunnelStageColumnProps {
  stage: FunnelStage;
  contacts: FunnelContact[];
  onEdit: (stage: FunnelStage) => void;
  onDelete: (stageId: string) => void;
}

export function FunnelStageColumn({ stage, contacts, onEdit, onDelete }: FunnelStageColumnProps) {
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'Stage',
      stage,
    },
  });

  const columnStyle = {
    backgroundColor: isOver ? '#e0e0e0' : '#f4f4f4',
    transition: 'background-color 0.2s ease',
  };

  const contactIds = React.useMemo(() => contacts.map(c => c.id), [contacts]);

  return (
    <div
      className="w-80 bg-muted/50 rounded-lg flex flex-col flex-shrink-0 h-full"
      style={columnStyle}

    >
      <div 
        className="p-3 font-semibold text-lg sticky top-0 bg-muted/50 z-10 rounded-t-lg flex justify-between items-center"
        style={{ borderBottom: `3px solid ${stage.color}` }}
      >
        <div className="flex items-center gap-2">
          <span>{stage.name} <span className="text-sm font-normal text-muted-foreground">({contacts.length})</span></span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(stage);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(stage.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea ref={setDroppableNodeRef} className="flex-grow p-3">
        <SortableContext items={contactIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
          {contacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md">
              <p className="text-sm text-muted-foreground">Arrastra contactos aquí</p>
            </div>
          )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
