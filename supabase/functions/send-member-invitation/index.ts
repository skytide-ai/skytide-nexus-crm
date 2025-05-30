
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
    // Crear cliente de Supabase con el token de autorización del request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No se proporcionó token de autorización');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('No autorizado');
    }

    console.log('Authenticated user:', user.id);

    // Obtener perfil del usuario actual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Error al obtener el perfil del usuario');
    }

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      throw new Error('No tienes permisos para invitar miembros');
    }

    console.log('User profile:', profile);

    const { email, firstName, lastName }: InvitationRequest = await req.json();

    // Generar token único
    const token = crypto.randomUUID();

    // Verificar que el email no esté ya registrado
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', existingUserError);
      throw new Error('Error al verificar el usuario existente');
    }

    if (existingUser) {
      throw new Error('Este email ya está registrado en el sistema');
    }

    // Crear invitación
    const { error: inviteError } = await supabase
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
      console.error('Error creating invitation:', inviteError);
      throw new Error('Error al crear la invitación');
    }

    console.log('Invitation created successfully');

    // Obtener nombre de la organización
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single();

    const inviteUrl = `${req.headers.get('origin')}/invite/${token}`;

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
      throw new Error('Error al enviar el email de invitación');
    }

    console.log('Email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Invitación enviada correctamente' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in send-member-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
