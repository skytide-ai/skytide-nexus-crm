import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Download, FileText, X, Loader2 } from 'lucide-react';
import { useContactFiles, useUploadContactFile, useDeleteContactFile } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // Importar la instancia de Supabase

interface ContactFilesProps {
  contactId: string;
}

export function ContactFiles({ contactId }: ContactFilesProps) {
  const { data: files = [], isLoading } = useContactFiles(contactId);
  const uploadFile = useUploadContactFile();
  const deleteFile = useDeleteContactFile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamaño desconocido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO');
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      uploadFileToContact(file);
    });
  };

  const uploadFileToContact = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    setUploadingFiles(prev => [...prev, fileId]);

    try {
      await uploadFile.mutateAsync({
        contactId,
        file,
        fileName: file.name,
      });

      toast({
        title: "Archivo subido",
        description: `${file.name} se ha subido correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error al subir archivo",
        description: error.message || "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      await deleteFile.mutateAsync(fileId);
      toast({
        title: "Archivo eliminado",
        description: `${fileName} se ha eliminado correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar archivo",
        description: error.message || "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDownloadFile = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('contact-files')
        .download(file.file_path);

      if (error) {
        throw error;
      }

      // Crear URL para descarga
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Descarga completada",
        description: `${file.file_name} se ha descargado correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el archivo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando archivos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <Card>
        <CardContent className="p-6">
          <div 
            className={`flex items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Subir Archivos</h3>
              <p className="text-gray-600 mb-4">
                {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
              </p>
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles.length > 0}
              >
                {uploadingFiles.length > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Seleccionar Archivos
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                accept="*/*"
              />
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteFile(file.id, file.file_name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
