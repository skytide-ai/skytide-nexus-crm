
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password, email } = await req.json();

    if (!token || !password || !email) {
      return new Response(
        JSON.stringify({ error: 'Token, contraseña y email son requeridos' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Accept the invitation by setting the password
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'invite'
    });

    if (error) {
      console.error('Error verifying invitation:', error);
      return new Response(
        JSON.stringify({ error: 'Token de invitación inválido o expirado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'No se pudo procesar la invitación' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      data.user.id,
      { password }
    );

    if (updateError) {
      console.error('Error setting password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al establecer la contraseña' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create profile record from user metadata
    const metadata = data.user.user_metadata;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        first_name: metadata?.first_name || '',
        last_name: metadata?.last_name || '',
        organization_id: metadata?.organization_id,
        role: 'member',
        is_active: true
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail the whole process if profile creation fails
      console.log('Profile creation failed, but invitation was accepted');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación aceptada correctamente',
        userId: data.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
      }
    );
  }
});
