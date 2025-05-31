
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting invite-member function...');
    
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Verifying user with token...');
    
    // Verify the JWT token using the admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!user) {
      console.log('No user found');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('User verified:', user.id);

    // Get user profile using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found', details: profileError.message }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Profile found:', profile);

    // Check admin permissions
    if (!['admin', 'superadmin'].includes(profile.role)) {
      console.log('Insufficient permissions for role:', profile.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body with better error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw body text received:', bodyText);
      console.log('Body length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        console.log('Empty or whitespace-only body received');
        return new Response(
          JSON.stringify({ error: 'Request body is required and cannot be empty' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Successfully parsed JSON:', requestBody);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Parse error details:', parseError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format in request body', 
          details: parseError.message 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, firstName, lastName }: InviteMemberRequest = requestBody;
    console.log('Extracted data - Email:', email, 'FirstName:', firstName, 'LastName:', lastName);

    if (!email || !firstName || !lastName) {
      console.log('Missing required fields:', { email: !!email, firstName: !!firstName, lastName: !!lastName });
      return new Response(
        JSON.stringify({ error: 'Email, firstName, and lastName are required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already exists in profiles
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('User already exists in profiles:', email);
      return new Response(
        JSON.stringify({ error: 'Este usuario ya está registrado en el sistema' }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if there's already a pending invitation for this email in this organization
    const { data: existingInvitation } = await supabaseAdmin
      .from('member_invitations')
      .select('id, used, expires_at')
      .eq('email', email)
      .eq('organization_id', profile.organization_id)
      .eq('used', false)
      .maybeSingle();

    if (existingInvitation) {
      // Check if the invitation is still valid
      const now = new Date();
      const expiresAt = new Date(existingInvitation.expires_at);
      
      if (expiresAt > now) {
        console.log('Active invitation already exists for this email');
        return new Response(
          JSON.stringify({ error: 'Ya existe una invitación activa para este email' }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Delete expired invitation
        console.log('Removing expired invitation');
        await supabaseAdmin
          .from('member_invitations')
          .delete()
          .eq('id', existingInvitation.id);
      }
    }

    // Generate invitation token
    const token_invitation = crypto.randomUUID();
    console.log('Generated invitation token');

    // Create invitation record in member_invitations table
    const { error: inviteError } = await supabaseAdmin
      .from('member_invitations')
      .insert({
        organization_id: profile.organization_id,
        email,
        first_name: firstName,
        last_name: lastName,
        invited_by: user.id,
        token: token_invitation
      });

    if (inviteError) {
      console.error('Error creating invitation record:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Error al crear la invitación: ' + inviteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Invitation record created successfully');

    // Invite user using Supabase's built-in method
    const { data: inviteData, error: supabaseInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/auth`,
        data: {
          first_name: firstName,
          last_name: lastName,
          organization_id: profile.organization_id,
          invited_by: user.id
        }
      }
    );

    if (supabaseInviteError) {
      console.error('Error with Supabase invitation:', supabaseInviteError);
      // If Supabase invitation fails, we should remove the invitation record
      await supabaseAdmin
        .from('member_invitations')
        .delete()
        .eq('token', token_invitation);
        
      return new Response(
        JSON.stringify({ error: supabaseInviteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Supabase invitation sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Invitación enviada exitosamente a ${email}`,
        user: inviteData.user
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in invite-member function:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
