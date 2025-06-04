
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateContact } from '@/hooks/useContacts';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ open, onOpenChange }: CreateContactDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      return;
    }

    const contactData = {
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
      await createContact.mutateAsync(contactData);
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
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    if (value) {
      // Extract country code and phone number
      const match = value.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        setFormData(prev => ({
          ...prev,
          country_code: match[1],
          phone: match[2].replace(/\s/g, '')
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Contacto</DialogTitle>
          <DialogDescription>
            Complete la información del contacto. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombres *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellidos *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <PhoneInput
              international
              defaultCountry="CO"
              value={formData.country_code + formData.phone}
              onChange={handlePhoneChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          {/* Información demográfica */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="150"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={formData.gender} onValueChange={(value: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir') => setFormData(prev => ({ ...prev, gender: value }))}>
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
              <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
          </div>

          {/* Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={formData.document_type} onValueChange={(value: 'CC' | 'NIT') => setFormData(prev => ({ ...prev, document_type: value }))}>
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
              <Label htmlFor="document_number">Número de Documento</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? 'Creando...' : 'Crear Contacto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
