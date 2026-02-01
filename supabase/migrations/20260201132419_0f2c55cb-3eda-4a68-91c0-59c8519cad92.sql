-- Add reply_to_id column to messages for reply functionality
ALTER TABLE public.messages ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Anyone can view reactions"
ON public.message_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for messages (users can delete their own messages)
CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);