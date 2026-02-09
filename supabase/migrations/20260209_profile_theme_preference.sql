-- Add theme preference to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system';