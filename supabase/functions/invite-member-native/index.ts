
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  console.log('=== Native member invitation function started ===');
  
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

    console.log('Authorization header found');

    // Extract the JWT token from the header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication using the JWT token directly
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

    // Get user profile using admin client
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

    console.log('Profile found:', profile.role, 'org:', profile.organization_id);

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

    // Check if user already exists using admin client
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

    // Get organization name using admin client
    const { data: organization } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single();

    // Get the origin from the request for redirect URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');
    const redirectUrl = `${origin}/auth`;
    
    console.log('Using redirect URL:', redirectUrl);

    // Step 1: Create user with confirmed email and temporary password
    console.log('Creating user with temporary password...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Automatically confirm email
      password: crypto.randomUUID(), // Generate temporary random password
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        organization_id: profile.organization_id,
        invited_by: profile.first_name + ' ' + profile.last_name,
        organization_name: organization?.name || 'la organización'
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

    // Step 2: Send password reset email (this will force user to set their own password)
    console.log('Sending password reset email...');
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el email de invitación: ' + resetError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Password reset email sent successfully');
    console.log('=== Native member invitation completed successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación enviada correctamente. El usuario recibirá un email para establecer su contraseña y activar su cuenta.',
        user_data: newUser
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
