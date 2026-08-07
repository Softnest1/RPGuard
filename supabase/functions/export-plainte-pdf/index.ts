// Edge Function : export-plainte-pdf  v2
// Génère un dossier PDF stratégique de plainte RPGuard destiné à être envoyé
// à l'administration d'un serveur RP, à Discord ou à tout organisme tiers.
// Structure : Page de garde → Faits & Contexte → Preuves → Personnes mises en cause
//             → Soutien communautaire → Modèles d'envoi → Mentions légales
// Dimensions : A4 (595.28 × 841.89 pt) — marges 60/50 pt pour lisibilité maximale

import { createClient }                              from 'npm:@supabase/supabase-js@2';
import { PDFDocument, PDFPage, rgb, StandardFonts }  from 'npm:pdf-lib@1.17.1';

// ── CORS ───────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS TEXTE
// ══════════════════════════════════════════════════════════════════════════════

function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return 'Non precisee';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Date invalide';
    const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!withTime) return date;
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} a ${time}`;
  } catch { return 'Date invalide'; }
}

// Remplace les caractères hors Latin-1 (pdf-lib Standard Fonts = CP1252/Latin-1)
function sanitize(s: string): string {
  return (s ?? '')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
    .replace(/€/g, 'EUR')
    .replace(/['']/g, "'")
    .replace(/[«»""]/g, '"')
    .replace(/[…]/g, '...')
    .replace(/[–—]/g, '-')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/[^\x00-\xFF]/g, '?');
}

function safe(v: unknown, fallback = '—'): string {
  const s = sanitize(String(v ?? ''));
  return s.trim() === '' ? fallback : s;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

// ── Wrap texte : découpe en lignes selon largeur max en points ─────────────────
function wrapLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
): string[] {
  const lines: string[] = [];
  for (const paragraph of sanitize(text).split('\n')) {
    if (paragraph.trim() === '') { lines.push(''); continue; }
    const words = paragraph.split(' ');
    let cur = '';
    for (const word of words) {
      const candidate = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
        if (cur) { lines.push(cur); cur = word; }
        else {
          // Mot trop long : couper caractère par caractère
          let chunk = '';
          for (const ch of word) {
            if (font.widthOfTextAtSize(chunk + ch, fontSize) > maxWidth) {
              lines.push(chunk); chunk = ch;
            } else { chunk += ch; }
          }
          cur = chunk;
        }
      } else { cur = candidate; }
    }
    if (cur) lines.push(cur);
  }
  return lines.length ? lines : [''];
}

// ══════════════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR PDF
// ══════════════════════════════════════════════════════════════════════════════

async function buildPdf(data: {
  plainte:       Record<string, unknown>;
  accuses:       { pseudo_rp: string; role: string }[];
  preuves:       { file_name: string | null; file_type: string | null; file_path: string }[];
  votes:         { vote_type: string }[];
  commentaires:  { content: string; created_at: string; profiles?: { username?: string | null } | null }[];
  profile:       { username: string | null } | null;
}): Promise<Uint8Array> {

  const { plainte, accuses, preuves, votes, commentaires, profile } = data;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('RPGuard — Dossier de plainte officiel');
  pdfDoc.setAuthor('RPGuard — Plateforme de protection des joueurs RP');
  pdfDoc.setSubject(`Plainte contre ${safe(plainte.admin_name)} — ${safe(plainte.game_server_name)}`);
  pdfDoc.setCreator('RPGuard v2 — export-plainte-pdf');
  pdfDoc.setKeywords(['RPGuard', 'plainte', 'RP', safe(plainte.game_server_name)]);

  // ── Polices ──────────────────────────────────────────────────────────────────
  const fontB  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontN  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontI  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBI = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  // ── Dimensions A4 (ISO 216) ──────────────────────────────────────────────────
  const W  = 595.28;   // 210 mm
  const H  = 841.89;   // 297 mm
  const ML = 60;       // marge gauche  (21 mm)
  const MR = 50;       // marge droite  (17,6 mm)
  const MT = 60;       // marge top
  const MB = 55;       // marge bottom (zone pied de page)
  const TW = W - ML - MR;  // 485.28 pt

  // ── Palette de couleurs ──────────────────────────────────────────────────────
  const C = {
    ink:       rgb(0.08, 0.08, 0.09),   // #141517
    muted:     rgb(0.40, 0.43, 0.48),   // gris moyen
    light:     rgb(0.62, 0.65, 0.70),   // gris clair
    border:    rgb(0.87, 0.88, 0.90),   // séparateur
    bgSection: rgb(0.975, 0.975, 0.985),// fond de section
    bgBlue:    rgb(0.93, 0.95, 1.00),   // info bleue
    bgGreen:   rgb(0.92, 0.98, 0.94),   // succès
    bgAmber:   rgb(1.00, 0.97, 0.88),   // avertissement
    bgRed:     rgb(1.00, 0.94, 0.94),   // danger
    accent:    rgb(0.22, 0.35, 0.85),   // indigo
    success:   rgb(0.07, 0.56, 0.25),   // vert
    warning:   rgb(0.78, 0.43, 0.02),   // ambre
    danger:    rgb(0.80, 0.12, 0.12),   // rouge
    header:    rgb(0.06, 0.06, 0.08),   // header sombre
    white:     rgb(1, 1, 1),
    coverBg:   rgb(0.06, 0.06, 0.08),
  };

  function statusColor(st: string) {
    if (/validee|validée|resolue|résolue/i.test(st)) return C.success;
    if (/rejetee|rejetée|perdue/i.test(st))          return C.danger;
    if (/viral/i.test(st))                            return C.danger;
    if (/mediation|médiation/i.test(st))              return C.accent;
    return C.warning;
  }
  function statusBg(st: string) {
    if (/validee|validée|resolue|résolue/i.test(st)) return C.bgGreen;
    if (/rejetee|rejetée|perdue/i.test(st))          return C.bgRed;
    if (/viral/i.test(st))                            return C.bgRed;
    if (/mediation|médiation/i.test(st))              return C.bgBlue;
    return C.bgAmber;
  }

  // ── Gestion curseur multi-pages ──────────────────────────────────────────────
  let page: PDFPage;
  let y    = 0;
  let pageNum = 0;
  const totalPagesRef = { total: 0 }; // mis à jour après construction

  function addPage(showHeader = true) {
    page    = pdfDoc.addPage([W, H]);
    pageNum++;
    totalPagesRef.total = pageNum;
    y = H - MT;

    // En-tête de page (sauf page de garde)
    if (showHeader && pageNum > 1) {
      // Ligne fine en haut
      page.drawLine({ start: { x: ML, y: H - 38 }, end: { x: W - MR, y: H - 38 }, thickness: 0.4, color: C.border });
      page.drawText('RPGuard — Dossier de plainte officiel', {
        x: ML, y: H - 32, size: 7, font: fontN, color: C.light,
      });
      const ref = truncate(safe(plainte.id), 36);
      page.drawText(`Ref. ${ref}`, {
        x: W - MR - fontN.widthOfTextAtSize(`Ref. ${ref}`, 7),
        y: H - 32, size: 7, font: fontN, color: C.light,
      });
      y = H - 52;
    }

    // Pied de page
    page.drawLine({ start: { x: ML, y: MB - 10 }, end: { x: W - MR, y: MB - 10 }, thickness: 0.4, color: C.border });
    page.drawText('RPGuard — Document genere automatiquement — Usage confidentiel', {
      x: ML, y: MB - 22, size: 7, font: fontI, color: C.light,
    });
    // Numéro de page (sera mis à jour avec texte statique pour l'instant)
    page.drawText(`— ${pageNum} —`, {
      x: W / 2 - 10, y: MB - 22, size: 7, font: fontN, color: C.muted,
    });
  }

  function checkY(needed: number) {
    if (y - needed < MB + 5) addPage();
  }

  // ── Primitives de dessin ─────────────────────────────────────────────────────

  function hline(yPos: number, color = C.border, thickness = 0.5) {
    page.drawLine({ start: { x: ML, y: yPos }, end: { x: W - MR, y: yPos }, thickness, color });
  }

  function rect(x: number, yTop: number, w: number, h: number, fill: ReturnType<typeof rgb>, stroke?: ReturnType<typeof rgb>) {
    page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: fill, ...(stroke ? { borderColor: stroke, borderWidth: 0.6 } : {}) });
  }

  // Titre de section avec bandeau coloré à gauche
  function sectionTitle(label: string, color = C.accent) {
    checkY(28);
    y -= 10;
    // Barre latérale couleur
    page.drawRectangle({ x: ML, y: y - 2, width: 3, height: 16, color });
    page.drawText(label.toUpperCase(), { x: ML + 10, y, size: 9, font: fontB, color });
    y -= 6;
    hline(y, color, 0.4);
    y -= 12;
  }

  // Ligne label : valeur avec alignement en colonnes
  function labelRow(label: string, value: string, labelW = 160) {
    const lines = wrapLines(value, TW - labelW - 4, 9.5, fontN);
    const needed = Math.max(16, lines.length * 13 + 6);
    checkY(needed);
    page.drawText(sanitize(label), { x: ML, y, size: 8.5, font: fontB, color: C.muted });
    for (const [i, l] of lines.entries()) {
      page.drawText(l, { x: ML + labelW, y: y - i * 13, size: 9.5, font: fontN, color: C.ink });
    }
    y -= needed;
  }

  // Bloc de texte avec fond coloré + padding interne
  function textBlock(text: string, bg = C.bgSection, borderColor?: ReturnType<typeof rgb>) {
    const lines = wrapLines(text || 'Non renseigne.', TW - 24, 9.5, fontN);
    const bh    = lines.length * 14 + 20;
    checkY(bh + 8);
    rect(ML, y, TW, bh, bg, borderColor ?? C.border);
    for (const [i, l] of lines.entries()) {
      page.drawText(l, { x: ML + 12, y: y - 14 - i * 14, size: 9.5, font: fontN, color: C.ink });
    }
    y -= bh + 10;
  }

  // Bloc citation (italique, fond bleu pâle)
  function quoteBlock(text: string) {
    const lines = wrapLines(`"${text}"`, TW - 30, 9.5, fontI);
    const bh    = lines.length * 14 + 20;
    checkY(bh + 8);
    rect(ML, y, TW, bh, C.bgBlue, C.accent);
    page.drawRectangle({ x: ML, y: y - bh, width: 3, height: bh, color: C.accent });
    for (const [i, l] of lines.entries()) {
      page.drawText(l, { x: ML + 14, y: y - 14 - i * 14, size: 9.5, font: fontI, color: C.ink });
    }
    y -= bh + 10;
  }

  // Alerte colorée (titre + corps)
  function alertBlock(title: string, body: string, bg: ReturnType<typeof rgb>, border: ReturnType<typeof rgb>, titleColor: ReturnType<typeof rgb>) {
    const bodyLines = wrapLines(body, TW - 24, 9, fontN);
    const bh = bodyLines.length * 13 + 32;
    checkY(bh + 8);
    rect(ML, y, TW, bh, bg, border);
    page.drawText(sanitize(title), { x: ML + 12, y: y - 14, size: 9, font: fontB, color: titleColor });
    for (const [i, l] of bodyLines.entries()) {
      page.drawText(l, { x: ML + 12, y: y - 28 - i * 13, size: 9, font: fontN, color: C.ink });
    }
    y -= bh + 10;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE DE GARDE — SECTION 0
  // ══════════════════════════════════════════════════════════════════════════════

  addPage(false);
  y = H; // pleine hauteur pour la garde

  // Bandeau supérieur sombre (toute largeur)
  page.drawRectangle({ x: 0, y: H - 90, width: W, height: 90, color: C.coverBg });

  // ── Icône bouclier dessinée en vecteur (pdf-lib paths) ──────────────────────
  // Bouclier 32×36 pt, centré verticalement dans le bandeau, calé à gauche
  const shX = ML;       // x de départ
  const shY = H - 24;   // y haut du bouclier (dans le bandeau)
  const shW = 28;       // largeur
  const shH = 32;       // hauteur

  // Corps du bouclier : rectangle arrondi en haut + pointe en bas simulée via trapèze
  // On dessine 5 rectangles empilés pour former la silhouette bouclier
  const shieldRows = [
    { yOff: 0,    w: shW,      x: 0 },   // haut
    { yOff: 6,    w: shW,      x: 0 },   // milieu haut
    { yOff: 12,   w: shW - 2,  x: 1 },   // milieu
    { yOff: 18,   w: shW - 8,  x: 4 },   // bas large
    { yOff: 24,   w: shW - 16, x: 8 },   // bas étroit
    { yOff: 28,   w: shW - 22, x: 11 },  // pointe
  ];
  for (const row of shieldRows) {
    page.drawRectangle({
      x: shX + row.x,
      y: shY - row.yOff - 6,
      width:  row.w,
      height: 8,
      color: C.accent,
      opacity: 0.9,
    });
  }
  // Lettre "R" centrale dans le bouclier
  const rW = fontB.widthOfTextAtSize('R', 14);
  page.drawText('R', {
    x: shX + shW / 2 - rW / 2,
    y: shY - shH / 2 + 1,
    size: 14, font: fontB, color: C.white,
  });

  // Texte RPGuard à droite de l'icône
  page.drawText('RPGuard', { x: ML + shW + 10, y: H - 40, size: 26, font: fontB, color: C.white });
  page.drawText('Plateforme independante de protection des joueurs RP', {
    x: ML + shW + 10, y: H - 60, size: 9, font: fontI, color: rgb(0.65, 0.65, 0.70),
  });
  page.drawText(`rpguard.app  |  ${formatDate(new Date().toISOString(), true)}`, {
    x: W - MR - fontN.widthOfTextAtSize(`rpguard.app  |  ${formatDate(new Date().toISOString(), true)}`, 8),
    y: H - 78, size: 8, font: fontN, color: rgb(0.50, 0.52, 0.55),
  });

  y = H - 110;

  // Étiquette "DOSSIER OFFICIEL"
  const tagLabel = 'DOSSIER OFFICIEL DE PLAINTE';
  const tagW = fontB.widthOfTextAtSize(tagLabel, 9) + 20;
  page.drawRectangle({ x: ML, y: y - 6, width: tagW, height: 20, color: C.accent });
  page.drawText(tagLabel, { x: ML + 10, y: y + 5, size: 9, font: fontB, color: C.white });
  y -= 30;

  // Titre : nom du serveur
  const serverNameLines = wrapLines(safe(plainte.game_server_name, 'Serveur inconnu'), TW, 22, fontB);
  for (const [i, l] of serverNameLines.entries()) {
    page.drawText(l, { x: ML, y: y - i * 28, size: 22, font: fontB, color: C.ink });
  }
  y -= serverNameLines.length * 28 + 8;

  // Sous-titre : admin mis en cause
  const adminLine = `Abus signale contre : ${safe(plainte.admin_name)}`;
  page.drawText(adminLine, { x: ML, y, size: 12, font: fontN, color: C.muted });
  y -= 22;

  // Séparateur
  hline(y, C.border);
  y -= 20;

  // Grille d'infos rapides (3 colonnes)
  const st    = safe(plainte.status ?? 'En attente');
  const sCl   = statusColor(st);
  const sBg   = statusBg(st);
  const upvotes   = votes.filter((v) => v.vote_type === 'upvote').length;
  const downvotes = votes.filter((v) => v.vote_type === 'downvote').length;
  const score = upvotes - downvotes;
  const scoreStr = `${score >= 0 ? '+' : ''}${score}`;

  const infoCards = [
    { label: 'Statut',          val: st,                                         clr: sCl,    bg: sBg },
    { label: 'Soutien communaute', val: `${scoreStr} (${upvotes} pour / ${downvotes} contre)`, clr: C.ink,  bg: C.bgSection },
    { label: 'Preuves jointes', val: `${preuves.length} fichier${preuves.length !== 1 ? 's' : ''}`, clr: C.ink, bg: C.bgSection },
  ];
  const cw3 = TW / 3;
  for (const [i, card] of infoCards.entries()) {
    const cx = ML + i * (cw3 + 2);
    rect(cx, y, cw3 - 2, 50, card.bg, C.border);
    page.drawText(card.label.toUpperCase(), { x: cx + 8, y: y - 14, size: 7, font: fontB, color: C.light });
    const valLines = wrapLines(card.val, cw3 - 20, 11, fontB);
    for (const [j, vl] of valLines.entries()) {
      page.drawText(vl, { x: cx + 8, y: y - 30 - j * 14, size: 11, font: fontB, color: card.clr });
    }
  }
  y -= 62;

  // 2e ligne infos
  const infoCards2 = [
    { label: 'Deposee le',   val: formatDate(String(plainte.created_at ?? ''), true) },
    { label: 'Deposant',     val: safe(profile?.username, 'Anonyme') },
    { label: 'Reference',    val: truncate(safe(plainte.id), 32) },
  ];
  for (const [i, card] of infoCards2.entries()) {
    const cx = ML + i * (cw3 + 2);
    rect(cx, y, cw3 - 2, 38, C.bgSection, C.border);
    page.drawText(card.label.toUpperCase(), { x: cx + 8, y: y - 12, size: 7, font: fontB, color: C.light });
    page.drawText(card.val, { x: cx + 8, y: y - 26, size: 9, font: fontN, color: C.ink });
  }
  y -= 50;

  hline(y, C.border);
  y -= 18;

  // Résumé exécutif
  const execSummary = [
    'Ce dossier a ete constitue automatiquement par la plateforme RPGuard a partir',
    "des informations declarees par le plaignant et des donnees de la communaute.",
    'Il reunit les faits, les preuves referencees, les personnes mises en cause,',
    "le soutien de la communaute et des modeles d'envoi prets a l'emploi.",
    '',
    "Ce document est concu pour etre transmis directement a l'administration du",
    'serveur concerne, a Discord (Trust & Safety) ou a tout organisme competent.',
  ];
  for (const l of execSummary) {
    if (!l) { y -= 6; continue; }
    page.drawText(l, { x: ML, y, size: 9.5, font: fontN, color: C.muted });
    y -= 14;
  }
  y -= 10;

  // Table des matières
  hline(y, C.border);
  y -= 16;
  page.drawText('TABLE DES MATIERES', { x: ML, y, size: 8, font: fontB, color: C.accent });
  y -= 14;
  const toc = [
    '1.  Identite du dossier et informations generales',
    '2.  Description detaillee des faits',
    '3.  Contexte et demarche prealable',
    '4.  Personnes mises en cause',
    '5.  Preuves et pieces justificatives',
    '6.  Soutien de la communaute RPGuard',
    '7.  Modeles de messages prets a envoyer',
    '8.  Informations legales et avertissements',
  ];
  for (const item of toc) {
    checkY(14);
    page.drawText(item, { x: ML + 8, y, size: 9, font: fontN, color: C.ink });
    y -= 14;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 2+ — CONTENU
  // ══════════════════════════════════════════════════════════════════════════════

  addPage();

  // ── 1. IDENTITÉ DU DOSSIER ────────────────────────────────────────────────────
  sectionTitle('1. Identite du dossier et informations generales', C.accent);

  labelRow('Serveur / Jeu RP',          safe(plainte.game_server_name));
  labelRow('Moderateur / Admin accuse', safe(plainte.admin_name));
  const catName = (plainte.categories as Record<string, string> | null)?.name;
  labelRow("Categorie d'abus",          safe(catName, 'Non specifiee'));
  labelRow('Date du depot',             formatDate(String(plainte.created_at ?? ''), true));
  labelRow("Date de l'incident",        plainte.date_incident ? formatDate(String(plainte.date_incident)) : 'Non precisee');
  labelRow('Statut actuel',             st);
  labelRow('Deposee par',               safe(profile?.username, 'Anonyme'));
  labelRow('Pseudo RP in-game',         safe(plainte.pseudo_rp, 'Non renseigne'));
  labelRow('Reference unique',          safe(plainte.id));
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://rpguard.app';
  labelRow('Lien public du dossier',    `${siteUrl}/plaintes/${safe(plainte.id)}`);

  // Contacts du serveur
  const hasContact = plainte.server_discord_link || plainte.server_email ||
                     plainte.server_topserveur_link || plainte.accused_discord_tag;
  if (hasContact) {
    checkY(16);
    y -= 4;
    page.drawText('Coordonnees recueillies :', { x: ML, y, size: 8.5, font: fontB, color: C.muted });
    y -= 14;
    if (plainte.server_email)         labelRow('Email officiel',          safe(plainte.server_email));
    if (plainte.server_discord_link)  labelRow('Discord (invitation)',    safe(plainte.server_discord_link));
    if (plainte.accused_discord_tag)  labelRow('Discord de l accuse',     safe(plainte.accused_discord_tag));
    if (plainte.server_topserveur_link) labelRow('TopServeurs',           safe(plainte.server_topserveur_link));
  }

  // ── 2. DESCRIPTION DES FAITS ──────────────────────────────────────────────────
  sectionTitle('2. Description detaillee des faits', C.accent);

  alertBlock(
    'DECLARATION DU PLAIGNANT',
    'Le texte ci-dessous est la declaration exacte et integrale du plaignant, telle que soumise sur RPGuard.',
    C.bgBlue, C.accent, C.accent,
  );
  textBlock(safe(plainte.description, 'Aucune description fournie.'));

  if (plainte.raison) {
    checkY(16);
    page.drawText('Motif principal declare :', { x: ML, y, size: 8.5, font: fontB, color: C.muted });
    y -= 14;
    quoteBlock(safe(plainte.raison));
  }

  // ── 3. CONTEXTE ET DÉMARCHE ───────────────────────────────────────────────────
  sectionTitle('3. Contexte et demarche prealable', C.accent);

  if (plainte.contexte) {
    checkY(16);
    page.drawText('Contexte fourni par le plaignant :', { x: ML, y, size: 8.5, font: fontB, color: C.muted });
    y -= 14;
    textBlock(safe(plainte.contexte));
  } else {
    textBlock('Aucun contexte supplementaire n\'a ete fourni pour ce dossier.', C.bgSection);
  }

  if (plainte.demarche_prealable) {
    checkY(16);
    page.drawText('Demarche prealable avec le staff :', { x: ML, y, size: 8.5, font: fontB, color: C.muted });
    y -= 14;
    textBlock(safe(plainte.demarche_prealable), C.bgBlue, );
    alertBlock(
      'NOTE IMPORTANTE',
      'Cette section prouve que le plaignant a tente de resoudre le conflit en interne avant de saisir RPGuard. '
      + 'Cela renforce la credibilite de la plainte et demontre la bonne foi du plaignant.',
      C.bgGreen, C.success, C.success,
    );
  } else {
    alertBlock(
      'AUCUNE DEMARCHE PREALABLE',
      'Le plaignant n\'a pas indique avoir contacte le staff du serveur avant de deposer ce dossier. '
      + 'Cela ne disqualifie pas la plainte, mais le destinataire peut en tenir compte.',
      C.bgAmber, C.warning, C.warning,
    );
  }

  // ── 4. PERSONNES MISES EN CAUSE ───────────────────────────────────────────────
  sectionTitle(`4. Personnes mises en cause (${accuses.length > 0 ? accuses.length : 'aucune enregistree'})`, C.accent);

  if (accuses.length === 0) {
    textBlock(
      `Seul l'administrateur principal "${safe(plainte.admin_name)}" est cite dans ce dossier. `
      + 'Aucune autre personne n\'a ete ajoutee comme co-accusee.',
      C.bgSection,
    );
  } else {
    // Ligne principale (admin)
    checkY(24);
    rect(ML, y, TW, 24, C.coverBg);
    page.drawText('ACCUSE PRINCIPAL (admin du serveur)', { x: ML + 10, y: y - 10, size: 8, font: fontB, color: C.white });
    page.drawText(safe(plainte.admin_name), { x: ML + 10, y: y - 20, size: 11, font: fontB, color: rgb(0.85, 0.87, 1.0) });
    y -= 32;

    // Co-accusés
    if (accuses.length > 0) {
      checkY(16);
      page.drawText('Autres personnes mises en cause :', { x: ML, y, size: 8.5, font: fontB, color: C.muted });
      y -= 14;
      for (const [i, acc] of accuses.entries()) {
        checkY(22);
        rect(ML, y, TW, 22, C.bgSection, C.border);
        page.drawText(`${i + 1}.  ${sanitize(acc.pseudo_rp)}`, { x: ML + 10, y: y - 8, size: 10, font: fontB, color: C.ink });
        const roleLabel = sanitize(acc.role) || 'Role non precise';
        page.drawText(roleLabel, {
          x: W - MR - fontN.widthOfTextAtSize(roleLabel, 8.5) - 8,
          y: y - 8, size: 8.5, font: fontI, color: C.muted,
        });
        y -= 28;
      }
    }
    y -= 4;
  }

  // ── 5. PREUVES ────────────────────────────────────────────────────────────────
  sectionTitle(`5. Preuves et pieces justificatives (${preuves.length})`, C.accent);

  const imgP  = preuves.filter((p) => p.file_type && p.file_type !== 'video');
  const vidP  = preuves.filter((p) => p.file_type === 'video');
  const otherP = preuves.filter((p) => !p.file_type);

  alertBlock(
    'ACCES AUX FICHIERS DE PREUVES',
    `Les fichiers originaux (captures d'ecran, videos, documents) sont heberges sur RPGuard et `
    + `accessibles via le lien public de ce dossier :\n${siteUrl}/plaintes/${safe(plainte.id)}\n\n`
    + 'Pour toute procedure formelle, utilisez ce lien comme reference et joignez les fichiers telecharges directement.',
    C.bgBlue, C.accent, C.accent,
  );

  if (preuves.length === 0) {
    alertBlock(
      'AUCUNE PREUVE JOINTE',
      'Le plaignant n\'a pas joint de fichiers de preuves a ce dossier. '
      + 'Cela ne signifie pas que les faits sont faux, mais la plainte repose uniquement sur la declaration textuelle. '
      + 'La communaute a neanmoins examine et vote sur ce dossier.',
      C.bgAmber, C.warning, C.warning,
    );
  } else {
    if (imgP.length > 0) {
      checkY(16);
      page.drawText(`Captures d'ecran et images (${imgP.length}) :`, { x: ML, y, size: 8.5, font: fontB, color: C.muted });
      y -= 14;
      for (const [i, p] of imgP.entries()) {
        checkY(16);
        const fname = sanitize(p.file_name ?? p.file_path);
        page.drawText(`   ${i + 1}.  ${fname}`, { x: ML, y, size: 9.5, font: fontN, color: C.ink });
        y -= 14;
      }
      y -= 4;
    }
    if (vidP.length > 0) {
      checkY(16);
      page.drawText(`Videos (${vidP.length}) :`, { x: ML, y, size: 8.5, font: fontB, color: C.muted });
      y -= 14;
      for (const [i, p] of vidP.entries()) {
        checkY(16);
        const fname = sanitize(p.file_name ?? p.file_path);
        page.drawText(`   ${i + 1}.  ${fname}`, { x: ML, y, size: 9.5, font: fontN, color: C.ink });
        y -= 14;
      }
      y -= 4;
    }
    if (otherP.length > 0) {
      checkY(16);
      page.drawText(`Autres fichiers (${otherP.length}) :`, { x: ML, y, size: 8.5, font: fontB, color: C.muted });
      y -= 14;
      for (const [i, p] of otherP.entries()) {
        checkY(16);
        const fname = sanitize(p.file_name ?? p.file_path);
        page.drawText(`   ${i + 1}.  ${fname}`, { x: ML, y, size: 9.5, font: fontN, color: C.ink });
        y -= 14;
      }
    }
    checkY(16);
    y -= 4;
    page.drawText(
      `Total : ${preuves.length} fichier${preuves.length > 1 ? 's' : ''} `
      + `(${imgP.length} image${imgP.length > 1 ? 's' : ''}, ${vidP.length} video${vidP.length > 1 ? 's' : ''})`,
      { x: ML, y, size: 8.5, font: fontB, color: C.muted },
    );
    y -= 14;
  }

  // ── 6. SOUTIEN COMMUNAUTAIRE ──────────────────────────────────────────────────
  sectionTitle(`6. Soutien de la communaute RPGuard`, C.accent);

  // 4 cases stats
  const statCards = [
    { label: 'Soutiens',           val: String(upvotes),   color: C.success },
    { label: 'Contestations',      val: String(downvotes), color: C.danger  },
    { label: 'Score net',          val: scoreStr,          color: score >= 0 ? C.success : C.danger },
    { label: 'Commentaires',       val: String(commentaires.length), color: C.accent },
  ];
  const cw4 = (TW - 6) / 4;
  checkY(58);
  for (const [i, sc] of statCards.entries()) {
    const cx = ML + i * (cw4 + 2);
    rect(cx, y, cw4, 52, C.bgSection, C.border);
    const vw = fontB.widthOfTextAtSize(sc.val, 18);
    page.drawText(sc.val, { x: cx + cw4 / 2 - vw / 2, y: y - 24, size: 18, font: fontB, color: sc.color });
    const lw = fontN.widthOfTextAtSize(sc.label, 7.5);
    page.drawText(sc.label, { x: cx + cw4 / 2 - lw / 2, y: y - 40, size: 7.5, font: fontN, color: C.muted });
  }
  y -= 62;

  // Interprétation
  const communityVerdict = score >= 5
    ? `La communaute soutient massivement cette plainte (score : ${scoreStr}). Ce soutien renforce significativement la credibilite du dossier.`
    : score > 0
    ? `La communaute soutient cette plainte a majorite (score : ${scoreStr}). Le dossier beneficie d'un appui communautaire positif.`
    : score === 0
    ? `La communaute est divisee sur ce dossier (score : ${scoreStr}). Le dossier merite un examen impartial des faits.`
    : `La communaute conteste cette plainte (score : ${scoreStr}). Les faits sont disputes et doivent etre examines avec attention.`;
  alertBlock('VERDICT COMMUNAUTAIRE', communityVerdict,
    score >= 0 ? C.bgGreen : C.bgAmber,
    score >= 0 ? C.success : C.warning,
    score >= 0 ? C.success : C.warning,
  );

  // Commentaires (tous affichés, paginés automatiquement)
  if (commentaires.length > 0) {
    checkY(16);
    page.drawText(`Commentaires de la communaute (${commentaires.length} au total) :`, {
      x: ML, y, size: 8.5, font: fontB, color: C.muted,
    });
    y -= 14;

    for (const [i, c] of commentaires.entries()) {
      const username   = sanitize(c.profiles?.username ?? 'Anonyme');
      const dateStr    = formatDate(c.created_at, true);
      const bodyLines  = wrapLines(c.content || '(vide)', TW - 24, 9, fontN);
      const bh         = bodyLines.length * 13 + 30;
      checkY(bh + 6);
      rect(ML, y, TW, bh, i % 2 === 0 ? C.bgSection : C.white, C.border);
      page.drawText(`@${username}`, { x: ML + 10, y: y - 13, size: 9, font: fontB, color: C.ink });
      page.drawText(dateStr, {
        x: W - MR - fontN.widthOfTextAtSize(dateStr, 8) - 8,
        y: y - 13, size: 8, font: fontI, color: C.light,
      });
      for (const [j, l] of bodyLines.entries()) {
        page.drawText(l, { x: ML + 10, y: y - 26 - j * 13, size: 9, font: fontN, color: C.ink });
      }
      y -= bh + 4;
    }
    y -= 4;
  }

  // ── 7. MODÈLES D'ENVOI ────────────────────────────────────────────────────────
  sectionTitle('7. Modeles de messages prets a envoyer', C.success);

  const serverName = safe(plainte.game_server_name, 'le serveur');
  const adminName  = safe(plainte.admin_name, 'l\'administrateur');
  const refId      = safe(plainte.id).slice(0, 8).toUpperCase();

  // Modèle email
  alertBlock('MODELE EMAIL (a copier-coller)', [
    `Objet : [RPGuard #${refId}] Plainte formelle — Abus de moderation`,
    '',
    'Madame, Monsieur,',
    '',
    `Je me permets de vous contacter suite a un incident survenu sur votre serveur "${serverName}".`,
    `Un abus de moderation commis par ${adminName} a ete signale et documente`,
    'sur la plateforme RPGuard, plateforme communautaire independante de protection des joueurs RP.',
    '',
    'Vous trouverez en piece jointe le dossier complet incluant :',
    `— La description detaillee des faits (Ref. RPGuard #${refId})`,
    `— ${preuves.length} preuve${preuves.length > 1 ? 's' : ''} jointe${preuves.length > 1 ? 's' : ''} (captures, videos)`,
    `— Le soutien de ${upvotes} membre${upvotes > 1 ? 's' : ''} de la communaute`,
    '',
    'Je vous demande de bien vouloir examiner ce dossier et de prendre les mesures appropriees.',
    `Dossier en ligne : ${siteUrl}/plaintes/${safe(plainte.id)}`,
    '',
    'Dans l\'attente de votre reponse, veuillez agreer mes salutations.',
    `— ${safe(profile?.username, 'Le plaignant')}`,
  ].join('\n'), C.bgSection, C.border);

  // Modèle Discord
  alertBlock('MODELE DISCORD (ticket / message direct)', [
    `**[RPGuard #${refId}] Plainte formelle — Abus de moderation**`,
    '',
    `Bonjour, je vous contacte concernant un abus commis par **${adminName}** sur le serveur **${serverName}**.`,
    '',
    `J'ai depose un dossier complet sur RPGuard (plateforme independante) :`,
    `> ${siteUrl}/plaintes/${safe(plainte.id)}`,
    '',
    `Le dossier inclut **${preuves.length} preuve${preuves.length > 1 ? 's' : ''}** et a recu le soutien de **${upvotes} membre${upvotes > 1 ? 's' : ''}** de la communaute.`,
    '',
    `Referez-vous au PDF joint (Ref. #${refId}) pour tous les details.`,
    'Merci de traiter cette demande dans les meilleurs delais.',
  ].join('\n'), C.bgBlue, C.accent);

  // Modèle forum/ticket in-game
  alertBlock('MODELE TICKET IN-GAME / FORUM', [
    `Titre : [Plainte #${refId}] Abus de moderation — ${adminName}`,
    '',
    `Bonjour, je signale un abus de la part de ${adminName} sur ce serveur.`,
    `Un dossier documente a ete constitue sur RPGuard (Ref. #${refId}).`,
    '',
    `Preuves et details complets : ${siteUrl}/plaintes/${safe(plainte.id)}`,
    `Soutien communautaire : ${upvotes} votes pour, score net ${scoreStr}.`,
    '',
    'Merci de prendre connaissance de ce dossier et d\'apporter une reponse officielle.',
  ].join('\n'), C.bgGreen, C.success);

  // Conseils stratégiques
  sectionTitle('Conseils strategiques pour maximiser l\'impact', C.success);

  const conseils = [
    '1.  Envoyez d\'abord en prive : donnez une chance au staff de repondre avant de rendre public.',
    '2.  Conservez une copie de ce PDF et du lien RPGuard comme preuve de votre signalement.',
    '3.  Si pas de reponse sous 48h : partagez le lien RPGuard dans les salons publics du serveur.',
    '4.  Discord Trust & Safety (discord.com/safety) accepte les signalements avec pieces jointes.',
    '5.  Sur TopServeurs et autres annuaires : vous pouvez referencer ce dossier dans votre avis.',
    '6.  Ne supprimez jamais vos preuves originales : gardez les captures et videos en local.',
    '7.  Invitez d\'autres joueurs victimes a rejoindre le dossier comme co-plaignants sur RPGuard.',
  ];
  for (const c of conseils) {
    checkY(16);
    page.drawText(sanitize(c), { x: ML, y, size: 9.5, font: fontN, color: C.ink });
    y -= 15;
  }
  y -= 6;

  // ── 8. MENTIONS LÉGALES ───────────────────────────────────────────────────────
  sectionTitle('8. Informations legales et avertissements', C.warning);

  alertBlock(
    'AVERTISSEMENT LEGAL',
    'Ce document est genere automatiquement par RPGuard, plateforme communautaire independante. '
    + 'Les faits decrits sont declares par l\'utilisateur sous sa seule responsabilite. '
    + 'RPGuard ne garantit pas l\'exactitude des informations et ne se substitue pas a une procedure judiciaire officielle. '
    + 'Ce dossier constitue une reclamation formelle communautaire et ne cree pas d\'obligation legale pour le destinataire.',
    C.bgAmber, C.warning, C.warning,
  );

  alertBlock(
    'PROTECTION DES DONNEES',
    'Les donnees personnelles contenues dans ce document ont ete fournies volontairement par le plaignant. '
    + 'Conformement au RGPD (Reglement General sur la Protection des Donnees), '
    + 'le traitement de ces donnees est limite a la gestion de la plainte. '
    + 'Ce document ne doit pas etre diffuse au-dela du cercle des personnes directement concernees.',
    C.bgSection, C.border, C.muted,
  );

  checkY(24);
  hline(y, C.border);
  y -= 14;
  page.drawText(`Document genere le ${formatDate(new Date().toISOString(), true)} — RPGuard — ${siteUrl}`, {
    x: W / 2 - fontI.widthOfTextAtSize(`Document genere le ${formatDate(new Date().toISOString(), true)} — RPGuard — ${siteUrl}`, 8) / 2,
    y, size: 8, font: fontI, color: C.light,
  });

  return pdfDoc.save();
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const url       = new URL(req.url);
    const plainteId = url.searchParams.get('id');
    if (!plainteId) {
      return new Response(JSON.stringify({ error: 'Parametre id manquant' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [
      { data: plainte, error: eP },
      { data: accuses  },
      { data: preuves  },
      { data: votes    },
      { data: commentaires },
    ] = await Promise.all([
      sb.from('plaintes')
        .select(`*, categories!plaintes_category_id_fkey(name, color),
                     profiles!plaintes_user_id_fkey(username)`)
        .eq('id', plainteId)
        .maybeSingle(),
      sb.from('accuses').select('pseudo_rp, role').eq('plainte_id', plainteId).order('created_at'),
      sb.from('preuves').select('file_name, file_type, file_path').eq('plainte_id', plainteId).order('created_at'),
      sb.from('votes').select('vote_type').eq('plainte_id', plainteId),
      sb.from('commentaires')
        .select('content, created_at, profiles!commentaires_user_id_fkey(username)')
        .eq('plainte_id', plainteId)
        .order('created_at'),
    ]);

    if (eP || !plainte) {
      return new Response(JSON.stringify({ error: 'Plainte introuvable' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const pdfBytes = await buildPdf({
      plainte:      plainte as Record<string, unknown>,
      accuses:      (accuses       ?? []) as { pseudo_rp: string; role: string }[],
      preuves:      (preuves       ?? []) as { file_name: string | null; file_type: string | null; file_path: string }[],
      votes:        (votes         ?? []) as { vote_type: string }[],
      commentaires: (commentaires  ?? []) as { content: string; created_at: string; profiles?: { username?: string | null } | null }[],
      profile:      (plainte as { profiles?: { username: string | null } | null }).profiles ?? null,
    });

    const srvName  = String((plainte as Record<string, unknown>).game_server_name ?? 'plainte');
    const filename = `RPGuard_dossier_${srvName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${plainteId.slice(0, 8)}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        ...CORS,
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    });
  } catch (err) {
    console.error('[export-plainte-pdf v2]', err);
    return new Response(JSON.stringify({ error: 'Erreur interne serveur' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

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
