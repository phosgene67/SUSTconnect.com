-- Fix 1: Restrict notification creation to only allow users to create their own notifications
-- or through server-side SECURITY DEFINER function
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive policy - users can only receive notifications, not create them for others
-- Notifications should be created through backend/edge functions with service role
CREATE POLICY "Users can create notifications for themselves or via admin"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'teacher'::app_role)
);

-- Fix 2: Secure korum-images storage bucket policies
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Users can upload korum images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update korum images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete korum images" ON storage.objects;

-- Create folder-based organization for korum images (korum_id as folder)
-- Only korum creators can upload/update/delete their korum's images
CREATE POLICY "Korum creators can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'korum-images' AND
  EXISTS (
    SELECT 1 FROM public.korums
    WHERE id::text = (storage.foldername(name))[1]
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Korum creators can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'korum-images' AND
  EXISTS (
    SELECT 1 FROM public.korums
    WHERE id::text = (storage.foldername(name))[1]
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Korum creators can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'korum-images' AND
  EXISTS (
    SELECT 1 FROM public.korums
    WHERE id::text = (storage.foldername(name))[1]
    AND created_by = auth.uid()
  )
);

-- Fix 3: Add admin-only policies for user_roles table to prevent privilege escalation
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));