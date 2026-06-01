-- ============================================================================
-- SUST CONNECT CONSOLIDATED DATABASE SCHEMA
-- This script sets up the complete, clean schema for a fresh Supabase project.
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS CREATION
-- ============================================================================
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE public.post_category AS ENUM ('academic_help', 'project', 'notice', 'question', 'resource');
CREATE TYPE public.korum_type AS ENUM ('batch', 'department', 'project', 'club', 'course');
CREATE TYPE public.korum_member_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE public.announcement_priority AS ENUM ('normal', 'important', 'urgent');
CREATE TYPE public.announcement_target AS ENUM ('university', 'department', 'batch', 'korum');
CREATE TYPE public.notification_type AS ENUM ('message', 'comment', 'reply', 'mention', 'announcement', 'korum_invite', 'upvote');

-- ============================================================================
-- 2. TABLES CREATION
-- ============================================================================

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT NOT NULL,
  batch TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  social_linkedin TEXT,
  social_github TEXT,
  social_portfolio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  theme_preference TEXT DEFAULT 'system',
  user_type VARCHAR(50) DEFAULT 'student' CHECK (user_type IN ('student', 'teacher', 'alumni', 'developer')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'restricted')),
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  restrictions JSONB DEFAULT '{}'
);

-- USER ROLES (RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- KORUMS (COMMUNITIES)
CREATE TABLE public.korums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type korum_type NOT NULL DEFAULT 'project',
  avatar_url TEXT,
  cover_url TEXT,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  admin_only_posting BOOLEAN DEFAULT false,
  allow_member_messages BOOLEAN DEFAULT true
);

-- KORUM MEMBERS
CREATE TABLE public.korum_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  korum_id UUID REFERENCES public.korums(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role korum_member_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (korum_id, user_id)
);

-- POSTS
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category post_category NOT NULL DEFAULT 'question',
  tags TEXT[] DEFAULT '{}',
  korum_id UUID REFERENCES public.korums(id) ON DELETE SET NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- COMMENTS (NESTED)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VOTES
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, target_id, target_type)
);

-- MESSAGES (DMs & Korum messages)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  korum_id UUID REFERENCES public.korums(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  CHECK (receiver_id IS NOT NULL OR korum_id IS NOT NULL)
);

-- CONVERSATIONS (DMs List)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_two UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (participant_one, participant_two)
);

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority announcement_priority DEFAULT 'normal',
  target_type announcement_target DEFAULT 'university',
  target_value TEXT,
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SAVED POSTS (BOOKMARKS)
CREATE TABLE public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- KORUM PINNED MESSAGES
CREATE TABLE public.korum_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  korum_id UUID REFERENCES public.korums(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (korum_id, message_id)
);

-- USER PORTFOLIO: RESEARCH
CREATE TABLE public.user_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  publication_url TEXT,
  published_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER PORTFOLIO: PROJECTS
CREATE TABLE public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_url TEXT,
  github_url TEXT,
  image_url TEXT,
  technologies TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MESSAGE REACTIONS
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);


-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korum_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korum_pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 4. FUNCTION DEFINITIONS & HELPER PROCEDURES
-- ============================================================================

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- SECURITY DEFINER: HAS APP ROLE?
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- SECURITY DEFINER: GET APP ROLE
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'teacher' THEN 2 
      WHEN 'student' THEN 3 
    END
  LIMIT 1
$$;

-- SECURITY DEFINER: HANDLE NEW SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with metadata from auth.users
  INSERT INTO public.profiles (user_id, full_name, department, batch)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'batch', '')
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- ATOMIC VOTE UPDATE ROUTINE
CREATE OR REPLACE FUNCTION public.apply_vote(
  target_id UUID,
  target_type TEXT,
  value SMALLINT
)
RETURNS TABLE (upvotes INTEGER, downvotes INTEGER, user_vote SMALLINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_value SMALLINT;
  delta_up INTEGER := 0;
  delta_down INTEGER := 0;
BEGIN
  IF target_type NOT IN ('post', 'comment') THEN
    RAISE EXCEPTION 'Invalid target type';
  END IF;

  IF value NOT IN (-1, 0, 1) THEN
    RAISE EXCEPTION 'Invalid vote value';
  END IF;

  SELECT v.value
    INTO existing_value
  FROM public.votes v
  WHERE v.user_id = auth.uid()
    AND v.target_id = target_id
    AND v.target_type = target_type
  LIMIT 1;

  IF value = 0 THEN
    IF existing_value IS NOT NULL THEN
      DELETE FROM public.votes
      WHERE user_id = auth.uid()
        AND target_id = target_id
        AND target_type = target_type;

      IF existing_value = 1 THEN
        delta_up := -1;
      ELSIF existing_value = -1 THEN
        delta_down := -1;
      END IF;
    END IF;
  ELSE
    IF existing_value IS NULL THEN
      INSERT INTO public.votes (user_id, target_id, target_type, value)
      VALUES (auth.uid(), target_id, target_type, value)
      ON CONFLICT (user_id, target_id, target_type)
      DO UPDATE SET value = EXCLUDED.value;

      IF value = 1 THEN
        delta_up := 1;
      ELSE
        delta_down := 1;
      END IF;
    ELSE
      IF existing_value <> value THEN
        UPDATE public.votes
        SET value = value
        WHERE user_id = auth.uid()
          AND target_id = target_id
          AND target_type = target_type;

        IF existing_value = 1 THEN
          delta_up := -1;
        ELSIF existing_value = -1 THEN
          delta_down := -1;
        END IF;

        IF value = 1 THEN
          delta_up := delta_up + 1;
        ELSE
          delta_down := delta_down + 1;
        END IF;
      END IF;
    END IF;
  END IF;

  IF target_type = 'post' THEN
    UPDATE public.posts
    SET upvotes = GREATEST(COALESCE(upvotes, 0) + delta_up, 0),
        downvotes = GREATEST(COALESCE(downvotes, 0) + delta_down, 0)
    WHERE id = target_id;

    RETURN QUERY
      SELECT p.upvotes, p.downvotes, COALESCE(v.value, 0)::SMALLINT
      FROM public.posts p
      LEFT JOIN public.votes v
        ON v.user_id = auth.uid()
       AND v.target_id = p.id
       AND v.target_type = 'post'
      WHERE p.id = target_id;
  ELSE
    UPDATE public.comments
    SET upvotes = GREATEST(COALESCE(upvotes, 0) + delta_up, 0),
        downvotes = GREATEST(COALESCE(downvotes, 0) + delta_down, 0)
    WHERE id = target_id;

    RETURN QUERY
      SELECT c.upvotes, c.downvotes, COALESCE(v.value, 0)::SMALLINT
      FROM public.comments c
      LEFT JOIN public.votes v
        ON v.user_id = auth.uid()
       AND v.target_id = c.id
       AND v.target_type = 'comment'
      WHERE c.id = target_id;
  END IF;
END;
$$;

-- ATOMIC POST COMMENT COUNTER CACHE
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- MANUAL ATOMIC INCREMENT TRIGGER FALLBACK
CREATE OR REPLACE FUNCTION public.increment_comment_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET comment_count = COALESCE(comment_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- ============================================================================
-- 5. SECURE USER MANAGEMENT & ADMIN RPC FUNCTIONS
-- ============================================================================

-- DEVELOPER-ONLY ADMIN USER LIST
CREATE OR REPLACE FUNCTION public.get_all_users(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  department TEXT,
  batch TEXT,
  user_type VARCHAR,
  status VARCHAR,
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  restrictions JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requesting user is a developer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id AND user_type = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can access user management';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    u.email,
    p.avatar_url,
    p.department,
    p.batch,
    p.user_type,
    p.status,
    p.banned_at,
    p.ban_reason,
    p.restrictions,
    u.created_at
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- SECURE ADMIN ACCOUNT SUSPENSION
CREATE OR REPLACE FUNCTION public.ban_user(p_admin_id UUID, p_target_user_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requesting user is a developer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND user_type = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can ban users';
  END IF;

  UPDATE public.profiles
  SET 
    status = 'banned',
    banned_at = NOW(),
    ban_reason = p_reason
  WHERE user_id = p_target_user_id;
END;
$$;

-- SECURE ADMIN UNBAN TRIGGER
CREATE OR REPLACE FUNCTION public.unban_user(p_admin_id UUID, p_target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requesting user is a developer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND user_type = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can unban users';
  END IF;

  UPDATE public.profiles
  SET 
    status = 'active',
    banned_at = NULL,
    ban_reason = NULL
  WHERE user_id = p_target_user_id;
END;
$$;

-- SECURE ADMIN USER TYPE SWAPPING
CREATE OR REPLACE FUNCTION public.update_user_type(p_admin_id UUID, p_target_user_id UUID, p_user_type VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requesting user is a developer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND user_type = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can update user types';
  END IF;

  IF p_user_type NOT IN ('student', 'teacher', 'alumni', 'developer') THEN
    RAISE EXCEPTION 'Invalid user type: %', p_user_type;
  END IF;

  UPDATE public.profiles
  SET user_type = p_user_type
  WHERE user_id = p_target_user_id;
END;
$$;

-- SECURE ADMIN RESTRICTIONS SETTER
CREATE OR REPLACE FUNCTION public.update_user_restrictions(p_admin_id UUID, p_target_user_id UUID, p_restrictions JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requesting user is a developer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND user_type = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can update restrictions';
  END IF;

  UPDATE public.profiles
  SET restrictions = p_restrictions
  WHERE user_id = p_target_user_id;
END;
$$;


-- ============================================================================
-- 6. ATTACH DATABASE TRIGGERS
-- ============================================================================

-- Signup hook for auto-profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at update hooks
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_korums_updated_at BEFORE UPDATE ON public.korums FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_user_research_updated_at BEFORE UPDATE ON public.user_research FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON public.user_projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Comment counter cache triggers
CREATE TRIGGER update_comment_count_on_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

CREATE TRIGGER update_comment_count_on_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();


-- ============================================================================
-- 7. SECURITY & ACCESS POLICIES (RLS DETAILED RULES)
-- ============================================================================

-- PROFILES
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can assign roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- POSTS
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- COMMENTS
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- VOTES
CREATE POLICY "Users can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- KORUMS
CREATE POLICY "Anyone can view public korums" ON public.korums FOR SELECT USING (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.korum_members WHERE korum_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can create korums" ON public.korums FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Korum creators can update" ON public.korums FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Korum creators can delete" ON public.korums FOR DELETE USING (auth.uid() = created_by);

-- KORUM MEMBERS
CREATE POLICY "Anyone can view korum members" ON public.korum_members FOR SELECT USING (true);
CREATE POLICY "Users can join korums" ON public.korum_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave korums" ON public.korum_members FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR (korum_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.korum_members WHERE korum_id = messages.korum_id AND user_id = auth.uid())));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- CONVERSATIONS
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = participant_one OR auth.uid() = participant_two);

-- ANNOUNCEMENTS
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins and teachers can create announcements" ON public.announcements FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Admins and teachers can update announcements" ON public.announcements FOR UPDATE USING (auth.uid() = author_id AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admins and teachers can delete announcements" ON public.announcements FOR DELETE USING (auth.uid() = author_id AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create notifications for themselves or via admin" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- SAVED POSTS
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- KORUM PINNED MESSAGES
CREATE POLICY "Members can view pinned messages" ON public.korum_pinned_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.korum_members WHERE public.korum_members.korum_id = public.korum_pinned_messages.korum_id AND public.korum_members.user_id = auth.uid()));
CREATE POLICY "Admins can pin messages" ON public.korum_pinned_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.korum_members WHERE public.korum_members.korum_id = public.korum_pinned_messages.korum_id AND public.korum_members.user_id = auth.uid() AND public.korum_members.role IN ('admin', 'moderator')));
CREATE POLICY "Admins can unpin messages" ON public.korum_pinned_messages FOR DELETE USING (EXISTS (SELECT 1 FROM public.korum_members WHERE public.korum_members.korum_id = public.korum_pinned_messages.korum_id AND public.korum_members.user_id = auth.uid() AND public.korum_members.role IN ('admin', 'moderator')));

-- USER PORTFOLIO: RESEARCH
CREATE POLICY "Anyone can view research" ON public.user_research FOR SELECT USING (true);
CREATE POLICY "Users can create own research" ON public.user_research FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own research" ON public.user_research FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own research" ON public.user_research FOR DELETE USING (auth.uid() = user_id);

-- USER PORTFOLIO: PROJECTS
CREATE POLICY "Anyone can view projects" ON public.user_projects FOR SELECT USING (true);
CREATE POLICY "Users can create own projects" ON public.user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.user_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.user_projects FOR DELETE USING (auth.uid() = user_id);

-- MESSAGE REACTIONS
CREATE POLICY "Anyone can view reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 8. GRANT PRIVILEGES & SECURITY EXECUTE RIGHTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.apply_vote(UUID, TEXT, SMALLINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comment_count(UUID) TO authenticated;


-- ============================================================================
-- 9. PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_korum ON public.posts(korum_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON public.votes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_korum_members_korum ON public.korum_members(korum_id);
CREATE INDEX IF NOT EXISTS idx_korum_members_user ON public.korum_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_korum ON public.messages(korum_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);


-- ============================================================================
-- 10. REALTIME CONFIGURATION (POSTGRES REPLICATION)
-- ============================================================================
-- Check pg_publication_tables first to avoid errors when the table isn't in the publication.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
END $$;

-- Add tables for real-time syncing
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ============================================================================
-- 11. STORAGE BUCKETS & POLICIES (AUTHENTICATED FILES & AVATARS)
-- ============================================================================

-- Create buckets safely without dropping existing contents
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('korum-images', 'korum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage object policies for korum-images bucket (folder organized by korum_id)
CREATE POLICY "Korum images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'korum-images');

CREATE POLICY "Korum creators can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'korum-images' AND
  EXISTS (
    SELECT 1 FROM public.korums
    WHERE id::text = (storage.foldername(name))[1]
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Korum creators can update images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'korum-images' AND
  EXISTS (
    SELECT 1 FROM public.korums
    WHERE id::text = (storage.foldername(name))[1]
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Korum creators can delete images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'korum-images' AND
  EXISTS (
    SELECT 1 FROM public.korums
    WHERE id::text = (storage.foldername(name))[1]
    AND created_by = auth.uid()
  )
);
