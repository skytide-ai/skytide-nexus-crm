
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  expires_at: string;
}

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Token de invitación no válido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('member_invitations')
          .select('*')
          .eq('token', token)
          .eq('used', false)
          .single();

        if (error) {
          console.error('Error fetching invitation:', error);
          setError('Invitación no encontrada o ya utilizada');
          setLoading(false);
          return;
        }

        // Check if invitation has expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        if (expiresAt <= now) {
          setError('Esta invitación ha expirado');
          setLoading(false);
          return;
        }

        setInvitation(data);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Error al validar la invitación');
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            organization_id: invitation.organization_id,
          }
        }
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        setError('Error al crear la cuenta: ' + signUpError.message);
        return;
      }

      if (!authData.user) {
        setError('Error al crear la cuenta');
        return;
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('member_invitations')
        .update({ used: true, updated_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        // Don't return here - user is created, just log the error
      }

      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Bienvenido a la organización. Ya puedes acceder al sistema.",
      });

      // Redirect to the main page
      navigate('/');

    } catch (err: any) {
      console.error('Unexpected error during signup:', err);
      setError('Error inesperado al crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Validando invitación...</span>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceptar Invitación</CardTitle>
          <CardDescription>
            Has sido invitado a unirte como <strong>{invitation?.first_name} {invitation?.last_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
