import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FunnelStage, FunnelContact } from '@/types/funnel';
import { ContactCard } from './ContactCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress-custom';
import { Pencil, Trash2, MoveRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    transition: 'all 0.2s ease',
    borderColor: stage.color,
    backgroundColor: isOver
      ? `${stage.color}10`
      : 'transparent',
  };

  const contactIds = React.useMemo(() => contacts.map(c => c.id), [contacts]);

  return (
    <div
      className={cn(
        "w-80 rounded-lg flex flex-col flex-shrink-0 h-full border-2 relative",
        "hover:shadow-md transition-all duration-200",
        isOver && "ring-2 ring-offset-2",
      )}
      style={columnStyle}
    >
      <div className="p-4 sticky top-0 bg-background z-10 rounded-t-lg border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {stage.name}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(stage);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(stage.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {contacts.length} contactos
          </span>
          {stage.position > 0 && (
            <span className="flex items-center gap-1.5">
              <MoveRight className="h-4 w-4" />
              {((contacts.length / (contacts.length + 2)) * 100).toFixed(1)}%
            </span>
          )}
        </div>
        <Progress 
          value={(contacts.length / (contacts.length + 2)) * 100} 
          className="h-2"
          indicatorClassName={cn(
            "transition-all duration-500",
            isOver && "animate-pulse"
          )}
          style={{ 
            backgroundColor: `${stage.color}20`,
          }}
          indicatorStyle={{
            backgroundColor: stage.color
          }}
        />
      </div>
      <ScrollArea ref={setDroppableNodeRef} className="flex-grow px-3 py-2">
        <SortableContext items={contactIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
          {contacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
            <div 
              className={cn(
                "flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg",
                "bg-muted/5 hover:bg-muted/10 transition-colors",
                isOver && "border-primary/50 bg-primary/5"
              )}
            >
              <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Arrastra contactos aquí</p>
              <p className="text-xs text-muted-foreground/75">o usa el botón de agregar arriba</p>
            </div>
          )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
