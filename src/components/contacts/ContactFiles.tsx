
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Download, FileText } from 'lucide-react';
import { useContactFiles } from '@/hooks/useContacts';

interface ContactFilesProps {
  contactId: string;
}

export function ContactFiles({ contactId }: ContactFilesProps) {
  const { data: files = [], isLoading } = useContactFiles(contactId);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamaño desconocido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO');
  };

  if (isLoading) {
    return <div>Cargando archivos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Subir Archivos</h3>
              <p className="text-gray-600 mb-4">Arrastra archivos aquí o haz clic para seleccionar</p>
              <Button variant="outline">
                <Paperclip className="h-4 w-4 mr-2" />
                Seleccionar Archivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files list */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay archivos adjuntos</h3>
            <p className="text-gray-600">Los archivos subidos aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">{file.file_name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
