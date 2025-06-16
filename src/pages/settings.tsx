import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Key, Shield, User, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Settings() {
  const { profile, updateProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Estados para el formulario de perfil
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || '');

  // Estados para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Función para actualizar el perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile({
        first_name: firstName,
        last_name: lastName,
      });

      if (error) {
        toast({
          title: "Error al actualizar perfil",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada correctamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar tu perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar la contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error al cambiar contraseña",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido actualizada correctamente",
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Ocurrió un error al cambiar tu contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar la cuenta
  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'ELIMINAR') {
      toast({
        title: "Error",
        description: "Por favor escribe ELIMINAR para confirmar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Primero eliminamos el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile?.id);

      if (profileError) {
        throw profileError;
      }

      // Luego eliminamos la cuenta de autenticación
      const { error: authError } = await supabase.auth.admin.deleteUser(
        profile?.id || ''
      );

      if (authError) {
        throw authError;
      }

      // Cerramos sesión
      await signOut();

      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar cuenta",
        description: error.message || "Ocurrió un error al eliminar tu cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteAccountDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Configuración de Cuenta
        </h1>
        <p className="text-gray-600 mt-1">
          Administra tu información personal y preferencias
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Zona Peligrosa
          </TabsTrigger>
        </TabsList>

        {/* Tab de Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal y de contacto
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-gray-500">
                    El correo electrónico no se puede cambiar
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {profile?.role === 'superadmin'
                        ? 'Super Administrador'
                        : profile?.role === 'admin'
                        ? 'Administrador'
                        : 'Miembro'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab de Seguridad */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Recomendaciones</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Usa una contraseña segura con al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y símbolos.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab de Zona Peligrosa */}
        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardHeader className="border-b border-red-100">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Zona Peligrosa
              </CardTitle>
              <CardDescription>
                Acciones que pueden afectar permanentemente tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  Las acciones en esta sección son irreversibles. Procede con precaución.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Cuenta</h3>
                  <p className="text-gray-600 mb-4">
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                  </p>
                  <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Eliminar mi cuenta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600">¿Estás seguro?</DialogTitle>
                        <DialogDescription>
                          Esta acción es irreversible. Se eliminarán permanentemente todos tus datos, incluyendo tu perfil, configuraciones y acceso al sistema.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="font-medium mb-2">Para confirmar, escribe "ELIMINAR":</p>
                        <Input
                          value={confirmDeleteText}
                          onChange={(e) => setConfirmDeleteText(e.target.value)}
                          placeholder="ELIMINAR"
                          className="border-red-300"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteAccountDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={loading || confirmDeleteText !== 'ELIMINAR'}
                        >
                          {loading ? 'Eliminando...' : 'Eliminar Permanentemente'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
