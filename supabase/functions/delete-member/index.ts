
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteMemberRequest {
  memberId: string;
}

serve(async (req) => {
  console.log('=== Delete member function started ===');
  
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

    // Create Supabase client with service role for admin operations
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

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // Check admin permissions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      console.error('Insufficient permissions:', profile.role);
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para eliminar miembros' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    const { memberId }: DeleteMemberRequest = await req.json();

    if (!memberId) {
      return new Response(
        JSON.stringify({ error: 'ID del miembro requerido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Deleting member:', memberId);

    // First, get the member to verify they belong to the same organization
    const { data: memberToDelete, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, email')
      .eq('id', memberId)
      .single();

    if (memberError || !memberToDelete) {
      console.error('Member not found:', memberError?.message);
      return new Response(
        JSON.stringify({ error: 'Miembro no encontrado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Verify the member belongs to the same organization
    if (memberToDelete.organization_id !== profile.organization_id) {
      console.error('Member belongs to different organization');
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para eliminar este miembro' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Delete from profiles table first
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return new Response(
        JSON.stringify({ error: 'Error al eliminar el perfil del miembro' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Profile deleted successfully');

    // Delete from Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(memberId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // Don't return error here since profile was already deleted
      console.log('Profile was deleted but auth user deletion failed');
    } else {
      console.log('Auth user deleted successfully');
    }

    console.log('=== Member deletion completed ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Miembro eliminado completamente del sistema',
        memberId 
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
