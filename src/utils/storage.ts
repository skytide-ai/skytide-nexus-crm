import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica si el bucket de almacenamiento existe y lo crea si no
 * @param bucketName Nombre del bucket a verificar/crear
 * @returns Promise que resuelve a true si el bucket existe o se creó correctamente
 */
export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error al listar buckets:', listError);
      throw listError;
    }
    
    // Comprobar si el bucket ya existe
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`El bucket "${bucketName}" ya existe`);
      return true;
    }
    
    // Crear el bucket si no existe
    console.log(`Creando bucket "${bucketName}"...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true // Hacer el bucket público para que las imágenes sean accesibles
    });
    
    if (createError) {
      console.error(`Error al crear bucket "${bucketName}":`, createError);
      throw createError;
    }
    
    console.log(`Bucket "${bucketName}" creado correctamente`);
    return true;
  } catch (error) {
    console.error('Error en ensureStorageBucket:', error);
    return false;
  }
};

/**
 * Asegura que el bucket 'chat-media' exista para el almacenamiento de archivos de chat
 */
export const ensureChatMediaBucket = async (): Promise<boolean> => {
  return ensureStorageBucket('chat-media');
};
