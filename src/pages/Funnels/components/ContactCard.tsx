import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FunnelContact } from '@/types/funnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold">
            {contact.contact.first_name} {contact.contact.last_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground">{contact.contact.email}</p>
          <p className="text-xs text-muted-foreground">{contact.contact.phone}</p>
        </CardContent>
      </Card>
    </div>
  );
}
