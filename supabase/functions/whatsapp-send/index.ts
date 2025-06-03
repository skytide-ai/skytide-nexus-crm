// Importaciones para entorno Deno
// @ts-ignore - Estas importaciones funcionan en el entorno de ejecución de Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Declaración para el entorno Deno
// @ts-ignore - Deno existe en el entorno de ejecución
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Configuración de variables de entorno
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// Variable de entorno para la URL del webhook de n8n (fallback)
const DEFAULT_N8N_WEBHOOK_URL = Deno.env.get('N8N_SEND_WEBHOOK_URL') || '';

// Cliente de Supabase con rol de servicio para operaciones privilegiadas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Función para obtener el ID de contacto vinculado a un número de teléfono
async function getContactId(organizationId: string, phoneNumber: string) {
  const { data } = await supabase
    .from('whatsapp_phone_config')
    .select('contact_id')
    .eq('organization_id', organizationId)
    .eq('phone_number', phoneNumber)
    .single();

  return data?.contact_id || null;
}

serve(async (req) => {
  // Verificamos que sea un método POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    console.log('Send message request:', JSON.stringify(body));

    // Validamos los datos requeridos
    const { organization_id, phone_number, message } = body;

    if (!organization_id || !phone_number || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtenemos el ID de contacto vinculado (si existe)
    const contactId = await getContactId(organization_id, phone_number);

    // Obtenemos la configuración de WhatsApp para esta organización
    const { data: whatsappConfig, error: configError } = await supabase
      .from('whatsapp_config')
      .select('webhook_url')
      .eq('organization_id', organization_id)
      .single();

    if (configError) {
      console.error('Error getting WhatsApp config:', configError);
    }

    // Usamos la URL del webhook de la configuración o el fallback
    const webhookUrl = (whatsappConfig?.webhook_url || DEFAULT_N8N_WEBHOOK_URL).trim();

    // Verificamos que tengamos configurado el webhook de n8n
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({
          error: 'No webhook URL configured for this organization',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Enviamos los datos al webhook de n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_id,
        phone_number,
        message,
        contact_id: contactId,
        is_from_admin: true,
        is_from_bot: false,
        source: 'crm',
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`Error sending message to n8n: ${n8nResponse.status} ${errorText}`);
    }

    const responseData = await n8nResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message sent to n8n successfully',
        data: responseData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error sending message',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
