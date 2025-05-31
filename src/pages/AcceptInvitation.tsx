
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if this is a recovery link from Supabase
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (type === 'recovery' && accessToken && refreshToken) {
      // This is a password recovery link from our invitation system
      setStatus('success');
      setMessage('Redirigiendo al formulario de contraseña...');
      
      // Redirect to the auth page where Supabase will handle the password reset
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } else {
      // Invalid or missing parameters
      setStatus('error');
      setMessage('Enlace de invitación inválido o expirado. Por favor, solicita una nueva invitación.');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Invitación de Miembro</CardTitle>
            <CardDescription>
              Procesando tu invitación...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status !== 'loading' && (
              <div className="text-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Ir al formulario de acceso
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
