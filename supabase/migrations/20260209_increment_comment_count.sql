-- Create function to atomically increment comment count
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_comment_count(UUID) TO authenticated;
