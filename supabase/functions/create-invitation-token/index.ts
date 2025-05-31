
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateInvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
}

function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

serve(async (req) => {
  console.log('=== Create invitation token function started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log('Authorization header found');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const jwt = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
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

    console.log('Profile found:', profile.role, 'org:', profile.organization_id);

    if (!['admin', 'superadmin'].includes(profile.role)) {
      console.error('Insufficient permissions:', profile.role);
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para crear invitaciones' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    const { email, firstName, lastName }: CreateInvitationRequest = await req.json();

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

    const { data: existingUser } = await supabase
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

    const { data: existingInvitation } = await supabase
      .from('member_invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', profile.organization_id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
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

    const token = generateInvitationToken();
    console.log('Generated invitation token');

    const { data: invitation, error: invitationError } = await supabase
      .from('member_invitations')
      .insert({
        token,
        email,
        first_name: firstName,
        last_name: lastName,
        organization_id: profile.organization_id,
        invited_by: user.id
      })
      .select()
      .single();

    if (invitationError || !invitation) {
      console.error('Error creating invitation:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Error al crear la invitación: ' + invitationError?.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Invitation created successfully:', invitation.id);
    console.log('=== Create invitation completed successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación creada correctamente',
        invitation: {
          token: invitation.token,
          email: invitation.email,
          expiresAt: invitation.expires_at
        }
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
