
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
}

serve(async (req) => {
  console.log('=== Accept invitation function started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      // Validate invitation token - NO AUTHORIZATION REQUIRED
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('member_invitations')
        .select(`
          id,
          email,
          first_name,
          last_name,
          organization_id,
          role,
          status,
          expires_at,
          organizations!inner(name)
        `)
        .eq('token', token)
        .single();

      if (invitationError || !invitation) {
        console.error('Invitation not found:', invitationError?.message);
        return new Response(
          JSON.stringify({ error: 'Invitación no encontrada o inválida' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        return new Response(
          JSON.stringify({ error: 'Esta invitación ya ha sido utilizada' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Esta invitación ha expirado' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Return invitation details for the frontend
      return new Response(
        JSON.stringify({
          valid: true,
          invitation: {
            email: invitation.email,
            firstName: invitation.first_name,
            lastName: invitation.last_name,
            organizationName: invitation.organizations.name
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (req.method === 'POST') {
      // Accept invitation and create user - NO AUTHORIZATION REQUIRED
      const { token, password }: AcceptInvitationRequest = await req.json();

      if (!token || !password) {
        return new Response(
          JSON.stringify({ error: 'Token y contraseña requeridos' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('member_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitation) {
        console.error('Invitation not found:', invitationError?.message);
        return new Response(
          JSON.stringify({ error: 'Invitación no encontrada o inválida' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Esta invitación ha expirado' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Create user in Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          organization_id: invitation.organization_id,
          role: invitation.role
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Error al crear el usuario: ' + createError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      console.log('User created successfully:', newUser.user.id);

      // Mark invitation as accepted
      const { error: updateError } = await supabaseAdmin
        .from('member_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('token', token);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        // Don't return error here since user was created successfully
      }

      console.log('Invitation accepted successfully');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
          user: {
            id: newUser.user.id,
            email: newUser.user.email
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
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
