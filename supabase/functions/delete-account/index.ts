import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Pré-vol CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Vérifier que l'utilisateur est authentifié ──────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé — token manquant.' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // Client avec la clé anon + token user pour récupérer l'identité
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Session invalide ou expirée.' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 2. Lire et valider le corps de la requête ─────────────────────────
    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corps de requête JSON invalide.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    const { password } = body;
    if (!password || typeof password !== 'string' || password.length < 1) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe est requis pour confirmer la suppression.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 3. Re-authentification — vérifier le mot de passe actuel ─────────
    // Le compte utilise username@rpguard.app comme email fictif
    const email = user.email;
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email de compte introuvable.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    const { error: reauthErr } = await supabaseUser.auth.signInWithPassword({ email, password });
    if (reauthErr) {
      return new Response(
        JSON.stringify({ error: 'Mot de passe incorrect. Suppression annulée.' }),
        { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 4. Client service-role pour les opérations privilégiées ──────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const userId = user.id;

    // ── 5. Supprimer les fichiers Storage de l'utilisateur ────────────────
    // 5a. Avatar dans le bucket "avatars"
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f: { name: string }) => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from('avatars').remove(paths);
      }
    } catch {
      // Pas bloquant — continuer même si l'avatar n'existe pas
    }

    // 5b. Preuves dans le bucket "preuves" (chaque preuve est dans preuves/<plainte_id>/...)
    // On récupère les chemins via la table preuves avant suppression en cascade
    try {
      const { data: preuves } = await supabaseAdmin
        .from('preuves')
        .select('file_path')
        .eq('user_id', userId);

      if (preuves && preuves.length > 0) {
        const paths = preuves
          .map((p: { file_path: string }) => p.file_path)
          .filter(Boolean);
        if (paths.length > 0) {
          await supabaseAdmin.storage.from('preuves').remove(paths);
        }
      }
    } catch {
      // Pas bloquant
    }

    // ── 6. Supprimer le profil public (cascade vers toutes les données) ───
    // profiles.id → auth.users(id) ON DELETE CASCADE
    // Donc supprimer auth.user supprime profiles → cascade vers plaintes, votes, etc.
    // On supprime d'abord le profile manuellement pour déclencher la cascade DB
    const { error: profileDelErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDelErr) {
      console.error('Erreur suppression profile:', profileDelErr.message);
      // On continue quand même — la suppression auth.user forcera la cascade
    }

    // ── 7. Supprimer le compte Supabase Auth (service role requis) ────────
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(
        JSON.stringify({ error: `Erreur lors de la suppression du compte : ${deleteErr.message}` }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 8. Succès ─────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, message: 'Compte supprimé avec succès.' }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('Erreur inattendue delete-account:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur inattendue.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
