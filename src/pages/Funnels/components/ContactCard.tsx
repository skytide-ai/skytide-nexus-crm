import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FunnelContact } from '@/types/funnel';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactCardProps {
  contact: FunnelContact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: contact.id,
    data: {
      type: 'Contact',
      contact,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!contact.contact) {
    return null; // Or a loading placeholder
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className={cn(
        "group mb-2 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing border",
        isDragging && "ring-2 ring-primary ring-offset-2"
      )}>
        <div className="p-3 flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {contact.contact.first_name?.[0]}{contact.contact.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">
                {contact.contact.first_name} {contact.contact.last_name}
              </h4>
              <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-1 space-y-0.5">
              {contact.contact.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{contact.contact.email}</span>
                </p>
              )}
              {contact.contact.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{contact.contact.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
