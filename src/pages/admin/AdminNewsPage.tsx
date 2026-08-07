import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fetchNews, createNews, updateNews, deleteNews } from '@/lib/api';
import type { News } from '@/types/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [type, setType] = useState<'feature' | 'improvement' | 'fix' | 'news'>('feature');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await fetchNews();
      setNews(data);
    } catch {
      toast.error('Erreur lors du chargement des actualités');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: News) => {
    setEditingId(item.id);
    setTitle(item.title);
    setVersion(item.version || '');
    setType(item.type);
    setContent(item.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setVersion('');
    setType('feature');
    setContent('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateNews(editingId, {
          title: title.trim(),
          version: version.trim() || null,
          type,
          content: content.trim(),
        });
        toast.success('Actualité mise à jour');
      } else {
        await createNews({
          title: title.trim(),
          version: version.trim() || null,
          type,
          content: content.trim(),
        });
        toast.success('Actualité publiée');
      }
      handleCancelEdit();
      await loadNews();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    try {
      await deleteNews(id);
      setNews((prev) => prev.filter((n) => n.id !== id));
      toast.success('Actualité supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Actualités</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les nouveautés et les notes de mise à jour.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border border-border bg-card rounded-xl p-6 h-fit sticky top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
            {editingId ? 'Modifier' : 'Publier'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Titre</label>
              <Input
                placeholder="Ex: Nouveaux Profils"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Version</label>
                <Input
                  placeholder="Ex: v1.3.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'feature' | 'improvement' | 'fix' | 'news')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="news">Actualité / Annonce</option>
                  <option value="feature">Fonctionnalité</option>
                  <option value="improvement">Amélioration</option>
                  <option value="fix">Correctif</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Contenu</label>
              <Textarea
                placeholder="- Listez les changements..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Mettre à jour' : 'Publier'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} title="Annuler">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {news.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">Aucune actualité publiée.</p>
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="p-5 border border-border bg-card rounded-xl group relative">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {item.type}
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                  </span>
                  {item.version && (
                    <>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-xs font-medium text-foreground">{item.version}</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 pr-20">{item.title}</h3>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
