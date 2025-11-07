import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  usesAdvancedFeatures: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for user validation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { usesAdvancedFeatures } = body;

    // If not using advanced features, allow immediately
    if (!usesAdvancedFeatures) {
      return new Response(
        JSON.stringify({ allowed: true, message: 'Basic features allowed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's subscription tier from subscribers table
    const { data: subscriber, error: subError } = await supabaseAdmin
      .from('subscribers')
      .select('subscription_tier, subscribed')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Subscriber query error:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = subscriber?.subscription_tier?.toLowerCase() || 'free';
    const isSubscribed = subscriber?.subscribed || false;

    // Advanced features are only available for Pro and Unlimited tiers
    const allowedTiers = ['pro', 'unlimited'];
    const hasAccess = isSubscribed && allowedTiers.includes(tier);

    if (!hasAccess) {
      console.log(`User ${user.id} attempted to use advanced features with tier: ${tier}`);
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          error: 'Advanced features require Pro or Unlimited subscription',
          currentTier: tier 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true, tier }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-advanced-features:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
