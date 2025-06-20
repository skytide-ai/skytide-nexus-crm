import React, { useState } from 'react';
import { Clock, Plus, Trash2, Coffee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MemberAvailability, OrganizationAvailability } from '@/hooks/useAvailability';
import { TimeSelector } from './TimeSelector';

interface WeeklyAvailabilityProps {
  availability: MemberAvailability[] | OrganizationAvailability[];
  onAdd: (data: any) => void;
  onDelete: (id: string) => void;
  title: string;
  description: string;
  canEdit: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export function WeeklyAvailability({ 
  availability, 
  onAdd, 
  onDelete, 
  title, 
  description, 
  canEdit 
}: WeeklyAvailabilityProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    break_start_time: '',
    break_end_time: '',
    is_available: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      break_start_time: formData.break_start_time || null,
      break_end_time: formData.break_end_time || null,
    };

    await onAdd(data);
    setIsDialogOpen(false);
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      break_start_time: '',
      break_end_time: '',
      is_available: true,
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || 'Desconocido';
  };

  // Agrupar disponibilidad por día
  const availabilityByDay: Record<number, (MemberAvailability | OrganizationAvailability)[]> = {};
  
  availability.forEach(slot => {
    if (!availabilityByDay[slot.day_of_week]) {
      availabilityByDay[slot.day_of_week] = [];
    }
    availabilityByDay[slot.day_of_week].push(slot);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar horario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Agregar disponibilidad</DialogTitle>
                    <DialogDescription>
                      Define un nuevo bloque de disponibilidad para la semana.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="day_of_week">Día de la semana</Label>
                      <select
                        id="day_of_week"
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_available"
                        checked={formData.is_available}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                      />
                      <Label htmlFor="is_available">Disponible</Label>
                    </div>

                    {formData.is_available && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <TimeSelector
                            label="Hora inicio"
                            value={formData.start_time}
                            onChange={(value) => setFormData({ ...formData, start_time: value })}
                            id="start_time"
                            required
                          />
                          <TimeSelector
                            label="Hora fin"
                            value={formData.end_time}
                            onChange={(value) => setFormData({ ...formData, end_time: value })}
                            id="end_time"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <TimeSelector
                            label="Descanso inicio (opcional)"
                            value={formData.break_start_time}
                            onChange={(value) => setFormData({ ...formData, break_start_time: value })}
                            id="break_start_time"
                          />
                          <TimeSelector
                            label="Descanso fin (opcional)"
                            value={formData.break_end_time}
                            onChange={(value) => setFormData({ ...formData, break_end_time: value })}
                            id="break_end_time"
                          />
                        </div>
                      </>
                    )}
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
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = availabilityByDay[day.value] || [];
            
            return (
              <div key={day.value} className="p-4 bg-slate-50 rounded-lg shadow-sm">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 text-md mb-1">{day.label}</h4>
                  <div className="mt-1 space-y-0.5">
                    {daySlots.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Sin horario definido</p>
                    ) : (
                      daySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between w-full py-1">
                          {slot.is_available ? (
                            <>
                              <Badge variant="default" className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 text-xs px-2 py-1">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </Badge>
                              {slot.break_start_time && slot.break_end_time && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-1 border-slate-300 text-slate-600">
                                  <Coffee className="h-3 w-3" />
                                  {formatTime(slot.break_start_time)} - {formatTime(slot.break_end_time)}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="destructive">Bloqueado</Badge>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(slot.id)}
                              className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
