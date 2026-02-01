-- Posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category post_category NOT NULL DEFAULT 'question',
  tags text[] DEFAULT '{}',
  korum_id uuid,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table (nested/threaded)
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Votes table (for posts and comments)
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, target_id, target_type)
);

-- Korums (communities/groups)
CREATE TABLE public.korums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type korum_type NOT NULL DEFAULT 'project',
  avatar_url text,
  cover_url text,
  is_private boolean DEFAULT false,
  member_count integer DEFAULT 1,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key to posts for korum_id
ALTER TABLE public.posts ADD CONSTRAINT posts_korum_id_fkey 
  FOREIGN KEY (korum_id) REFERENCES public.korums(id) ON DELETE SET NULL;

-- Korum members
CREATE TABLE public.korum_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  korum_id uuid NOT NULL REFERENCES public.korums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role korum_member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE (korum_id, user_id)
);

-- Messages (direct messages)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  korum_id uuid REFERENCES public.korums(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (receiver_id IS NOT NULL OR korum_id IS NOT NULL)
);

-- Conversations (for listing DM conversations)
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (participant_one, participant_two)
);

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  priority announcement_priority DEFAULT 'normal',
  target_type announcement_target DEFAULT 'university',
  target_value text,
  is_pinned boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Saved posts (bookmarks)
CREATE TABLE public.saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.korum_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Posts
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for Comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for Votes
CREATE POLICY "Users can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Korums
CREATE POLICY "Anyone can view public korums" ON public.korums FOR SELECT USING (NOT is_private OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM korum_members WHERE korum_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can create korums" ON public.korums FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Korum creators can update" ON public.korums FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Korum creators can delete" ON public.korums FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Korum Members
CREATE POLICY "Anyone can view korum members" ON public.korum_members FOR SELECT USING (true);
CREATE POLICY "Users can join korums" ON public.korum_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave korums" ON public.korum_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR (korum_id IS NOT NULL AND EXISTS (SELECT 1 FROM korum_members WHERE korum_id = messages.korum_id AND user_id = auth.uid())));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for Conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = participant_one OR auth.uid() = participant_two);

-- RLS Policies for Announcements
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins and teachers can create announcements" ON public.announcements FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admins and teachers can update announcements" ON public.announcements FOR UPDATE USING (auth.uid() = author_id AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));
CREATE POLICY "Admins and teachers can delete announcements" ON public.announcements FOR DELETE USING (auth.uid() = author_id AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')));

-- RLS Policies for Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Saved Posts
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_korums_updated_at BEFORE UPDATE ON public.korums FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for performance
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_korum ON public.posts(korum_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_votes_target ON public.votes(target_id, target_type);
CREATE INDEX idx_korum_members_korum ON public.korum_members(korum_id);
CREATE INDEX idx_korum_members_user ON public.korum_members(user_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_korum ON public.messages(korum_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, is_read);