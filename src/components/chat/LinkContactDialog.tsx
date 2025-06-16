import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/chat';
import { useUpdateChatIdentity } from '@/hooks/useChat';
import { Link } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

interface LinkContactDialogProps {
  chatIdentityId: string;
  platformUserId: string;
  onLinked?: () => void;
}

export function LinkContactDialog({
  chatIdentityId,
  platformUserId,
  onLinked
}: LinkContactDialogProps) {
  const { organization } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { mutate: updateChatIdentity } = useUpdateChatIdentity();

  const { data: contacts } = useQuery({
    queryKey: ['contacts', organization?.id, search],
    queryFn: async () => {
      if (!organization?.id) return [];

      const query = supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('organization_id', organization.id)
        .order('first_name');

      if (search) {
        query.or(`
          first_name.ilike.%${search}%,
          last_name.ilike.%${search}%,
          email.ilike.%${search}%,
          phone.ilike.%${search}%
        `);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!organization?.id
  });

  const handleLinkContact = (contact: Contact) => {
    updateChatIdentity({
      chatIdentityId,
      data: { contact_id: contact.id }
    }, {
      onSuccess: () => {
        setOpen(false);
        onLinked?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Link className="h-4 w-4" />
          <span>Vincular</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular contacto</DialogTitle>
          <DialogDescription>
            Vincula este chat ({platformUserId}) con un contacto existente
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="p-4 space-y-2">
            {contacts?.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleLinkContact(contact)}
                className="w-full p-3 text-left hover:bg-accent rounded-lg"
              >
                <p className="font-medium">
                  {contact.first_name} {contact.last_name}
                </p>
                {contact.email && (
                  <p className="text-sm text-muted-foreground">
                    {contact.email}
                  </p>
                )}
                {contact.phone && (
                  <p className="text-sm text-muted-foreground">
                    {contact.phone}
                  </p>
                )}
              </button>
            ))}

            {contacts?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron contactos
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
