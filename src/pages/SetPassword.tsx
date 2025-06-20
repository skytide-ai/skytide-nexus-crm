
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const passwordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string } | null>(null);
  const [hasValidTokens, setHasValidTokens] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    console.log('SetPassword: Checking for tokens in URL');
    
    // Extraer tokens del hash de la URL SIN hacer login automático
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    console.log('SetPassword: Found tokens?', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

    if (accessToken && refreshToken) {
      console.log('SetPassword: Storing tokens for later use');
      setTokens({ access_token: accessToken, refresh_token: refreshToken });
      setHasValidTokens(true);
      
      // Limpiar la URL del hash pero mantener los tokens en memoria
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log('SetPassword: No valid tokens found, redirecting to auth');
      // Si no hay tokens válidos, redirigir al login
      toast({
        title: "Error",
        description: "Enlace de invitación inválido o expirado",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [navigate, toast]);

  const onSubmit = async (data: PasswordFormData) => {
    if (!tokens) {
      toast({
        title: "Error",
        description: "Tokens de sesión no encontrados",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('SetPassword: Setting session with stored tokens');
      
      // Primero establecer la sesión con los tokens almacenados
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      if (sessionError) {
        console.error('SetPassword: Session error:', sessionError);
        toast({
          title: "Error",
          description: "Error al establecer la sesión: " + sessionError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('SetPassword: Session established, updating password');

      // Ahora actualizar la contraseña del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        console.error('SetPassword: Update error:', updateError);
        toast({
          title: "Error",
          description: "Error al actualizar la contraseña: " + updateError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('SetPassword: Password updated successfully');

      toast({
        title: "Contraseña establecida",
        description: "Tu contraseña ha sido establecida correctamente. Bienvenido al sistema.",
      });

      // Redirigir al dashboard
      navigate('/');
    } catch (error: any) {
      console.error('SetPassword: Unexpected error:', error);
      toast({
        title: "Error",
        description: "Error al establecer la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Si no tenemos tokens válidos, mostrar loading hasta que se redirija
  if (!hasValidTokens) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando enlace de invitación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Establece tu contraseña</CardTitle>
          <CardDescription>
            Para completar tu registro, por favor establece una contraseña segura para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa tu nueva contraseña"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirma tu nueva contraseña"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estableciendo contraseña...
                  </>
                ) : (
                  'Establecer contraseña'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
