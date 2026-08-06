// Edge Function : export-plainte-pdf
// Génère un PDF structuré d'une plainte RPGuard
// Utilise pdf-lib (compatible Deno, sans dépendances browser)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!withTime) return date;
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} a ${time}`;
  } catch { return '—'; }
}

// Nettoie les caractères non-latin1 (pdf-lib StandardFonts = latin1)
function sanitize(s: string): string {
  // Remplacements manuels pour les caractères courants hors latin1
  const text = (s ?? '')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/€/g, 'EUR')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, '-');

  return text
    .replace(/[^\x00-\xFF]/g, '?')   // hors latin1 → ?
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function safe(v: unknown): string {
  return sanitize(String(v ?? '—'));
}

function statusLabel(status: string): string {
  switch (status) {
    case 'Validee':
    case 'Validée':  return 'Validee';
    case 'Rejetee':
    case 'Rejetée':  return 'Rejetee';
    case 'Viral':    return 'Viral';
    default:         return 'En attente';
  }
}

// ── Générateur PDF avec pdf-lib ────────────────────────────────────────────────

async function buildPdf(data: {
  plainte: Record<string, unknown>;
  accuses: { pseudo_rp: string; role: string }[];
  preuves: { file_name: string | null; file_type: string | null; file_path: string }[];
  votes: { vote_type: string }[];
  commentaires: { content: string; created_at: string; profiles?: { username?: string | null } | null }[];
  profile: { username: string | null } | null;
}): Promise<Uint8Array> {
  const { plainte, accuses, preuves, votes, commentaires, profile } = data;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('RPGuard — Rapport de plainte');
  pdfDoc.setAuthor('RPGuard');
  pdfDoc.setCreator('RPGuard');

  // Polices standard (embarquées, pas de téléchargement requis)
  const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Dimensions A4
  const W  = 595.28;
  const H  = 841.89;
  const ML = 50;   // marge gauche
  const MR = 50;   // marge droite
  const TW = W - ML - MR;  // largeur texte = 495.28
  const BOTTOM = 50;

  // Couleurs
  const cPrimary  = rgb(0.067, 0.067, 0.067);  // #111
  const cMuted    = rgb(0.42, 0.45, 0.50);      // gris
  const cAccent   = rgb(0.31, 0.27, 0.90);      // indigo
  const cSuccess  = rgb(0.09, 0.64, 0.29);      // vert
  const cWarning  = rgb(0.85, 0.47, 0.02);      // ambre
  const cDanger   = rgb(0.86, 0.15, 0.15);      // rouge
  const cBgLight  = rgb(0.98, 0.98, 0.99);      // fond section
  const cBorder   = rgb(0.90, 0.91, 0.92);      // séparateur
  const cWhite    = rgb(1, 1, 1);
  const cHeaderBg = rgb(0.067, 0.067, 0.067);

  function statusColor(s: string) {
    const sl = statusLabel(s);
    if (sl === 'Validee')   return cSuccess;
    if (sl === 'Rejetee')   return cDanger;
    if (sl === 'Viral')     return cDanger;
    return cWarning;
  }

  // ── État curseur ─────────────────────────────────────────────────────────────
  let page: PDFPage;
  let y = 0;
  const pages: PDFPage[] = [];

  function addPage() {
    page = pdfDoc.addPage([W, H]);
    pages.push(page);
    y = H - 60;
    // Pied de page
    page.drawText('RPGuard — Document confidentiel genere automatiquement', {
      x: ML, y: 30, size: 7, font: fontNormal, color: cMuted,
    });
    page.drawText(`Page ${pages.length}`, {
      x: W - MR - 40, y: 30, size: 7, font: fontNormal, color: cMuted,
    });
  }

  function checkY(needed: number) {
    if (y - needed < BOTTOM) addPage();
  }

  // ── Helpers de dessin ─────────────────────────────────────────────────────────

  function drawLine(yPos: number) {
    page.drawLine({
      start: { x: ML, y: yPos },
      end:   { x: W - MR, y: yPos },
      thickness: 0.5,
      color: cBorder,
    });
  }

  function separator() {
    checkY(12);
    drawLine(y);
    y -= 12;
  }

  function sectionTitle(title: string) {
    checkY(24);
    y -= 6;
    page.drawText(title.toUpperCase(), {
      x: ML, y, size: 8, font: fontBold, color: cMuted,
    });
    y -= 6;
    drawLine(y);
    y -= 10;
  }

  // Wrap texte simple basé sur largeur en points avec découpage des mots trop longs
  function wrapLines(text: string, maxWidth: number, fontSize: number, font: typeof fontNormal): string[] {
    const words = sanitize(text).replace(/\n+/g, ' \n ').split(' ');
    const lines: string[] = [];
    let current = '';
    
    for (const word of words) {
      if (word === '\n') { 
        lines.push(current.trim()); 
        current = ''; 
        continue; 
      }
      
      // Si le mot seul est plus grand que la largeur max, on le force à la ligne (il débordera un peu mais ne cassera pas la boucle)
      // Ou on pourrait le couper. Pour faire simple, s'il est énorme, on l'ajoute directement si current est vide.
      const test = current ? `${current} ${word}` : word;
      const tw   = font.widthOfTextAtSize(test, fontSize);
      
      if (tw > maxWidth) {
        if (current) {
          lines.push(current.trim());
          current = word;
        } else {
          // Mot énorme qui prend plus d'une ligne à lui seul
          // On le coupe grossièrement
          let chunk = '';
          for (let i = 0; i < word.length; i++) {
            if (font.widthOfTextAtSize(chunk + word[i], fontSize) > maxWidth) {
              lines.push(chunk);
              chunk = word[i];
            } else {
              chunk += word[i];
            }
          }
          current = chunk;
        }
      } else {
        current = test;
      }
    }
    if (current.trim()) lines.push(current.trim());
    return lines.length ? lines : [''];
  }

  function drawLabelValue(label: string, value: string) {
    const linesV = wrapLines(value || '—', TW - 140, 9, fontNormal);
    const needed = Math.max(14, linesV.length * 13 + 4);
    checkY(needed);
    page.drawText(sanitize(label), { x: ML, y, size: 8, font: fontBold, color: cMuted });
    for (const [i, line] of linesV.entries()) {
      page.drawText(line, { x: ML + 140, y: y - i * 12, size: 9, font: fontNormal, color: cPrimary });
    }
    y -= needed;
  }

  function drawBlockText(text: string, bgColor = cBgLight) {
    const lines = wrapLines(text || '—', TW - 16, 9, fontNormal);
    const bh = lines.length * 13 + 16;
    checkY(bh + 6);
    page.drawRectangle({ x: ML, y: y - bh, width: TW, height: bh, color: bgColor, borderColor: cBorder, borderWidth: 0.5, opacity: 1 });
    for (const [i, line] of lines.entries()) {
      page.drawText(line, { x: ML + 8, y: y - 13 - i * 13, size: 9, font: fontNormal, color: cPrimary });
    }
    y -= bh + 8;
  }

  // ── PAGE 1 — EN-TÊTE ──────────────────────────────────────────────────────────

  addPage();

  // Bandeau header sombre
  page.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: cHeaderBg });

  page.drawText('RPGuard', { x: ML, y: H - 35, size: 20, font: fontBold, color: cWhite });
  page.drawText('Rapport officiel de plainte — Document de reclamation formelle', {
    x: ML, y: H - 52, size: 9, font: fontNormal, color: rgb(0.7, 0.7, 0.7),
  });
  page.drawText(`Genere le ${formatDate(new Date().toISOString(), true)}`, {
    x: W - MR - fontNormal.widthOfTextAtSize(`Genere le ${formatDate(new Date().toISOString(), true)}`, 8),
    y: H - 52, size: 8, font: fontNormal, color: rgb(0.63, 0.63, 0.63),
  });

  y = H - 90;

  // Référence
  page.drawText(`Reference : ${safe(plainte.id)}`, { x: ML, y, size: 8, font: fontNormal, color: cMuted });
  y -= 16;

  // Badge statut
  const st = safe(plainte.status ?? 'En attente');
  const stColor = statusColor(st);
  const stW = fontBold.widthOfTextAtSize(st, 9) + 16;
  page.drawRectangle({ x: ML, y: y - 4, width: stW, height: 16, color: rgb(0.97, 0.97, 1.0), borderColor: stColor, borderWidth: 1, borderOpacity: 0.8 });
  page.drawText(st, { x: ML + 8, y: y + 4, size: 9, font: fontBold, color: stColor });

  // Score communauté
  const upvotes   = votes.filter((v) => v.vote_type === 'upvote').length;
  const downvotes = votes.filter((v) => v.vote_type === 'downvote').length;
  const score = upvotes - downvotes;
  page.drawText(
    `Score : ${score >= 0 ? '+' : ''}${score}   |   ${upvotes} soutien${upvotes > 1 ? 's' : ''}   |   ${commentaires.length} commentaire${commentaires.length > 1 ? 's' : ''}`,
    { x: ML + stW + 10, y: y + 4, size: 8, font: fontNormal, color: cMuted }
  );
  y -= 20;

  // Titre principal
  const titleLines = wrapLines(safe(plainte.game_server_name), TW, 15, fontBold);
  for (const [i, line] of titleLines.entries()) {
    page.drawText(line, { x: ML, y: y - i * 18, size: 15, font: fontBold, color: cPrimary });
  }
  y -= titleLines.length * 18 + 6;

  page.drawText(`Abus signale contre : ${safe(plainte.admin_name)}`, {
    x: ML, y, size: 10, font: fontNormal, color: cMuted,
  });
  y -= 20;

  separator();

  // ── INFORMATIONS GÉNÉRALES ───────────────────────────────────────────────────

  sectionTitle('Informations generales');
  drawLabelValue('Serveur / Jeu RP',    safe(plainte.game_server_name));
  drawLabelValue('Admin / Moderateur',  safe(plainte.admin_name));
  const catName = (plainte.categories as Record<string, string> | null)?.name ?? '—';
  drawLabelValue("Categorie d'abus",    safe(catName));
  drawLabelValue('Deposee le',          formatDate(String(plainte.created_at ?? ''), true));
  if (plainte.date_incident) drawLabelValue("Date de l'incident", formatDate(String(plainte.date_incident)));
  drawLabelValue('Statut actuel',       st);
  drawLabelValue('Deposee par',         sanitize(profile?.username ?? 'Anonyme'));
  if (plainte.pseudo_rp) drawLabelValue('Pseudo RP in-game', safe(plainte.pseudo_rp));

  separator();

  // ── DESCRIPTION DES FAITS ───────────────────────────────────────────────────

  sectionTitle('Description des faits');
  drawBlockText(safe(plainte.description));

  if (plainte.raison) {
    checkY(10);
    page.drawText('Motif principal :', { x: ML, y, size: 8, font: fontBold, color: cMuted });
    y -= 12;
    drawBlockText(`"${safe(plainte.raison)}"`, rgb(0.94, 0.94, 1.0));
  }

  if (plainte.contexte) {
    sectionTitle('Contexte supplementaire');
    drawBlockText(safe(plainte.contexte));
  }

  if (plainte.demarche_prealable) {
    sectionTitle('Demarche prealable avec le staff');
    drawBlockText(safe(plainte.demarche_prealable), rgb(0.93, 0.96, 1.0));
    checkY(10);
    page.drawText('Cette section demontre que le plaignant a tente de resoudre le conflit en amont.', {
      x: ML, y, size: 7, font: fontNormal, color: cMuted,
    });
    y -= 12;
  }

  separator();

  // ── INFORMATIONS DE CONTACT ───────────────────────────────────────────────

  const hasContact = plainte.server_discord_link || plainte.server_email || plainte.server_topserveur_link || plainte.accused_discord_tag;
  if (hasContact) {
    sectionTitle('Informations de contact recueillies');
    if (plainte.server_email) drawLabelValue('Email officiel du serveur', safe(plainte.server_email));
    if (plainte.server_discord_link) drawLabelValue('Invitation Discord serveur', safe(plainte.server_discord_link));
    if (plainte.accused_discord_tag) drawLabelValue('Tag Discord de l accuse', safe(plainte.accused_discord_tag));
    if (plainte.server_topserveur_link) drawLabelValue('Page TopServeurs', safe(plainte.server_topserveur_link));
    separator();
  }

  // ── PERSONNES MISES EN CAUSE ────────────────────────────────────────────────

  if (accuses.length > 0) {
    sectionTitle(`Personnes mises en cause (${accuses.length})`);
    for (const [i, acc] of accuses.entries()) {
      checkY(20);
      page.drawRectangle({ x: ML, y: y - 14, width: TW, height: 18, color: cBgLight });
      page.drawText(`${i + 1}. ${sanitize(acc.pseudo_rp)}`, { x: ML + 6, y: y - 5, size: 9, font: fontBold, color: cPrimary });
      const roleText = sanitize(acc.role);
      page.drawText(roleText, { x: W - MR - fontNormal.widthOfTextAtSize(roleText, 8) - 4, y: y - 5, size: 8, font: fontNormal, color: cMuted });
      y -= 22;
    }
    y -= 6;
  }

  // ── PREUVES ────────────────────────────────────────────────────────────────

  const imgPreuves = preuves.filter((p) => p.file_type !== 'video');
  const vidPreuves = preuves.filter((p) => p.file_type === 'video');

  sectionTitle(`Preuves jointes (${preuves.length} fichier${preuves.length > 1 ? 's' : ''})`);

  if (preuves.length === 0) {
    checkY(14);
    page.drawText('Aucune preuve jointe a ce dossier.', { x: ML, y, size: 9, font: fontNormal, color: cMuted });
    y -= 14;
  } else {
    // Boîte info URL
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://rpguard.app';
    const infoLines = [
      'Les fichiers de preuves sont accessibles en ligne sur la page publique de cette plainte.',
      `URL : ${siteUrl}/plaintes/${safe(plainte.id)}`,
    ];
    const infoBh = infoLines.length * 13 + 16;
    checkY(infoBh + 6);
    page.drawRectangle({ x: ML, y: y - infoBh, width: TW, height: infoBh, color: rgb(0.93, 0.96, 1.0) });
    for (const [i, line] of infoLines.entries()) {
      const txt = wrapLines(line, TW - 16, 8, fontNormal);
      for (const [j, tl] of txt.entries()) {
        page.drawText(tl, { x: ML + 8, y: y - 13 - (i + j) * 13, size: 8, font: fontNormal, color: cAccent });
      }
    }
    y -= infoBh + 10;

    if (imgPreuves.length > 0) {
      checkY(10);
      page.drawText(`Captures d'ecran (${imgPreuves.length}) :`, { x: ML, y, size: 8, font: fontBold, color: cMuted });
      y -= 12;
      for (const [i, p] of imgPreuves.entries()) {
        checkY(12);
        page.drawText(`  ${i + 1}. ${sanitize(p.file_name ?? p.file_path)}`, { x: ML, y, size: 9, font: fontNormal, color: cPrimary });
        y -= 13;
      }
    }

    if (vidPreuves.length > 0) {
      checkY(10);
      y -= 4;
      page.drawText(`Videos (${vidPreuves.length}) :`, { x: ML, y, size: 8, font: fontBold, color: cMuted });
      y -= 12;
      for (const [i, p] of vidPreuves.entries()) {
        checkY(12);
        page.drawText(`  ${i + 1}. ${sanitize(p.file_name ?? p.file_path)}`, { x: ML, y, size: 9, font: fontNormal, color: cPrimary });
        y -= 13;
      }
    }
    y -= 6;
  }

  separator();

  // ── SOUTIEN COMMUNAUTÉ ──────────────────────────────────────────────────────

  sectionTitle('Soutien de la communaute');

  // 4 blocs stats
  const statsRow = [
    { label: 'Soutiens',      val: String(upvotes) },
    { label: 'Contestations', val: String(downvotes) },
    { label: 'Score net',     val: `${score >= 0 ? '+' : ''}${score}` },
    { label: 'Commentaires',  val: String(commentaires.length) },
  ];
  const cw = TW / statsRow.length;
  checkY(50);
  for (const [i, stat] of statsRow.entries()) {
    const sx = ML + i * cw;
    page.drawRectangle({ x: sx, y: y - 40, width: cw - 4, height: 40, color: cBgLight });
    const vw = fontBold.widthOfTextAtSize(stat.val, 16);
    page.drawText(stat.val, { x: sx + (cw - 4) / 2 - vw / 2, y: y - 20, size: 16, font: fontBold, color: cPrimary });
    const lw = fontNormal.widthOfTextAtSize(stat.label, 7);
    page.drawText(stat.label, { x: sx + (cw - 4) / 2 - lw / 2, y: y - 33, size: 7, font: fontNormal, color: cMuted });
  }
  y -= 50;

  // Commentaires (max 10)
  if (commentaires.length > 0) {
    checkY(12);
    page.drawText(`Commentaires (${Math.min(commentaires.length, 10)} affiches sur ${commentaires.length}) :`, {
      x: ML, y, size: 8, font: fontBold, color: cMuted,
    });
    y -= 12;

    for (const c of commentaires.slice(0, 10)) {
      const username = sanitize(c.profiles?.username ?? 'Anonyme');
      const lines = wrapLines(c.content, TW - 16, 8.5, fontNormal);
      const bh = lines.length * 12 + 22;
      checkY(bh + 4);
      page.drawRectangle({ x: ML, y: y - bh, width: TW, height: bh, color: cBgLight, borderColor: cBorder, borderWidth: 0.5 });
      page.drawText(`@${username}`, { x: ML + 8, y: y - 12, size: 8, font: fontBold, color: cPrimary });
      const dateText = formatDate(c.created_at, true);
      page.drawText(dateText, {
        x: W - MR - fontNormal.widthOfTextAtSize(dateText, 7) - 4,
        y: y - 12, size: 7, font: fontNormal, color: cMuted,
      });
      for (const [i, line] of lines.entries()) {
        page.drawText(line, { x: ML + 8, y: y - 24 - i * 12, size: 8.5, font: fontNormal, color: cPrimary });
      }
      y -= bh + 6;
    }
  }

  separator();

  // ── INSTRUCTIONS + MENTIONS LÉGALES ────────────────────────────────────────

  sectionTitle('Comment utiliser ce document');

  const instrLines = [
    `Par email : joignez ce PDF en piece jointe. Objet suggere : "[RPGuard] Plainte formelle - ${safe(plainte.game_server_name)}"`,
    'Sur Discord : glissez-deposez ce PDF dans le salon de reclamations du serveur concerne.',
    'En jeu : transmettez-le via un ticket de support ou forum officiel.',
    'Ce document contient tous les faits, les preuves referencees et les soutiens de la communaute.',
  ];
  const instrBh = instrLines.length * 13 + 28;
  checkY(instrBh + 6);
  page.drawRectangle({ x: ML, y: y - instrBh, width: TW, height: instrBh, color: rgb(0.94, 0.99, 0.95), borderColor: cSuccess, borderWidth: 0.6 });
  page.drawText("Instructions d'envoi", { x: ML + 8, y: y - 12, size: 9, font: fontBold, color: cSuccess });
  for (const [i, line] of instrLines.entries()) {
    const wrapped = wrapLines(`• ${line}`, TW - 16, 8.5, fontNormal);
    for (const [j, wl] of wrapped.entries()) {
      page.drawText(wl, { x: ML + 8, y: y - 25 - i * 13 - j * 12, size: 8.5, font: fontNormal, color: cPrimary });
    }
  }
  y -= instrBh + 10;

  const legalText = 'Ce document est genere automatiquement par RPGuard, plateforme communautaire independante. Les faits decrits sont declares par l\'utilisateur sous sa responsabilite. RPGuard ne garantit pas l\'exactitude des informations et ne se substitue pas a une procedure judiciaire.';
  const legalLines = wrapLines(legalText, TW - 16, 8, fontNormal);
  const legalBh = legalLines.length * 12 + 22;
  checkY(legalBh + 6);
  page.drawRectangle({ x: ML, y: y - legalBh, width: TW, height: legalBh, color: rgb(1.0, 0.98, 0.90), borderColor: cWarning, borderWidth: 0.5 });
  page.drawText('Mentions legales', { x: ML + 8, y: y - 12, size: 8, font: fontBold, color: cWarning });
  for (const [i, line] of legalLines.entries()) {
    page.drawText(line, { x: ML + 8, y: y - 24 - i * 12, size: 8, font: fontNormal, color: cPrimary });
  }

  return pdfDoc.save();
}

// ── Handler principal ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const url = new URL(req.url);
    const plainteId = url.searchParams.get('id');
    if (!plainteId) {
      return new Response(JSON.stringify({ error: 'Paramètre id manquant' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Récupère toutes les données en parallèle
    const [
      { data: plainte, error: eP },
      { data: accuses },
      { data: preuves },
      { data: votes },
      { data: commentaires },
    ] = await Promise.all([
      supabase
        .from('plaintes')
        .select('*, categories!plaintes_category_id_fkey(name, color), profiles!plaintes_user_id_fkey(username)')
        .eq('id', plainteId)
        .maybeSingle(),
      supabase.from('accuses').select('pseudo_rp, role').eq('plainte_id', plainteId).order('created_at'),
      supabase.from('preuves').select('file_name, file_type, file_path').eq('plainte_id', plainteId).order('created_at'),
      supabase.from('votes').select('vote_type').eq('plainte_id', plainteId),
      supabase
        .from('commentaires')
        .select('content, created_at, profiles!commentaires_user_id_fkey(username)')
        .eq('plainte_id', plainteId)
        .order('created_at'),
    ]);

    if (eP || !plainte) {
      return new Response(JSON.stringify({ error: 'Plainte introuvable' }), {
        status: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const pdfBytes = await buildPdf({
      plainte: plainte as Record<string, unknown>,
      accuses: (accuses ?? []) as { pseudo_rp: string; role: string }[],
      preuves: (preuves ?? []) as { file_name: string | null; file_type: string | null; file_path: string }[],
      votes:   (votes ?? [])   as { vote_type: string }[],
      commentaires: (commentaires ?? []) as { content: string; created_at: string; profiles?: { username?: string | null } | null }[],
      profile: (plainte as { profiles?: { username: string | null } | null }).profiles ?? null,
    });

    const serverName = String((plainte as Record<string, unknown>).game_server_name ?? 'plainte');
    const filename = `RPGuard_plainte_${serverName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${plainteId.slice(0, 8)}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        ...CORS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export-plainte-pdf]', err);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
