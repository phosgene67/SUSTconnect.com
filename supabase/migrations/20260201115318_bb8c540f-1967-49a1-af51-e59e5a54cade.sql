-- Add Korum group settings for messaging controls
ALTER TABLE public.korums 
ADD COLUMN IF NOT EXISTS admin_only_posting boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_member_messages boolean DEFAULT true;

-- Create table for pinned messages in Korums
CREATE TABLE IF NOT EXISTS public.korum_pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  korum_id uuid NOT NULL REFERENCES public.korums(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  pinned_at timestamp with time zone DEFAULT now(),
  UNIQUE(korum_id, message_id)
);

ALTER TABLE public.korum_pinned_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view pinned messages in korums they're part of
CREATE POLICY "Members can view pinned messages"
ON public.korum_pinned_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM korum_members 
    WHERE korum_members.korum_id = korum_pinned_messages.korum_id 
    AND korum_members.user_id = auth.uid()
  )
);

-- RLS: Only admins/moderators can pin messages
CREATE POLICY "Admins can pin messages"
ON public.korum_pinned_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM korum_members 
    WHERE korum_members.korum_id = korum_pinned_messages.korum_id 
    AND korum_members.user_id = auth.uid()
    AND korum_members.role IN ('admin', 'moderator')
  )
);

-- RLS: Only admins/moderators can unpin messages
CREATE POLICY "Admins can unpin messages"
ON public.korum_pinned_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM korum_members 
    WHERE korum_members.korum_id = korum_pinned_messages.korum_id 
    AND korum_members.user_id = auth.uid()
    AND korum_members.role IN ('admin', 'moderator')
  )
);

-- Create table for user research papers
CREATE TABLE IF NOT EXISTS public.user_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  publication_url text,
  published_at timestamp with time zone,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view research"
ON public.user_research FOR SELECT
USING (true);

CREATE POLICY "Users can create own research"
ON public.user_research FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research"
ON public.user_research FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research"
ON public.user_research FOR DELETE
USING (auth.uid() = user_id);

-- Create table for user projects
CREATE TABLE IF NOT EXISTS public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  project_url text,
  github_url text,
  image_url text,
  technologies text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
ON public.user_projects FOR SELECT
USING (true);

CREATE POLICY "Users can create own projects"
ON public.user_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON public.user_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON public.user_projects FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_research_updated_at
BEFORE UPDATE ON public.user_research
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at
BEFORE UPDATE ON public.user_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();