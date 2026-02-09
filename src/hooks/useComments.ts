import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    department: string;
  };
  user_vote?: number;
  replies?: Comment[];
}

// Helper function to build nested comment structure
const buildNestedComments = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<string, any>();
  const rootComments: any[] = [];

  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach(comment => {
    const c = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies!.push(c);
    } else {
      rootComments.push(c);
    }
  });

  return rootComments;
};

export function useComments(postId: string) {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: rawComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get author profiles
      const authorIds = [...new Set(rawComments?.map(c => c.author_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const data = rawComments?.map(comment => ({
        ...comment,
        author: profileMap.get(comment.author_id),
      }));

      // Get user votes if logged in
      let commentsWithVotes = data;
      if (user && data) {
        const commentIds = data.map(c => c.id);
        const { data: votes } = await supabase
          .from('votes')
          .select('target_id, value')
          .eq('user_id', user.id)
          .eq('target_type', 'comment')
          .in('target_id', commentIds);

        const voteMap = new Map(votes?.map(v => [v.target_id, v.value]) || []);
        commentsWithVotes = data.map(comment => ({
          ...comment,
          user_vote: voteMap.get(comment.id) || 0
        }));
      }

      // Build nested structure
      return buildNestedComments(commentsWithVotes || []);
    },
    enabled: !!postId,
  });

  // Real-time subscription for new comments
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // Refetch comments and update post comment count
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
          
          // Update the post's comment count optimistically
          queryClient.setQueryData(['post', postId], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              comment_count: (old.comment_count || 0) + 1,
            };
          });

          // Also invalidate to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ['post', postId] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  // Real-time subscription for comment votes
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comment_votes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `target_type=eq.comment`,
        },
        () => {
          // Refetch comments to get updated vote counts
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return query;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Try to atomically increment comment count using RPC
      const { error: rpcError } = await supabase
        .rpc('increment_comment_count', { post_id: postId });

      // If RPC fails, fall back to direct update (trigger will handle it)
      if (rpcError) {
        console.warn('RPC increment failed, will rely on database trigger:', rpcError);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Success', description: 'Comment added!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
