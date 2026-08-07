import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation locale du mot de passe (même règles que le frontend)
function validatePassword(pwd: string): string | null {
  if (!pwd || typeof pwd !== 'string') return 'Mot de passe requis';
  if (pwd.length < 8)   return 'Mot de passe trop court (min. 8 caractères)';
  if (pwd.length > 128) return 'Mot de passe trop long (max. 128 caractères)';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Corps de requête invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { profile_id, new_password, username } = body;

    // Validation des paramètres requis
    if (!profile_id || typeof profile_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Paramètre profile_id manquant ou invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Paramètre username manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const pwdError = validatePassword(new_password);
    if (pwdError) {
      return new Response(
        JSON.stringify({ error: pwdError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Client admin avec service_role — jamais exposé côté client
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Vérifier que le profile_id correspond bien au username fourni (anti-usurpation)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, username')
      .eq('id', profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profil introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Vérification croisée username ↔ profile_id
    if (profile.username?.toLowerCase() !== username.trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Les informations ne correspondent pas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Mettre à jour le mot de passe via Admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      profile_id,
      { password: new_password },
    );

    if (updateError) {
      console.error('[reset-password] Erreur mise à jour mot de passe:', updateError.message);
      return new Response(
        JSON.stringify({ error: 'Impossible de mettre à jour le mot de passe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[reset-password] Mot de passe réinitialisé pour profile_id=${profile_id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[reset-password] Erreur inattendue:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
