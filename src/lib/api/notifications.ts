// ── Notifications ─────────────────────────────────────────────────────────────
import { supabase } from '@/db/supabase';

export interface Notification {
  id:          string;
  user_id:     string;
  type:        'vote' | 'comment' | 'status_change' | 'admin';
  plainte_id?: string;
  message:     string;
  read:        boolean;
  created_at:  string;
}

export async function fetchNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return Array.isArray(data) ? (data as Notification[]) : [];
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count ?? 0;
}
