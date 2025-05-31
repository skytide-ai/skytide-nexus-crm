
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
}

serve(async (req) => {
  console.log('=== Send invitation function started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Token de autorización inválido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, organization_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError?.message);
      return new Response(
        JSON.stringify({ error: 'Error al obtener el perfil del usuario' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check admin permissions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      console.error('Insufficient permissions:', profile.role);
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para invitar miembros' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Parse request body
    const { email, firstName, lastName }: InvitationRequest = await req.json();

    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos (email, firstName, lastName)' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Invitation data:', { email, firstName, lastName });

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('User already exists');
      return new Response(
        JSON.stringify({ error: 'Este email ya está registrado en el sistema' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabaseAdmin
      .from('member_invitations')
      .select('id, status')
      .eq('email', email)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitation) {
      console.log('Pending invitation already exists');
      return new Response(
        JSON.stringify({ error: 'Ya existe una invitación pendiente para este email' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get organization name
    const { data: organization } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single();

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('member_invitations')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        organization_id: profile.organization_id,
        role: 'member',
        invited_by: user.id,
        invited_by_name: `${profile.first_name} ${profile.last_name}`
      })
      .select('token')
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Error al crear la invitación: ' + invitationError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Invitation created with token:', invitation.token);

    // Send invitation email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const appUrl = req.headers.get('origin') || 'https://fyyzaysmpephomhmudxt.lovable.app';
    const invitationUrl = `${appUrl}/aceptar-invitacion?token=${invitation.token}`;

    const emailResponse = await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: [email],
      subject: `Invitación para unirse a ${organization?.name || 'la organización'}`,
      html: `
        <h1>¡Has sido invitado a unirte a ${organization?.name || 'la organización'}!</h1>
        <p>Hola ${firstName},</p>
        <p>${profile.first_name} ${profile.last_name} te ha invitado a formar parte del equipo.</p>
        <p>Para crear tu cuenta y establecer tu contraseña, haz clic en el siguiente enlace:</p>
        <p>
          <a href="${invitationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Aceptar invitación y crear cuenta
          </a>
        </p>
        <p>Este enlace expirará en 7 días.</p>
        <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
        <br>
        <p>Saludos,<br>El equipo de ${organization?.name || 'la organización'}</p>
      `,
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el email de invitación' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Invitation email sent successfully');
    console.log('=== Send invitation completed successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación enviada correctamente. El usuario recibirá un email para crear su cuenta.',
        invitation_token: invitation.token
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor: ' + error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
