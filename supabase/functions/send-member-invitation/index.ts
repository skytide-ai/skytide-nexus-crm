
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting member invitation process ===');
    
    // Obtener el token de autorización
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No se proporcionó token de autorización' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('Authorization header received, length:', authHeader.length);

    // Crear cliente admin para operaciones que requieren bypass de RLS
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extraer el JWT token del header
    const jwt = authHeader.replace('Bearer ', '');
    console.log('JWT token extracted, length:', jwt.length);

    // Verificar el JWT usando el cliente admin
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(jwt);
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Token de autorización inválido: ' + authError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    if (!user) {
      console.error('No user found in token');
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado en el token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

    // Obtener perfil del usuario actual usando el cliente admin
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role, organization_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Error al obtener el perfil del usuario: ' + profileError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      console.error('User does not have admin permissions:', profile?.role);
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para invitar miembros' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    console.log('User profile verified:', profile.role, 'org:', profile.organization_id);

    // Obtener datos del request
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { email, firstName, lastName }: InvitationRequest = requestBody;

    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos (email, firstName, lastName)' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Generar token único
    const token = crypto.randomUUID();
    console.log('Generated invitation token:', token);

    // Verificar que el email no esté ya registrado
    const { data: existingUser, error: existingUserError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', existingUserError.message);
      return new Response(
        JSON.stringify({ error: 'Error al verificar el usuario existente' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (existingUser) {
      console.log('User already exists with email:', email);
      return new Response(
        JSON.stringify({ error: 'Este email ya está registrado en el sistema' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Creating invitation for email:', email);

    // Crear invitación
    const { error: inviteError } = await adminSupabase
      .from('member_invitations')
      .insert({
        organization_id: profile.organization_id,
        email,
        first_name: firstName,
        last_name: lastName,
        invited_by: user.id,
        token
      });

    if (inviteError) {
      console.error('Error creating invitation:', inviteError.message);
      return new Response(
        JSON.stringify({ error: 'Error al crear la invitación: ' + inviteError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Invitation created successfully');

    // Obtener nombre de la organización
    const { data: organization } = await adminSupabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single();

    const inviteUrl = `${req.headers.get('origin')}/invite/${token}`;

    console.log('Sending email to:', email);

    // Enviar email
    const { error: emailError } = await resend.emails.send({
      from: 'Skytide CRM <noreply@resend.dev>',
      to: [email],
      subject: `Invitación a ${organization?.name || 'la organización'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Has sido invitado a unirte a ${organization?.name || 'la organización'}!</h2>
          
          <p>Hola ${firstName},</p>
          
          <p>${profile.first_name} ${profile.last_name} te ha invitado a formar parte de <strong>${organization?.name || 'la organización'}</strong> en Skytide CRM.</p>
          
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Aceptar Invitación
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Esta invitación expira en 7 días. Si no solicitaste esta invitación, puedes ignorar este email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">Skytide CRM - Sistema de gestión empresarial</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el email de invitación: ' + emailError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Email sent successfully');
    console.log('=== Member invitation process completed successfully ===');

    return new Response(
      JSON.stringify({ success: true, message: 'Invitación enviada correctamente' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in send-member-invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor: ' + error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
