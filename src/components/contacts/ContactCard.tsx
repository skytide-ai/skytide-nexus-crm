
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Calendar } from 'lucide-react';
import type { Contact } from '@/types/contact';

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {contact.first_name[0]}{contact.last_name[0]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {contact.first_name} {contact.last_name}
              </h3>
              {contact.age && (
                <p className="text-sm text-gray-600">{contact.age} años</p>
              )}
            </div>
          </div>
          {contact.gender && (
            <Badge variant="outline" className="text-xs">
              {contact.gender === 'masculino' ? 'M' : contact.gender === 'femenino' ? 'F' : 'Otro'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4" />
          <span>{contact.country_code} {contact.phone}</span>
        </div>
        
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        
        {contact.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{contact.city}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
          <Calendar className="h-4 w-4" />
          <span>Agregado {formatDate(contact.created_at)}</span>
        </div>
        
        {contact.document_type && contact.document_number && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {contact.document_type}: {contact.document_number}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
