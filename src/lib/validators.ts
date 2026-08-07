// Validation centralisée — RPGuard
// ════════════════════════════════════════════════════════════════════════════
// Source unique de vérité pour toutes les règles de validation côté client.
// Synchronisé avec LIMITS dans api.ts et les règles Firestore (firestore.rules).
// Utilisé dans SoumettreePage, InscriptionPage, TableauDeBordPage, etc.
// ════════════════════════════════════════════════════════════════════════════

import { LIMITS, ALLOWED_MIME_ALL } from '@/lib/api';

// ── Type résultat de validation ───────────────────────────────────────────────

export interface ValidationResult {
  valid:   boolean;
  /** Liste des erreurs — vide si valid = true */
  errors:  string[];
  /** Première erreur (raccourci pour les formulaires) */
  error:   string | null;
}

function ok(): ValidationResult {
  return { valid: true, errors: [], error: null };
}
function fail(errors: string[]): ValidationResult {
  return { valid: false, errors, error: errors[0] ?? 'Valeur invalide' };
}

// ── Champs texte ──────────────────────────────────────────────────────────────

export function validateUsername(value: string): ValidationResult {
  const v = value.trim();
  const errs: string[] = [];
  if (!v)                             errs.push('Le pseudo est requis.');
  else if (v.length < LIMITS.username.min) errs.push(`Minimum ${LIMITS.username.min} caractères.`);
  else if (v.length > LIMITS.username.max) errs.push(`Maximum ${LIMITS.username.max} caractères.`);
  else if (!/^[a-zA-Z0-9_\-. ]+$/.test(v)) errs.push('Uniquement lettres, chiffres, tirets, underscores et espaces.');
  return errs.length ? fail(errs) : ok();
}

export function validatePassword(value: string): ValidationResult {
  const errs: string[] = [];
  if (!value)             errs.push('Le mot de passe est requis.');
  else if (value.length < 6)  errs.push('Minimum 6 caractères.');
  else if (value.length > 128) errs.push('Maximum 128 caractères.');
  return errs.length ? fail(errs) : ok();
}

export function validatePasswordConfirm(password: string, confirm: string): ValidationResult {
  if (!confirm)                    return fail(['Confirmez votre mot de passe.']);
  if (password !== confirm)        return fail(['Les mots de passe ne correspondent pas.']);
  return ok();
}

export function validateServerName(value: string): ValidationResult {
  const v = value.trim();
  const errs: string[] = [];
  if (!v)                                    errs.push('Le nom du serveur est requis.');
  else if (v.length < LIMITS.game_server_name.min) errs.push(`Minimum ${LIMITS.game_server_name.min} caractères.`);
  else if (v.length > LIMITS.game_server_name.max) errs.push(`Maximum ${LIMITS.game_server_name.max} caractères.`);
  return errs.length ? fail(errs) : ok();
}

export function validateAdminName(value: string): ValidationResult {
  const v = value.trim();
  const errs: string[] = [];
  if (!v)                               errs.push('Le nom de l\'admin est requis.');
  else if (v.length < LIMITS.admin_name.min) errs.push(`Minimum ${LIMITS.admin_name.min} caractères.`);
  else if (v.length > LIMITS.admin_name.max) errs.push(`Maximum ${LIMITS.admin_name.max} caractères.`);
  return errs.length ? fail(errs) : ok();
}

export function validateDescription(value: string): ValidationResult {
  const v = value.trim();
  const errs: string[] = [];
  if (!v)                                errs.push('La description est requise.');
  else if (v.length < LIMITS.description.min) errs.push(`Minimum ${LIMITS.description.min} caractères (actuellement ${v.length}).`);
  else if (v.length > LIMITS.description.max) errs.push(`Maximum ${LIMITS.description.max} caractères.`);
  return errs.length ? fail(errs) : ok();
}

export function validateRaison(value: string): ValidationResult {
  if (!value) return ok(); // champ optionnel
  const v = value.trim();
  const errs: string[] = [];
  if (v.length < LIMITS.raison.min) errs.push(`Minimum ${LIMITS.raison.min} caractères.`);
  else if (v.length > LIMITS.raison.max) errs.push(`Maximum ${LIMITS.raison.max} caractères.`);
  return errs.length ? fail(errs) : ok();
}

export function validateComment(value: string): ValidationResult {
  const v = value.trim();
  const errs: string[] = [];
  if (!v)                             errs.push('Le commentaire est requis.');
  else if (v.length < LIMITS.comment.min) errs.push(`Minimum ${LIMITS.comment.min} caractères.`);
  else if (v.length > LIMITS.comment.max) errs.push(`Maximum ${LIMITS.comment.max} caractères.`);
  return errs.length ? fail(errs) : ok();
}

export function validateBio(value: string): ValidationResult {
  if (!value) return ok(); // champ optionnel
  if (value.trim().length > 200) return fail(['Maximum 200 caractères pour la bio.']);
  return ok();
}

export function validatePseudoRp(value: string): ValidationResult {
  if (!value) return ok(); // champ optionnel
  const v = value.trim();
  if (v.length < LIMITS.pseudo_rp.min) return fail([`Minimum ${LIMITS.pseudo_rp.min} caractères.`]);
  if (v.length > LIMITS.pseudo_rp.max) return fail([`Maximum ${LIMITS.pseudo_rp.max} caractères.`]);
  return ok();
}

export function validateSecurityQuestion(value: string): ValidationResult {
  if (!value) return fail(['La question secrète est requise.']);
  if (value.trim().length < 5) return fail(['Question trop courte (minimum 5 caractères).']);
  return ok();
}

export function validateSecurityAnswer(value: string): ValidationResult {
  if (!value) return fail(['La réponse secrète est requise.']);
  if (value.trim().length < 2) return fail(['Réponse trop courte (minimum 2 caractères).']);
  return ok();
}

// ── Fichiers / médias ─────────────────────────────────────────────────────────

/** Taille maximale par fichier : 50 Mo */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function validateFile(file: File): ValidationResult {
  const errs: string[] = [];
  if (!ALLOWED_MIME_ALL.has(file.type)) {
    errs.push(`Format non supporté (${file.type}). Autorisés : JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, AVI.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    errs.push(`Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 50 Mo.`);
  }
  if (file.size === 0) {
    errs.push('Le fichier est vide.');
  }
  return errs.length ? fail(errs) : ok();
}

export function validateFiles(files: File[], maxCount = 5): ValidationResult {
  const errs: string[] = [];
  if (files.length === 0) return ok(); // preuves optionnelles
  if (files.length > maxCount) errs.push(`Maximum ${maxCount} fichiers autorisés.`);
  files.forEach((f) => {
    const r = validateFile(f);
    if (!r.valid) errs.push(`${f.name} : ${r.error}`);
  });
  return errs.length ? fail(errs) : ok();
}

export function validateAvatar(file: File): ValidationResult {
  const AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  const MAX_AVATAR  = 5 * 1024 * 1024; // 5 Mo
  const errs: string[] = [];
  if (!AVATAR_MIME.has(file.type)) errs.push('Format invalide. Utilisez JPG, PNG, WEBP ou GIF.');
  if (file.size > MAX_AVATAR)      errs.push(`Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 5 Mo.`);
  if (file.size === 0)             errs.push('Le fichier est vide.');
  return errs.length ? fail(errs) : ok();
}

// ── Formulaire plainte complet ────────────────────────────────────────────────

export interface PlainteFormData {
  game_server_name: string;
  admin_name:       string;
  description:      string;
  category_id:      string;
  raison?:          string;
  pseudo_rp?:       string;
}

export function validatePlainteForm(data: PlainteFormData): ValidationResult {
  const errs: string[] = [];

  const s = validateServerName(data.game_server_name);
  if (!s.valid) errs.push(...s.errors);

  const a = validateAdminName(data.admin_name);
  if (!a.valid) errs.push(...a.errors);

  const d = validateDescription(data.description);
  if (!d.valid) errs.push(...d.errors);

  if (!data.category_id) errs.push('Sélectionnez une catégorie.');

  if (data.raison) {
    const r = validateRaison(data.raison);
    if (!r.valid) errs.push(...r.errors);
  }

  if (data.pseudo_rp) {
    const p = validatePseudoRp(data.pseudo_rp);
    if (!p.valid) errs.push(...p.errors);
  }

  return errs.length ? fail(errs) : ok();
}

// ── Formulaire inscription ────────────────────────────────────────────────────

export interface InscriptionFormData {
  username:          string;
  password:          string;
  passwordConfirm:   string;
  security_question?: string;
  security_answer?:  string;
}

export function validateInscriptionForm(data: InscriptionFormData): ValidationResult {
  const errs: string[] = [];

  const u = validateUsername(data.username);
  if (!u.valid) errs.push(...u.errors);

  const p = validatePassword(data.password);
  if (!p.valid) errs.push(...p.errors);

  const c = validatePasswordConfirm(data.password, data.passwordConfirm);
  if (!c.valid) errs.push(...c.errors);

  if (data.security_question !== undefined) {
    const q = validateSecurityQuestion(data.security_question);
    if (!q.valid) errs.push(...q.errors);
  }

  if (data.security_answer !== undefined) {
    const a = validateSecurityAnswer(data.security_answer);
    if (!a.valid) errs.push(...a.errors);
  }

  return errs.length ? fail(errs) : ok();
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Sanitise une chaîne (trim + suppression des balises HTML dangereuses) */
export function sanitize(value: string): string {
  return value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/** Tronque un texte à une longueur max avec ellipse */
export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

/** Vérifie si une URL est valide (http/https uniquement) */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
