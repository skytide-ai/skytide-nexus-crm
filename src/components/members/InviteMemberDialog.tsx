
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Mail } from 'lucide-react';
import { CreateMemberForm } from '@/types/member';

interface InviteMemberDialogProps {
  onInvite: (formData: CreateMemberForm) => void;
  isLoading: boolean;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ onInvite, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreateMemberForm>({
    email: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(form);
    setForm({ email: '', firstName: '', lastName: '' });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Miembro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
          <DialogDescription>
            Envía una invitación por email al nuevo miembro. Recibirá un enlace para crear su cuenta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Mail className="mr-2 h-4 w-4" />
              {isLoading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
