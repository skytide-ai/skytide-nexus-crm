import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        console.log('No token provided');
        setError('Token de invitación no válido');
        setLoading(false);
        return;
      }

      console.log('Validating invitation with token:', token);

      try {
        // Use admin client to validate the token without logging in the user
        const { data, error } = await supabase.functions.invoke('validate-invitation-token', {
          body: { token }
        });

        if (error) {
          console.error('Error validating invitation:', error);
          setError('El enlace de invitación ha expirado o no es válido');
          setLoading(false);
          return;
        }

        if (data?.email) {
          setEmail(data.email);
          setInvitationData(data);
          console.log('Invitation is valid for email:', data.email);
        } else {
          setError('No se pudo obtener información de la invitación');
          setLoading(false);
          return;
        }

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
    
    if (!email || !invitationData) {
      setError('No se encontró información de la invitación');
      return;
    }
    
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
      // First accept the invitation with the token and password
      const { data: acceptData, error: acceptError } = await supabase.functions.invoke('accept-invitation', {
        body: { 
          token,
          password,
          email
        }
      });

      if (acceptError) {
        console.error('Error accepting invitation:', acceptError);
        setError('Error al aceptar la invitación: ' + acceptError.message);
        return;
      }

      // Now sign in with the email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Error signing in after invitation:', signInError);
        setError('La invitación fue aceptada pero hubo un error al iniciar sesión. Intenta iniciar sesión manualmente.');
        // Still show success since the invitation was accepted
        toast({
          title: "Invitación aceptada",
          description: "Tu cuenta ha sido creada. Puedes iniciar sesión con tu email y contraseña.",
        });
        navigate('/auth');
        return;
      }

      toast({
        title: "¡Invitación aceptada exitosamente!",
        description: "Bienvenido a la organización. Ya puedes acceder al sistema.",
      });

      // Redirect to the main page
      navigate('/');

    } catch (err: any) {
      console.error('Unexpected error during invitation acceptance:', err);
      setError('Error inesperado al aceptar la invitación');
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

  if (error && !email) {
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
            Has sido invitado a unirte como miembro de la organización. Establece una contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
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
                  Aceptando invitación...
                </>
              ) : (
                'Aceptar Invitación'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
