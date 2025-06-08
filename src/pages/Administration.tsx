import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Organization {
  id: string;
  name: string;
  webhook?: {
    id: string;
    message_outgoing_webhook_url: string;
  };
}

export default function Administration() {
  const queryClient = useQueryClient();
  const [editingWebhook, setEditingWebhook] = useState<{ [key: string]: string }>({});

  // Fetch organizations with their webhooks
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations-webhooks'],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          webhook:organization_webhooks (
            id,
            message_outgoing_webhook_url
          )
        `)
        .order('name');

      if (error) throw error;
      return orgs as unknown as Organization[];
    }
  });

  // Update webhook mutation
  const { mutate: updateWebhook, isPending: isUpdating } = useMutation({
    mutationFn: async ({ 
      organizationId, 
      webhookUrl 
    }: { 
      organizationId: string; 
      webhookUrl: string;
    }) => {
      // First check if webhook exists
      const { data: existing } = await supabase
        .from('organization_webhooks')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

      if (existing) {
        // Update existing webhook
        const { error } = await supabase
          .from('organization_webhooks')
          .update({ message_outgoing_webhook_url: webhookUrl })
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        // Create new webhook
        const { error } = await supabase
          .from('organization_webhooks')
          .insert({
            organization_id: organizationId,
            message_outgoing_webhook_url: webhookUrl
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations-webhooks'] });
      setEditingWebhook(prev => ({
        ...prev,
        [variables.organizationId]: ''
      }));
      toast({
        title: 'Webhook actualizado',
        description: 'La URL del webhook se ha actualizado correctamente.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar webhook',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleUpdateWebhook = (organizationId: string) => {
    const webhookUrl = editingWebhook[organizationId];
    if (!webhookUrl) return;

    try {
      // Basic URL validation
      new URL(webhookUrl);
      updateWebhook({ organizationId, webhookUrl });
    } catch (e) {
      toast({
        title: 'URL inválida',
        description: 'Por favor ingresa una URL válida',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
        <p className="text-muted-foreground mt-2">
          Panel de administración para superadmins
        </p>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organización</TableHead>
                  <TableHead>URL del Webhook</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>
                      <Input
                        value={
                          editingWebhook[org.id] !== undefined
                            ? editingWebhook[org.id]
                            : org.webhook?.message_outgoing_webhook_url || ''
                        }
                        onChange={(e) =>
                          setEditingWebhook(prev => ({
                            ...prev,
                            [org.id]: e.target.value
                          }))
                        }
                        placeholder="https://ejemplo.com/webhook"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleUpdateWebhook(org.id)}
                        disabled={isUpdating}
                        size="sm"
                      >
                        Actualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
