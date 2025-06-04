
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TimeSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}

export function TimeSelector({ label, value, onChange, id, required }: TimeSelectorProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full"
      />
    </div>
  );
}
