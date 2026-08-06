// ── Messages de contact ───────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';

export interface ContactMessage {
  id:           string;
  contact_info: string | null;
  subject:      string | null;
  content:      string;
  message:      string;
  status:       'non_lu' | 'lu' | 'traite';
  created_at:   string;
}

export async function createContactMessage(data: {
  contact_info?: string;
  subject:       string;
  message:       string;
}): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    contact_info: data.contact_info || null,
    subject:      data.subject      || null,
    message:      data.message,
  });
  if (error) throw new Error(error.message);
}

export async function fetchContactMessages(statusFilter?: string): Promise<ContactMessage[]> {
  let q = supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (statusFilter && statusFilter !== 'tous') q = q.eq('status', statusFilter);
  const { data } = await q;
  return Array.isArray(data) ? (data as ContactMessage[]) : [];
}

export async function updateContactMessageStatus(
  id:     string,
  status: 'non_lu' | 'lu' | 'traite',
): Promise<void> {
  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
