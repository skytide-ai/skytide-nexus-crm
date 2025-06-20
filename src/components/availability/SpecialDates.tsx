import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Coffee, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MemberSpecialDate, OrganizationSpecialDate } from '@/hooks/useAvailability';
import { TimeSelector } from './TimeSelector';

interface SpecialDatesProps {
  specialDates: MemberSpecialDate[] | OrganizationSpecialDate[];
  onAdd: (data: any) => void;
  onDelete: (id: string) => void;
  title: string;
  description: string;
  canEdit: boolean;
}

export function SpecialDates({ 
  specialDates, 
  onAdd, 
  onDelete, 
  title, 
  description, 
  canEdit 
}: SpecialDatesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    break_start_time: '',
    break_end_time: '',
    is_available: false,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Corregir el problema de zona horaria para la fecha
    // La fecha viene en formato YYYY-MM-DD del input type="date"
    // Necesitamos asegurarnos de que no haya ajustes de zona horaria
    // Para eso, vamos a crear una fecha con la zona horaria local correcta
    const [year, month, day] = formData.date.split('-').map(Number);
    
    // Crear una fecha con la zona horaria local correcta (mes es 0-indexed en JavaScript)
    const correctedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const data = {
      ...formData,
      // Usar la fecha corregida
      date: correctedDate,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      break_start_time: formData.break_start_time || null,
      break_end_time: formData.break_end_time || null,
      reason: formData.reason || null,
    };

    await onAdd(data);
    setIsDialogOpen(false);
    setFormData({
      date: '',
      start_time: '',
      end_time: '',
      break_start_time: '',
      break_end_time: '',
      is_available: false,
      reason: '',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    // Crear una fecha con UTC para evitar problemas de zona horaria
    // Formato de entrada: YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    
    // Crear una fecha con la zona horaria local correcta (mes es 0-indexed en JavaScript)
    const localDate = new Date(year, month - 1, day);
    
    return localDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const sortedDates = [...specialDates].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar fecha especial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Agregar fecha especial</DialogTitle>
                    <DialogDescription>
                      Define una excepción para un día específico.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Fecha</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_available"
                        checked={formData.is_available}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                      />
                      <Label htmlFor="is_available">
                        {formData.is_available ? 'Habilitar horario especial' : 'Bloquear día completo'}
                      </Label>
                    </div>

                    {formData.is_available && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <TimeSelector
                            label="Hora inicio"
                            value={formData.start_time}
                            onChange={(value) => setFormData({ ...formData, start_time: value })}
                            id="start_time"
                          />
                          <TimeSelector
                            label="Hora fin"
                            value={formData.end_time}
                            onChange={(value) => setFormData({ ...formData, end_time: value })}
                            id="end_time"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <TimeSelector
                            label="Descanso inicio"
                            value={formData.break_start_time}
                            onChange={(value) => setFormData({ ...formData, break_start_time: value })}
                            id="break_start_time"
                          />
                          <TimeSelector
                            label="Descanso fin"
                            value={formData.break_end_time}
                            onChange={(value) => setFormData({ ...formData, break_end_time: value })}
                            id="break_end_time"
                          />
                        </div>
                      </>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="reason">Motivo (opcional)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Ej: Vacaciones, día festivo, evento especial..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Agregar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {sortedDates.length === 0 ? (
            <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center min-h-[200px]">
              <Calendar className="h-16 w-16 mx-auto mb-5 text-slate-300" />
              <p className="text-md">No hay fechas especiales definidas</p>
            </div>
          ) : (
            sortedDates.map((specialDate) => (
              <div key={specialDate.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg shadow-sm">
                <div className="flex-1 mr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800 text-md">
                      {formatDate(specialDate.date)}
                    </h4>
                    {specialDate.is_available ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 text-xs px-2 py-1">
                        Horario especial
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs px-2 py-1">
                        <AlertCircle className="h-3 w-3" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                  
                  {specialDate.is_available && specialDate.start_time && specialDate.end_time && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs px-2 py-1 border-slate-300 text-slate-600">
                        {formatTime(specialDate.start_time)} - {formatTime(specialDate.end_time)}
                      </Badge>
                      {specialDate.break_start_time && specialDate.break_end_time && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1 border-slate-300 text-slate-600">
                          <Coffee className="h-3 w-3" />
                          {formatTime(specialDate.break_start_time)} - {formatTime(specialDate.break_end_time)}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {specialDate.reason && (
                    <p className="text-sm text-slate-500 italic mt-1">{specialDate.reason}</p>
                  )}
                </div>
                
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(specialDate.id)}
                    className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-700 ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
