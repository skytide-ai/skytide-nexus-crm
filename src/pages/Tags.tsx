import React, { useState } from 'react';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Loader2, Plus, Pencil, Trash2, Tags as TagsIcon, 
  MoreVertical, Check, X, AlertTriangle,
  Hash, Palette
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateTagForm, Tag } from '@/types/tag';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
    try {
      if (editingTag) {
        await updateTag.mutateAsync({
          id: editingTag.id,
          ...form,
        });
        setEditingTag(null);
        setIsCreateOpen(false);
      } else {
        await createTag.mutateAsync(form);
        setIsCreateOpen(false);
      }
      setForm({ name: '', color: '#000000' });
      toast({
        title: 'Éxito',
        description: editingTag ? 'Etiqueta actualizada correctamente.' : 'Etiqueta creada correctamente.'
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la etiqueta. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (tag: Tag) => {
    try {
      await deleteTag.mutateAsync(tag.id);
      toast({
        title: 'Éxito',
        description: 'La etiqueta ha sido eliminada.',
      });
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
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Etiquetas</h1>
          <p className="text-lg text-muted-foreground">
            Organiza y categoriza tus contactos con etiquetas personalizadas.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-10">
              <Plus className="h-5 w-5 mr-2" />
              Nueva Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Editar Etiqueta' : 'Crear Nueva Etiqueta'}</DialogTitle>
              <DialogDescription>
                Las etiquetas te ayudan a organizar y filtrar tus contactos de manera eficiente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg shadow-sm flex items-center justify-center transition-colors" 
                    style={{ 
                      backgroundColor: form.color,
                      color: isLightColor(form.color) ? '#000' : '#fff'
                    }}
                  >
                    <Hash className="h-6 w-6" />
                  </div>
                  <div className="flex-grow">
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nombre de la etiqueta"
                      className="border-0 bg-transparent text-lg font-medium px-0 h-auto placeholder:text-muted-foreground/50"
                      required
                    />
                    <code className="text-sm text-muted-foreground font-mono">
                      {form.color.toUpperCase()}
                    </code>
                  </div>
                </div>
                <div className="grid grid-cols-[auto,1fr] gap-2 items-center">
                  <div className="relative">
                    <Input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-[42px] h-[42px] p-1 cursor-pointer"
                      required
                    />
                    <div className="absolute inset-0 pointer-events-none rounded-md border" />
                  </div>
                  <div className="flex gap-2">
                    {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96C93D', '#FED766'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-[42px] h-[42px] rounded-md border transition-all",
                          "hover:scale-110 hover:shadow-md",
                          form.color.toLowerCase() === color.toLowerCase() && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Badge
                className="w-fit"
                style={{
                  backgroundColor: form.color,
                  color: isLightColor(form.color) ? '#000' : '#fff',
                }}
              >
                {form.name || 'Vista previa'}
              </Badge>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTag(null);
                    setForm({ name: '', color: '#000000' });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {(createTag.isPending || updateTag.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTag ? 'Guardar Cambios' : 'Crear Etiqueta'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!tags?.length ? (
          <Card className="col-span-full p-8 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10">
            <TagsIcon className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-1">
              <h3 className="font-semibold">No hay etiquetas creadas</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Crea tu primera etiqueta para empezar a organizar tus contactos.
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Crear Etiqueta
            </Button>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="group relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-15"
                style={{ backgroundColor: tag.color }}
              />
              <div className="p-5 relative">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center" 
                      style={{ 
                        backgroundColor: tag.color,
                        color: isLightColor(tag.color) ? '#000' : '#fff'
                      }}
                    >
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tag.name}</h3>
                      <code className="text-xs text-muted-foreground font-mono">
                        {tag.color.toUpperCase()}
                      </code>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          handleEdit(tag);
                          setIsCreateOpen(true);
                        }} 
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.confirm('¿Estás seguro de que quieres eliminar esta etiqueta?')) {
                            handleDelete(tag);
                          }
                        }} 
                        className="text-destructive gap-2"
                        disabled={deleteTag.isPending}
                      >
                        {deleteTag.isPending && deleteTag.variables === tag.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge
                  className="mt-2"
                  style={{
                    backgroundColor: tag.color,
                    color: isLightColor(tag.color) ? '#000' : '#fff',
                  }}
                >
                  {tag.name}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
