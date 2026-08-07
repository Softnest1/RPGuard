// Edge Function : send-contact-email
// Reçoit les soumissions du formulaire /contact et les transmet à rpguard.service@outlook.com
// Sécurité : sanitize, longueur max, rate-limit côté DB optionnel

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL   = 'rpguard.service@outlook.com';
const FROM_EMAIL    = 'RPGuard <onboarding@resend.dev>'; // domaine Resend sandbox par défaut
const MAX_EMAIL_LEN = 254;
const MAX_MSG_LEN   = 4000;
const MAX_SUBJ_LEN  = 200;

function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/[\r\n]{3,}/g, '\n\n').trim();
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= MAX_EMAIL_LEN;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let body: { email?: string; subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const email   = sanitize(String(body.email   ?? '')).slice(0, MAX_EMAIL_LEN);
  const subject = sanitize(String(body.subject ?? '')).slice(0, MAX_SUBJ_LEN);
  const message = sanitize(String(body.message ?? '')).slice(0, MAX_MSG_LEN);

  // Validation
  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Adresse email invalide.' }), {
      status: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
  if (message.length < 10) {
    return new Response(JSON.stringify({ error: 'Le message est trop court (minimum 10 caractères).' }), {
      status: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  if (!resendKey) {
    console.error('[send-contact-email] RESEND_API_KEY manquante');
    return new Response(JSON.stringify({ error: 'Configuration email manquante.' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const subjectLine = subject
    ? `[RPGuard Contact] ${subject}`
    : '[RPGuard Contact] Nouvelle demande';

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
      <div style="border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:24px">
        <h1 style="font-size:18px;font-weight:600;margin:0">📬 Nouveau message via RPGuard</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
        <tr>
          <td style="padding:8px 0;color:#6b7280;width:120px;vertical-align:top">De</td>
          <td style="padding:8px 0;font-weight:500">${email}</td>
        </tr>
        ${subject ? `<tr>
          <td style="padding:8px 0;color:#6b7280;vertical-align:top">Sujet</td>
          <td style="padding:8px 0;font-weight:500">${subject}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 0;color:#6b7280;vertical-align:top">Date</td>
          <td style="padding:8px 0">${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</td>
        </tr>
      </table>
      <div style="padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap">${message}</p>
      </div>
      <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:0">
        Pour répondre, utilisez directement l'adresse email de l'expéditeur : <strong>${email}</strong><br>
        Cet email est généré automatiquement par RPGuard.
      </p>
    </div>
  `;

  // Envoi via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to:   [ADMIN_EMAIL],
      reply_to: email,
      subject: subjectLine,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[send-contact-email] Erreur Resend:', err);
    return new Response(JSON.stringify({ error: 'Échec de l\'envoi. Réessayez plus tard.' }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[send-contact-email] Message envoyé de ${email} — sujet: ${subjectLine}`);
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
