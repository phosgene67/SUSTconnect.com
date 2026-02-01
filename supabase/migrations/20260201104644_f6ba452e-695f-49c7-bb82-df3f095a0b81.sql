-- SUST CONNECT Database Schema - Phase 1: Auth & Core Tables

-- Create app role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create post category enum
CREATE TYPE public.post_category AS ENUM ('academic_help', 'project', 'notice', 'question', 'resource');

-- Create korum type enum
CREATE TYPE public.korum_type AS ENUM ('batch', 'department', 'project', 'club', 'course');

-- Create korum member role enum
CREATE TYPE public.korum_member_role AS ENUM ('admin', 'moderator', 'member');

-- Create announcement priority enum
CREATE TYPE public.announcement_priority AS ENUM ('normal', 'important', 'urgent');

-- Create announcement target enum
CREATE TYPE public.announcement_target AS ENUM ('university', 'department', 'batch', 'korum');

-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('message', 'comment', 'reply', 'mention', 'announcement', 'korum_invite', 'upvote');

-- ============================================
-- PROFILES TABLE
-- ============================================
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- USER ROLES TABLE (Separate for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies (only admins can modify, anyone authenticated can read their own)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
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

-- Function to get user's primary role
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

-- ============================================
-- TRIGGER: Auto-create profile and role on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with metadata from signup
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

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();