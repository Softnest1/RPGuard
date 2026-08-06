
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- PROFILES (synced from auth.users via trigger)
-- =========================================
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-sync trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Helper function to prevent RLS recursion
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- PLAINTES STATUS ENUM
-- =========================================
CREATE TYPE public.plainte_status AS ENUM ('En attente', 'Validée', 'Rejetée');

-- =========================================
-- PLAINTES
-- =========================================
CREATE TABLE public.plaintes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  game_server_name TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.plainte_status NOT NULL DEFAULT 'En attente',
  has_strong_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER plaintes_updated_at
  BEFORE UPDATE ON public.plaintes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================================
-- VOTES
-- =========================================
CREATE TYPE public.vote_type AS ENUM ('upvote', 'downvote');

CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plainte_id UUID NOT NULL REFERENCES public.plaintes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type public.vote_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plainte_id, user_id)
);

-- =========================================
-- COMMENTAIRES
-- =========================================
CREATE TABLE public.commentaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plainte_id UUID NOT NULL REFERENCES public.plaintes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- SIGNALEMENTS
-- =========================================
CREATE TABLE public.signalements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plainte_id UUID NOT NULL REFERENCES public.plaintes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plainte_id, user_id)
);

-- =========================================
-- PREUVES (evidence files)
-- =========================================
CREATE TABLE public.preuves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plainte_id UUID NOT NULL REFERENCES public.plaintes(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- STORAGE BUCKET for screenshots
-- =========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'preuves',
  'preuves',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- ENABLE RLS
-- =========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaintes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commentaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preuves ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PROFILES POLICIES
-- =========================================
CREATE POLICY "Admins full access to profiles" ON profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

CREATE POLICY "Anon cannot access profiles" ON profiles
  FOR SELECT TO anon USING (false);

-- =========================================
-- CATEGORIES POLICIES (public read)
-- =========================================
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON categories
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- =========================================
-- PLAINTES POLICIES
-- =========================================
CREATE POLICY "Anyone can read plaintes" ON plaintes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create plaintes" ON plaintes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update own plaintes" ON plaintes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (status = 'En attente'::plainte_status);

CREATE POLICY "Admins manage all plaintes" ON plaintes
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Authors can delete own plaintes" ON plaintes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- VOTES POLICIES
-- =========================================
CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote" ON votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote" ON votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- COMMENTAIRES POLICIES
-- =========================================
CREATE POLICY "Anyone can read commentaires" ON commentaires
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON commentaires
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commentaires" ON commentaires
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all commentaires" ON commentaires
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- =========================================
-- SIGNALEMENTS POLICIES
-- =========================================
CREATE POLICY "Authenticated users can signal" ON signalements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own signalements" ON signalements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all signalements" ON signalements
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- =========================================
-- PREUVES POLICIES
-- =========================================
CREATE POLICY "Anyone can read preuves" ON preuves
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload preuves" ON preuves
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM plaintes WHERE id = plainte_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all preuves" ON preuves
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- =========================================
-- STORAGE POLICIES for preuves bucket
-- =========================================
CREATE POLICY "Anyone can view preuves" ON storage.objects
  FOR SELECT USING (bucket_id = 'preuves');

CREATE POLICY "Authenticated users can upload preuves" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'preuves');

CREATE POLICY "Users can delete own preuves" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'preuves' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================
-- PUBLIC VIEW
-- =========================================
CREATE VIEW public_profiles AS
  SELECT id, username, role FROM profiles;

-- =========================================
-- SEED CATEGORIES
-- =========================================
INSERT INTO public.categories (name, color) VALUES
  ('GTA RP', '#DC2626'),
  ('ONESTATE RP', '#2563EB'),
  ('Autres jeux RP', '#16A34A'),
  ('Autres jeux', '#9333EA');
