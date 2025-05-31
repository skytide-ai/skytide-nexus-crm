
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Webhook, Settings, Database, Mail, MessageSquare } from 'lucide-react';

export default function SystemAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600" />
          Administración del Sistema
        </h1>
        <p className="text-gray-600">Panel de control exclusivo para super administradores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gestión de Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-600" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Configurar webhooks para integraciones externas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gestionar Webhooks
            </Button>
          </CardContent>
        </Card>

        {/* Configuración Global */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Configuración Global
            </CardTitle>
            <CardDescription>
              Configuraciones del sistema y parámetros globales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Base de Datos
            </CardTitle>
            <CardDescription>
              Monitoreo y administración de la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Estadísticas
            </Button>
          </CardContent>
        </Card>

        {/* Gestión de Emails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-red-600" />
              Sistema de Emails
            </CardTitle>
            <CardDescription>
              Configurar templates y proveedores de email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Configurar Emails
            </Button>
          </CardContent>
        </Card>

        {/* Chat/IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              Sistema de Chat IA
            </CardTitle>
            <CardDescription>
              Configurar integraciones de IA y chatbots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Configurar IA
            </Button>
          </CardContent>
        </Card>

        {/* Logs del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600" />
              Logs del Sistema
            </CardTitle>
            <CardDescription>
              Ver logs de actividad y errores del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
