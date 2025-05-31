
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'form' | 'creating' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de invitación no encontrado en la URL.');
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(
        `https://fyyzaysmpephomhmudxt.supabase.co/functions/v1/accept-invitation?token=${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Error validating invitation:', data);
        setStatus('error');
        setMessage(data.error || 'Error al validar la invitación. Por favor, verifica el enlace.');
        return;
      }

      if (data.valid) {
        setInvitation(data.invitation);
        setStatus('form');
      } else {
        setStatus('error');
        setMessage(data.error || 'Invitación inválida.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setMessage('Error de conexión. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setStatus('creating');
    setMessage('');

    try {
      const response = await fetch(
        'https://fyyzaysmpephomhmudxt.supabase.co/functions/v1/accept-invitation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Error accepting invitation:', data);
        setStatus('form');
        setMessage(data.error || 'Error al crear la cuenta');
        return;
      }

      if (data.success) {
        setStatus('success');
        setMessage('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth?message=account_created');
        }, 3000);
      } else {
        setStatus('form');
        setMessage(data.error || 'Error al crear la cuenta.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('form');
      setMessage('Error de conexión. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
            <CardTitle className="text-2xl font-bold">Aceptar Invitación</CardTitle>
            <CardDescription>
              {status === 'form' && invitation ? 
                `Crear cuenta para ${invitation.organizationName}` :
                'Procesando tu invitación...'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Validando invitación...</span>
              </div>
            )}

            {status === 'form' && invitation && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={invitation.firstName}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={invitation.lastName}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu contraseña"
                    required
                  />
                </div>

                {message && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={status === 'creating'}>
                  {status === 'creating' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </form>
            )}

            {status === 'creating' && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Creando tu cuenta...</span>
              </div>
            )}

            {status === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {(status === 'error' || status === 'success') && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Ir al formulario de acceso
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
