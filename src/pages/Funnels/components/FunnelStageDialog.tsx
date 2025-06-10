import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FunnelStage } from '@/types/funnel';
import { useFunnelStages } from '@/hooks/useFunnelStages';

const stageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hexadecimal válido (ej. #RRGGBB)'),
});

type StageFormValues = z.infer<typeof stageSchema>;

interface FunnelStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelId: string;
  stage?: FunnelStage;
  stagesCount: number;
}

export function FunnelStageDialog({ open, onOpenChange, funnelId, stage, stagesCount }: FunnelStageDialogProps) {
  const { createStage, updateStage } = useFunnelStages(funnelId);

  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: '',
      color: '#000000',
    },
  });

  useEffect(() => {
    if (stage) {
      form.reset({
        name: stage.name,
        color: stage.color,
      });
    } else {
      form.reset({ name: '', color: '#000000' });
    }
  }, [stage, form]);

  const onSubmit = async (values: StageFormValues) => {
    try {
    if (stage) {
        await updateStage.mutateAsync({
        id: stage.id,
        name: values.name,
        color: values.color,
      });
    } else {
        await createStage.mutateAsync({
        name: values.name,
        color: values.color,
      });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar la etapa:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      modal={true}
    >
      <DialogContent 
        className="z-50 max-w-md fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{stage ? 'Editar Etapa' : 'Crear Nueva Etapa'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la etapa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Contactado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="w-12 h-10 p-1" {...field} />
                      <Input placeholder="#RRGGBB" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {stage ? 'Guardar Cambios' : 'Crear Etapa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
