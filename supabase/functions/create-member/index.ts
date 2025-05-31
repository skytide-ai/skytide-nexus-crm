
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
}

// Función para generar contraseña temporal aleatoria
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

serve(async (req) => {
  console.log('=== Create member function started ===');
  
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

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract JWT token
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify user authentication
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
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
        JSON.stringify({ error: 'No tienes permisos para crear miembros' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Parse request body
    const { email, firstName, lastName }: CreateMemberRequest = await req.json();

    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos (email, firstName, lastName)' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Member data:', { email, firstName, lastName });

    // Check if user already exists
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

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    console.log('Generated temporary password');

    // Create user using admin API
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Skip email verification
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        organization_id: profile.organization_id,
        password_changed: false // Flag para indicar que debe cambiar la contraseña
      }
    });

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: 'Error al crear el usuario: ' + createUserError?.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('User created successfully:', newUser.user.id);

    // Create profile entry
    const { error: profileCreateError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        organization_id: profile.organization_id,
        role: 'member',
        is_active: true,
        password_changed: false
      });

    if (profileCreateError) {
      console.error('Error creating profile:', profileCreateError);
      // Try to delete the user if profile creation failed
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Error al crear el perfil: ' + profileCreateError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Profile created successfully');
    console.log('=== Create member completed successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Miembro creado correctamente',
        credentials: {
          email,
          password: temporaryPassword
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
