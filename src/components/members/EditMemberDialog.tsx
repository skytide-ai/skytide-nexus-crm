import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MemberProfile } from '@/types/member';
import { useAuth } from '@/contexts/AuthContext';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberProfile;
  onUpdate: (memberId: string, updates: Partial<MemberProfile>) => void;
}

export const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  open,
  onOpenChange,
  member,
  onUpdate
}) => {
  const { toast } = useToast();
  const { organization, user, profile, updateProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member.avatar_url);
  const [firstName, setFirstName] = useState(member.first_name);
  const [lastName, setLastName] = useState(member.last_name);
  
  // Verificar si el miembro que se está editando es el usuario actual
  const isCurrentUser = user && member.id === user.id;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization?.id) return;

    try {
      setIsUploading(true);
      
      // Validar tamaño y tipo de archivo
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSizeInBytes) {
        throw new Error(`El archivo es demasiado grande. El tamaño máximo permitido es 5MB.`);
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido. Los formatos aceptados son: JPG, PNG, GIF y WebP.`);
      }
      
      // Crear un nombre de archivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${member.id}-${Date.now()}.${fileExt}`;
      
      // Crear una ruta organizada por organización/miembro
      const filePath = `org_${organization.id}/member_${member.id}/${fileName}`;
      
      console.log('Ruta de archivo:', filePath);

      // Usar el nuevo bucket 'member-profiles' que hemos creado con políticas adecuadas
      const bucketName = 'member-profiles';

      // Subir el archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        throw new Error(`Error al subir: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error('No se pudo obtener información del archivo subido');
      }

      console.log('Archivo subido correctamente:', uploadData.path);

      // Obtener la URL pública del archivo
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo');
      }

      console.log('URL pública obtenida:', data.publicUrl);

      // Actualizar la URL del avatar
      setAvatarUrl(data.publicUrl);

      // Si el miembro que se está editando es el usuario actual, actualizar el perfil en el contexto
      if (isCurrentUser && updateProfile) {
        try {
          await updateProfile({ avatar_url: data.publicUrl });
          console.log('Perfil actualizado en el contexto de autenticación');
        } catch (updateError) {
          console.error('Error al actualizar el perfil en el contexto:', updateError);
        }
      }

      toast({
        title: "Imagen subida",
        description: "La imagen de perfil se ha subido correctamente.",
      });
    } catch (error: any) {
      console.error('Error al subir la imagen:', error);
      toast({
        title: "Error al subir imagen",
        description: error.message || "Error al subir la imagen de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<MemberProfile> = {
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl
    };

    // Actualizar el miembro en la base de datos
    onUpdate(member.id, updates);
    
    // Si el miembro que se está editando es el usuario actual, actualizar el perfil en el contexto
    if (isCurrentUser && updateProfile) {
      try {
        await updateProfile({
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl
        });
        console.log('Perfil actualizado en el contexto de autenticación desde handleSubmit');
      } catch (updateError) {
        console.error('Error al actualizar el perfil en el contexto:', updateError);
      }
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Miembro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-lg">
                {firstName[0]}{lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="avatar" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {isUploading ? 'Subiendo...' : 'Cambiar foto'}
              </Label>
              <Input 
                id="avatar" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last-name" className="text-right">
                Apellido
              </Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading}>Guardar cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
