import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: 'academic_help' | 'project' | 'notice' | 'question' | 'resource';
  tags: string[];
  korum_id: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    department: string;
    batch: string;
  };
  user_vote?: number;
}

export function usePosts(category?: string, korumId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts', category, korumId],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category as any);
      }
      if (korumId) {
        query = query.eq('korum_id', korumId);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Get author profiles
      const authorIds = [...new Set(posts?.map(p => p.author_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department, batch')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const data = posts?.map(post => ({
        ...post,
        author: profileMap.get(post.author_id),
      }));

      // Get user votes if logged in
      if (user && data) {
        const postIds = data.map(p => p.id);
        const { data: votes } = await supabase
          .from('votes')
          .select('target_id, value')
          .eq('user_id', user.id)
          .eq('target_type', 'post')
          .in('target_id', postIds);

        const voteMap = new Map(votes?.map(v => [v.target_id, v.value]) || []);
        return data.map(post => ({
          ...post,
          user_vote: voteMap.get(post.id) || 0
        }));
      }

      return data;
    },
  });
}

export function usePost(postId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['post', postId],
    queryFn: async (): Promise<Post | null> => {
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      if (!post) return null;

      // Get author profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department, batch')
        .eq('user_id', post.author_id)
        .single();

      let result: Post = {
        ...post,
        tags: post.tags || [],
        author: profile || undefined,
        user_vote: 0,
      };

      // Get user vote if logged in
      if (user) {
        const { data: vote } = await supabase
          .from('votes')
          .select('value')
          .eq('user_id', user.id)
          .eq('target_id', postId)
          .eq('target_type', 'post')
          .maybeSingle();

        result.user_vote = vote?.value || 0;
      }

      return result;
    },
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: { title: string; content: string; category: string; tags?: string[]; korum_id?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          title: post.title,
          content: post.content,
          category: post.category as any,
          tags: post.tags || [],
          korum_id: post.korum_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Success', description: 'Post created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetId, targetType, value }: { targetId: string; targetType: 'post' | 'comment'; value: 1 | -1 | 0 }) => {
      if (!user) throw new Error('Must be logged in');

      if (value === 0) {
        // Remove vote
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .eq('target_type', targetType);
        if (error) throw error;
      } else {
        // Upsert vote
        const { error } = await supabase
          .from('votes')
          .upsert({
            user_id: user.id,
            target_id: targetId,
            target_type: targetType,
            value,
          }, { onConflict: 'user_id,target_id,target_type' });
        if (error) throw error;
      }

      // Update vote counts on the target
      const table = targetType === 'post' ? 'posts' : 'comments';
      const { data: votes } = await supabase
        .from('votes')
        .select('value')
        .eq('target_id', targetId)
        .eq('target_type', targetType);

      const upvotes = votes?.filter(v => v.value === 1).length || 0;
      const downvotes = votes?.filter(v => v.value === -1).length || 0;

      await supabase
        .from(table)
        .update({ upvotes, downvotes })
        .eq('id', targetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
