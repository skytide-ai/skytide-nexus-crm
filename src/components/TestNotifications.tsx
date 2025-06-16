import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarPlus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function TestNotifications() {
  const { profile } = useAuth();

  const createTestAppointment = async () => {
    if (!profile?.organization_id) {
      toast.error('No hay organización válida');
      return;
    }

    try {
      // Obtener el primer contacto disponible
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .limit(1);

      if (!contacts || contacts.length === 0) {
        toast.error('No hay contactos disponibles para crear una cita de prueba');
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          organization_id: profile.organization_id,
          contact_id: contacts[0].id,
          appointment_date: new Date().toISOString().split('T')[0],
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'programada',
          notes: 'Cita de prueba para notificaciones',
          created_by: profile.id,
        });

      if (error) throw error;

      toast.success('Cita de prueba creada exitosamente');
    } catch (error) {
      console.error('Error creando cita de prueba:', error);
      toast.error('Error al crear la cita de prueba');
    }
  };

  const updateTestAppointment = async () => {
    if (!profile?.organization_id) {
      toast.error('No hay organización válida');
      return;
    }

    try {
      // Obtener la última cita para actualizar
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!appointments || appointments.length === 0) {
        toast.error('No hay citas disponibles para actualizar');
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'confirmada',
          notes: 'Cita confirmada - prueba de notificación',
        })
        .eq('id', appointments[0].id);

      if (error) throw error;

      toast.success('Cita actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando cita:', error);
      toast.error('Error al actualizar la cita');
    }
  };

  const deleteTestAppointment = async () => {
    if (!profile?.organization_id) {
      toast.error('No hay organización válida');
      return;
    }

    try {
      // Obtener la última cita para eliminar
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!appointments || appointments.length === 0) {
        toast.error('No hay citas disponibles para eliminar');
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointments[0].id);

      if (error) throw error;

      toast.success('Cita eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando cita:', error);
      toast.error('Error al eliminar la cita');
    }
  };

  if (!profile || profile.role !== 'superadmin') {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-dashed border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="text-orange-700 flex items-center gap-2">
          🧪 Prueba de Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-orange-600 mb-4">
          Componente temporal para probar el sistema de notificaciones. 
          Solo visible para superadmins.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={createTestAppointment}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <CalendarPlus className="h-4 w-4 mr-1" />
            Crear Cita
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={updateTestAppointment}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-1" />
            Actualizar Cita
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={deleteTestAppointment}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar Cita
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 