
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization_name: string;
  invited_by_name: string;
  expires_at: string;
  used: boolean;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('member_invitations')
        .select(`
          *,
          organizations!inner(name),
          profiles!member_invitations_invited_by_fkey(first_name, last_name)
        `)
        .eq('token', token)
        .eq('used', false)
        .single();

      if (error || !data) {
        toast({
          title: "Invitación inválida",
          description: "La invitación no existe o ya ha sido utilizada",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Verificar si la invitación ha expirado
      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Invitación expirada",
          description: "Esta invitación ha expirado. Solicita una nueva invitación.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      setInvitation({
        ...data,
        organization_name: data.organizations.name,
        invited_by_name: `${data.profiles.first_name} ${data.profiles.last_name}`
      });

    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      toast({
        title: "Error",
        description: "Error al cargar la invitación",
        variant: "destructive",
      });
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Registrar usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.email,
        password,
        options: {
          data: {
            first_name: invitation!.first_name,
            last_name: invitation!.last_name,
            organization_id: invitation!.organization_id,
            invitation_token: token
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Marcar invitación como utilizada
      const { error: updateError } = await supabase
        .from('member_invitations')
        .update({ used: true })
        .eq('token', token);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
      }

      toast({
        title: "¡Bienvenido!",
        description: "Tu cuenta ha sido creada exitosamente. Ya puedes acceder al sistema.",
      });

      navigate('/');

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitación no válida</h2>
            <p className="text-gray-600 mb-4">Esta invitación no existe o ya ha sido utilizada.</p>
            <Button onClick={() => navigate('/auth')}>
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skytide</h1>
              <p className="text-sm text-gray-500">CRM</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            ¡Únete a {invitation.organization_name}!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {invitation.invited_by_name} te ha invitado a formar parte del equipo
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Completa tu registro</CardTitle>
            <CardDescription>
              Crea tu contraseña para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAcceptInvitation} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  value={`${invitation.first_name} ${invitation.last_name}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={invitation.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Organización</Label>
                <Input
                  value={invitation.organization_name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear mi cuenta
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿Tienes problemas? {' '}
            <button
              onClick={() => navigate('/auth')}
              className="text-blue-600 hover:text-blue-500"
            >
              Iniciar sesión con cuenta existente
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
