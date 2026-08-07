// Edge Function : notify-plainte
// Rôle : envoyer un email de notification pour chaque nouvelle plainte (notify_sent = false)
// Déclenchée par pg_cron toutes les 5 minutes via pg_net
// Utilise Resend API pour un envoi fiable

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM_EMAIL = 'RPGuard <onboarding@resend.dev>';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminEmail   = Deno.env.get('ADMIN_NOTIFY_EMAIL') ?? '';

    const supabase = createClient(supabaseUrl, serviceKey);

    // Récupère les plaintes non notifiées (max 20 par run pour éviter les timeouts)
    const { data: plaintes, error } = await supabase
      .from('plaintes')
      .select('id, game_server_name, admin_name, description, created_at, status')
      .eq('notify_sent', false)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;
    if (!plaintes || plaintes.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const plainte of plaintes) {
      const plainteUrl = `${Deno.env.get('SITE_URL') ?? supabaseUrl}/plaintes/${plainte.id}`;
      const descPreview = plainte.description.slice(0, 200) + (plainte.description.length > 200 ? '…' : '');

      // Email HTML structuré
      const htmlBody = `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
          <div style="border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:24px">
            <h1 style="font-size:18px;font-weight:600;margin:0">🚨 Nouvelle plainte déposée sur RPGuard</h1>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr>
              <td style="padding:8px 0;color:#6b7280;width:140px">Serveur visé</td>
              <td style="padding:8px 0;font-weight:500">${plainte.game_server_name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Admin/Modérateur</td>
              <td style="padding:8px 0;font-weight:500">${plainte.admin_name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Déposée le</td>
              <td style="padding:8px 0">${new Date(plainte.created_at).toLocaleString('fr-FR')}</td>
            </tr>
          </table>
          <div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${descPreview}</p>
          </div>
          <a href="${plainteUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500">
            Voir la plainte complète →
          </a>
          <p style="margin-top:32px;font-size:12px;color:#9ca3af">
            Cet email est envoyé automatiquement par RPGuard. La plainte est publiquement visible sur le site.
          </p>
        </div>
      `;

      // Envoi via Resend
      const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
      if (adminEmail && resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to:   [adminEmail],
            subject: `[RPGuard] Nouvelle plainte — ${plainte.game_server_name}`,
            html: htmlBody,
            reply_to: adminEmail,
          }),
        }).catch(() => {
          console.warn(`[notify-plainte] Email non envoyé pour plainte ${plainte.id}`);
        });
      } else if (!resendKey) {
        console.warn('[notify-plainte] RESEND_API_KEY manquante — email non envoyé');
      }

      // Marque comme notifiée (idempotence — même si l'email échoue, on ne re-notifie pas)
      await supabase
        .from('plaintes')
        .update({ notify_sent: true })
        .eq('id', plainte.id);

      console.log(`[notify-plainte] Traité plainte ${plainte.id} — ${plainte.game_server_name}`);
      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[notify-plainte] Erreur:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
