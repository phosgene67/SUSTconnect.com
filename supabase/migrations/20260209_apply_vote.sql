-- Atomic vote application with count updates
CREATE OR REPLACE FUNCTION public.apply_vote(
  target_id uuid,
  target_type text,
  value smallint
)
RETURNS TABLE (upvotes integer, downvotes integer, user_vote smallint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_value smallint;
  delta_up integer := 0;
  delta_down integer := 0;
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
      SELECT p.upvotes, p.downvotes, COALESCE(v.value, 0)
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
      SELECT c.upvotes, c.downvotes, COALESCE(v.value, 0)
      FROM public.comments c
      LEFT JOIN public.votes v
        ON v.user_id = auth.uid()
       AND v.target_id = c.id
       AND v.target_type = 'comment'
      WHERE c.id = target_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_vote(uuid, text, smallint) TO authenticated;
