-- Create a trigger to automatically update comment_count when a comment is inserted
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

-- Create trigger for INSERT and DELETE operations on comments
DROP TRIGGER IF EXISTS update_comment_count_on_insert ON public.comments;
DROP TRIGGER IF EXISTS update_comment_count_on_delete ON public.comments;

CREATE TRIGGER update_comment_count_on_insert
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_comment_count();

CREATE TRIGGER update_comment_count_on_delete
AFTER DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_comment_count();
