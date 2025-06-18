import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Organization {
  id: string;
  name: string;
  webhook?: {
    id: string;
    message_outgoing_webhook_url: string;
  };
  email_config?: {
    id: string;
    is_enabled: boolean;
    send_time: string;
    timezone: string;
  };
}

const TIMEZONES = [
  { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
  { value: 'America/New_York', label: 'Nueva York (UTC-5/-4)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8/-7)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)' },
  { value: 'Europe/London', label: 'Londres (UTC+0/+1)' },
];

export default function Administration() {
  const queryClient = useQueryClient();
  const [editingWebhook, setEditingWebhook] = useState<{ [key: string]: string }>({});

  // Fetch organizations with their webhooks and email configs
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations-admin'],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          webhook:organization_webhooks (
            id,
            message_outgoing_webhook_url
          ),
          email_config:email_notifications_config (
            id,
            is_enabled,
            send_time,
            timezone
          )
        `)
        .order('name');

      if (error) throw error;
      return orgs as unknown as Organization[];
    }
  });

  // Update webhook mutation
  const { mutate: updateWebhook, isPending: isUpdatingWebhook } = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['organizations-admin'] });
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

  // Update email config mutation
  const { mutate: updateEmailConfig, isPending: isUpdatingEmail } = useMutation({
    mutationFn: async ({ 
      organizationId, 
      isEnabled, 
      sendTime, 
      timezone 
    }: { 
      organizationId: string; 
      isEnabled?: boolean;
      sendTime?: string;
      timezone?: string;
    }) => {
      // Check if config exists
      const { data: existing } = await supabase
        .from('email_notifications_config')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

      const updateData: any = {};
      if (isEnabled !== undefined) updateData.is_enabled = isEnabled;
      if (sendTime !== undefined) updateData.send_time = sendTime;
      if (timezone !== undefined) updateData.timezone = timezone;

      if (existing) {
        // Update existing config
        const { error } = await supabase
          .from('email_notifications_config')
          .update(updateData)
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        // Create new config
        const { error } = await supabase
          .from('email_notifications_config')
          .insert({
            organization_id: organizationId,
            is_enabled: isEnabled ?? true,
            send_time: sendTime ?? '18:00:00',
            timezone: timezone ?? 'America/Bogota'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-admin'] });
      toast({
        title: 'Configuración actualizada',
        description: 'La configuración de emails se ha actualizado correctamente.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar configuración',
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

  const handleToggleEmail = (organizationId: string, currentEnabled: boolean) => {
    updateEmailConfig({ 
      organizationId, 
      isEnabled: !currentEnabled 
    });
  };

  const handleTimeChange = (organizationId: string, time: string) => {
    updateEmailConfig({ 
      organizationId, 
      sendTime: time + ':00' 
    });
  };

  const handleTimezoneChange = (organizationId: string, timezone: string) => {
    updateEmailConfig({ 
      organizationId, 
      timezone 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '18:00';
    return timeString.substring(0, 5); // Remove seconds
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
          <TabsTrigger value="email-notifications">Notificaciones Email</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Configuración de Webhooks</h3>
                <p className="text-sm text-muted-foreground">
                  Configura las URLs de webhook para la mensajería de cada organización
                </p>
              </div>
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
                      <TableCell className="font-medium">{org.name}</TableCell>
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
                          disabled={isUpdatingWebhook}
                          size="sm"
                        >
                          Actualizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="email-notifications" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Notificaciones por Email</h3>
                <p className="text-sm text-muted-foreground">
                  Configura el envío automático de notificaciones diarias para cada organización
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead className="w-[120px]">Hora de Envío</TableHead>
                    <TableHead className="w-[200px]">Zona Horaria</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations?.map((org) => {
                    const config = org.email_config;
                    const isEnabled = config?.is_enabled ?? true;
                    const sendTime = config?.send_time ?? '18:00:00';
                    const timezone = config?.timezone ?? 'America/Bogota';

                    return (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleToggleEmail(org.id, isEnabled)}
                              disabled={isUpdatingEmail}
                            />
                            <Badge variant={isEnabled ? 'default' : 'secondary'}>
                              {isEnabled ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={formatTime(sendTime)}
                            onChange={(e) => handleTimeChange(org.id, e.target.value)}
                            disabled={isUpdatingEmail || !isEnabled}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={timezone}
                            onValueChange={(value) => handleTimezoneChange(org.id, value)}
                            disabled={isUpdatingEmail || !isEnabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {isEnabled && (
                              <Badge variant="outline" className="text-xs">
                                {formatTime(sendTime)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
