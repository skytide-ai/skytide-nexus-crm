import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagsSelect } from './TagsSelect';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { Contact } from '@/types/contact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCircle,
  Building2,
  CreditCard,
  Loader2,
} from 'lucide-react';


interface ContactDialogProps {
  contact?: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ contact, open, onOpenChange }: ContactDialogProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    country_code: '+57',
    email: '',
    age: '',
    gender: '' as '' | 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir',
    birth_date: '',
    address: '',
    city: '',
    document_type: 'CC' as 'CC' | 'NIT',
    document_number: '',
  });

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        country_code: contact.country_code || '+57',
        email: contact.email || '',
        age: contact.age ? String(contact.age) : '',
        gender: (contact.gender as '' | 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir') || '',
        birth_date: contact.birth_date || '',
        address: contact.address || '',
        city: contact.city || '',
        document_type: (contact.document_type as 'CC' | 'NIT') || 'CC',
        document_number: contact.document_number || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        country_code: '+57',
        email: '',
        age: '',
        gender: '',
        birth_date: '',
        address: '',
        city: '',
        document_type: 'CC',
        document_number: '',
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Por favor completa los campos obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    const contactData = {
      ...(contact?.id && { id: contact.id }),
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      country_code: formData.country_code,
      age: formData.age ? parseInt(formData.age) : undefined,
      email: formData.email || undefined,
      gender: formData.gender || undefined,
      birth_date: formData.birth_date || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      document_type: formData.document_type,
      document_number: formData.document_number || undefined,
    };

    try {
      if (contact) {
        await updateContact.mutateAsync(contactData);
        toast({
          title: 'Éxito',
          description: 'Contacto actualizado correctamente.',
        });
      } else {
        await createContact.mutateAsync(contactData);
        toast({
          title: 'Éxito',
          description: 'Contacto creado correctamente.',
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el contacto. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6" />
            {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
          </DialogTitle>
          <DialogDescription>
            {contact ? 'Modifica la información del contacto.' : 'Ingresa la información del nuevo contacto.'}
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
              <TabsTrigger value="additional">Adicional</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Nombres *
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Juan"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Apellidos *
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Pérez"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tipo de Documento
                    </Label>
                    <Select 
                      value={formData.document_type} 
                      onValueChange={(value: 'CC' | 'NIT') => setFormData(prev => ({ ...prev, document_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="NIT">NIT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="document_number" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Número de Documento
                    </Label>
                    <Input
                      id="document_number"
                      value={formData.document_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono *
                    </Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.country_code}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="+57" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+57">🇨🇴 +57</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                          <SelectItem value="+51">🇵🇪 +51</SelectItem>
                          <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          <SelectItem value="+56">🇨🇱 +56</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setFormData(prev => ({ ...prev, phone: value }));
                          }
                        }}

                        className="flex-1"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Calle 123 #45-67"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Ciudad
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Bogotá"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-4">
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Edad
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="150"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="25"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Género
                    </Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir') => 
                        setFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                        <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Nacimiento
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>
                </div>

                {contact && (
                  <div className="mt-4 space-y-2">
                    <Label className="flex items-center gap-2">
                      Etiquetas
                    </Label>
                    <TagsSelect contactId={contact.id} />
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createContact.isPending || updateContact.isPending}
              className="min-w-[120px]"
            >
              {(createContact.isPending || updateContact.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {contact ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                contact ? 'Guardar Cambios' : 'Crear Contacto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
