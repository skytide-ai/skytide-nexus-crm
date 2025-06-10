import React, { useState } from 'react';
import { useFunnels } from '@/hooks/useFunnels';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, MoreHorizontal, Trash2, Pencil, Eye } from 'lucide-react';
import { Funnel, CreateFunnelForm } from '@/types/funnel';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function FunnelsPage() {
  const { funnels, isLoading, createFunnel, updateFunnel, deleteFunnel } = useFunnels();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [form, setForm] = useState<CreateFunnelForm>({ name: '', description: '' });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingFunnel(null);
      setForm({ name: '', description: '' });
    }
    setIsCreateOpen(isOpen);
  };

  const handleEditClick = (funnel: Funnel) => {
    setEditingFunnel(funnel);
    setForm({ name: funnel.name, description: funnel.description || '' });
    setIsCreateOpen(true);
  };

  const handleDeleteClick = (funnelId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este embudo? Se eliminarán todas sus etapas y contactos asociados.')) {
      deleteFunnel.mutate(funnelId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFunnel) {
      updateFunnel.mutate({ id: editingFunnel.id, ...form }, { onSuccess: () => handleOpenChange(false) });
    } else {
      createFunnel.mutate(form, { onSuccess: () => handleOpenChange(false) });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Embudos de Venta</h1>
        <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Crear Embudo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFunnel ? 'Editar Embudo' : 'Crear Nuevo Embudo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Embudo</Label>
                <Input 
                  id="name" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  value={form.description || ''} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={createFunnel.isPending || updateFunnel.isPending}>
                {(createFunnel.isPending || updateFunnel.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingFunnel ? 'Guardar Cambios' : 'Crear Embudo'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : funnels.length === 0 ? (
        <p>No se han creado embudos todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funnels.map((funnel) => (
              <TableRow key={funnel.id}>
                <TableCell className="font-medium">{funnel.name}</TableCell>
                <TableCell>{funnel.description}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/funnels/${funnel.id}`} className="flex items-center w-full cursor-pointer">
                           <Eye className="mr-2 h-4 w-4" /> Ver
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(funnel)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(funnel.id)} className="text-red-500 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
