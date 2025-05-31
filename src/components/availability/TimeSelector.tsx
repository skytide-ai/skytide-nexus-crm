
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimeSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}

export function TimeSelector({ label, value, onChange, id, required }: TimeSelectorProps) {
  // Generar opciones de hora (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Generar opciones de minutos (0, 15, 30, 45)
  const minutes = ['00', '15', '30', '45'];

  const [hour, minute] = value ? value.split(':') : ['09', '00'];

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour}:${newMinute}`);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Select value={hour} onValueChange={handleHourChange} required={required}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center text-gray-500">:</span>
        <Select value={minute} onValueChange={handleMinuteChange} required={required}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
