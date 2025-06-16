import React, { useState } from 'react';
import { useFunnels } from '@/hooks/useFunnels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Loader2, Plus, MoreHorizontal, Trash2, Pencil, Eye, Users, Layers } from 'lucide-react';
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
    <div className="p-6 max-w-[1400px] mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/5">
          <h2 className="text-xl font-semibold">No has creado ningún embudo</h2>
          <p className="text-muted-foreground mt-2 mb-4">Empieza a organizar tus ventas creando tu primer embudo.</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Crear Embudo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {funnels.map((funnel) => (
            <Card key={funnel.id} className="group hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: funnel.funnel_stages?.[0]?.color || '#e2e8f0' }}>
              <div className="flex items-start p-6">
                <div className="flex-grow">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{funnel.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1.5" />
                        {funnel.funnel_contacts?.length || 0}
                      </span>
                      <span className="flex items-center">
                        <Layers className="w-4 h-4 mr-1.5" />
                        {funnel.funnel_stages?.length || 0}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{funnel.description || 'Sin descripción'}</p>
                  <div className="flex gap-2">
                    {funnel.funnel_stages?.slice(0, 3).map((stage) => (
                      <div 
                        key={stage.id} 
                        className="px-2 py-1 rounded text-xs" 
                        style={{ 
                          backgroundColor: `${stage.color}15`,
                          color: stage.color
                        }}
                      >
                        {stage.name}
                      </div>
                    ))}
                    {(funnel.funnel_stages?.length || 0) > 3 && (
                      <div className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                        +{(funnel.funnel_stages?.length || 0) - 3} más
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link to={`/funnels/${funnel.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Ver Embudo
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(funnel)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(funnel.id)} className="text-red-500 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
