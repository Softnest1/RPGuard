CREATE TABLE IF NOT EXISTS public.news (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  version text,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('feature', 'improvement', 'fix')),
  content text NOT NULL,
  author_id uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are visible to everyone"
ON public.news FOR SELECT
USING (true);

-- Only admins can insert/update/delete.
-- For simplicity, since `profiles.role` exists, we can use a subquery.
CREATE POLICY "Admins can insert news"
ON public.news FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update news"
ON public.news FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete news"
ON public.news FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);