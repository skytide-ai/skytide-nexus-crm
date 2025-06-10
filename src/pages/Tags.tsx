import React, { useState } from 'react';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Pencil, Trash2, Tags as TagsIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateTagForm, Tag, UpdateTagForm } from '@/types/tag';
import { useToast } from '@/hooks/use-toast';

function isLightColor(color: string) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default function Tags() {
  const { tags = [], isLoading, createTag, updateTag, deleteTag } = useTags();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form, setForm] = useState<CreateTagForm>({
    name: '',
    color: '#000000',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      await updateTag.mutateAsync({
        id: editingTag.id,
        ...form,
      });
      setEditingTag(null);
    } else {
      await createTag.mutateAsync(form);
      setIsCreateOpen(false);
    }
    setForm({ name: '', color: '#000000' });
  };

  const handleDelete = async (tag: Tag) => {
    console.log('Intentando eliminar tag:', tag);
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta etiqueta?')) {
      return;
    }

    try {
      console.log('Confirmado, procediendo a eliminar tag:', tag.id);
      await deleteTag.mutateAsync(tag.id);
      console.log('Tag eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar la etiqueta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la etiqueta. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setForm({
      name: tag.name,
      color: tag.color,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Etiquetas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las etiquetas para categorizar tus contactos.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Etiqueta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 p-2 rounded-md bg-secondary/20">
                <TagsIcon className="w-8 h-8 text-secondary-foreground/70" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Personaliza tu etiqueta</p>
                  <p className="text-sm text-muted-foreground">
                    Las etiquetas te ayudan a organizar y filtrar tus contactos.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-20"
                    required
                  />
                  <Input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {createTag.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Etiqueta
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Etiqueta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 p-2 rounded-md bg-secondary/20">
                <TagsIcon className="w-8 h-8 text-secondary-foreground/70" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Modifica tu etiqueta</p>
                  <p className="text-sm text-muted-foreground">
                    Actualiza el nombre o color de tu etiqueta.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-20"
                    required
                  />
                  <Input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {updateTag.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Actualizar Etiqueta
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!tags?.length ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No hay etiquetas creadas
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border shadow-sm"
                        style={{ backgroundColor: tag.color }}
                      />
                      <code className="text-sm text-muted-foreground font-mono">
                        {tag.color.toUpperCase()}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tag.name}</span>
                      <Badge
                        style={{
                          backgroundColor: tag.color,
                          color: isLightColor(tag.color) ? '#000' : '#fff',
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tag)}
                        className="hover:bg-secondary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tag)}
                        className="hover:bg-red-100 hover:text-red-600"
                        disabled={deleteTag.isPending}
                      >
                        {deleteTag.isPending && deleteTag.variables === tag.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
