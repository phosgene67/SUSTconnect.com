-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create storage bucket for korum images
INSERT INTO storage.buckets (id, name, public)
VALUES ('korum-images', 'korum-images', true);

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for korum-images bucket
CREATE POLICY "Korum images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'korum-images');

CREATE POLICY "Users can upload korum images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'korum-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update korum images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'korum-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete korum images"
ON storage.objects FOR DELETE
USING (bucket_id = 'korum-images' AND auth.uid() IS NOT NULL);