import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Comment } from '@/hooks/useComments';
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

export function usePosts(category?: Post['category'], korumId?: string, searchTerm?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['posts', category, korumId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }
      if (korumId) {
        query = query.eq('korum_id', korumId);
      }
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        if (term.startsWith('#')) {
          const tag = term.slice(1).trim();
          if (tag) {
            query = query.contains('tags', [tag]);
          }
        } else {
          query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
        }
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

  // Real-time subscription for post changes (comments, votes, etc)
  useEffect(() => {
    const channel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts', category, korumId, searchTerm] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, korumId, searchTerm, queryClient]);

  return query;
}

export function usePost(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
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

      const result: Post = {
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

  // Real-time subscription for post votes
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post_votes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `target_id=eq.${postId}`,
        },
        () => {
          // Refetch post to get updated vote counts
          queryClient.invalidateQueries({ queryKey: ['post', postId] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return query;
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: { title: string; content: string; category: Post['category']; tags?: string[]; korum_id?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          title: post.title,
          content: post.content,
          category: post.category,
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
    mutationFn: async ({ targetId, targetType, value, postId }: { targetId: string; targetType: 'post' | 'comment'; value: 1 | -1 | 0; postId?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .rpc('apply_vote', {
          target_id: targetId,
          target_type: targetType,
          value,
        });
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      return { targetId, targetType, postId, ...result };
    },
    onMutate: async ({ targetId, targetType, value, postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: targetType === 'post' ? ['posts'] : ['comments'] });
      await queryClient.cancelQueries({ queryKey: targetType === 'post' ? ['post', targetId] : ['comments'] });
      if (postId) {
        await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      }

      // Get previous data
      const postsData = queryClient.getQueryData(['posts']) as Post[] | undefined;
      const postData = queryClient.getQueryData(['post', targetId]) as Post | undefined;
      const commentsData = postId ? (queryClient.getQueryData(['comments', postId]) as Comment[]) : undefined;

      // Optimistically update posts
      if (postsData) {
        queryClient.setQueryData(['posts'], (old: Post[]) =>
          old.map(post => {
            if (post.id === targetId && targetType === 'post') {
              const oldVote = post.user_vote || 0;
              const diff = value - oldVote;
              return {
                ...post,
                user_vote: value,
                upvotes: post.upvotes + (value === 1 ? 1 : oldVote === 1 ? -1 : 0),
                downvotes: post.downvotes + (value === -1 ? 1 : oldVote === -1 ? -1 : 0),
              };
            }
            return post;
          })
        );
      }

      // Optimistically update single post
      if (postData && targetType === 'post') {
        const oldVote = postData.user_vote || 0;
        queryClient.setQueryData(['post', targetId], {
          ...postData,
          user_vote: value,
          upvotes: postData.upvotes + (value === 1 ? 1 : oldVote === 1 ? -1 : 0),
          downvotes: postData.downvotes + (value === -1 ? 1 : oldVote === -1 ? -1 : 0),
        });
      }

      // Optimistically update comments
      if (commentsData && targetType === 'comment') {
        const updateComment = (comments: Comment[]): Comment[] =>
          comments.map(comment => {
            if (comment.id === targetId) {
              const oldVote = comment.user_vote || 0;
              return {
                ...comment,
                user_vote: value,
                upvotes: comment.upvotes + (value === 1 ? 1 : oldVote === 1 ? -1 : 0),
                downvotes: comment.downvotes + (value === -1 ? 1 : oldVote === -1 ? -1 : 0),
              };
            }
            return {
              ...comment,
              replies: comment.replies ? updateComment(comment.replies) : undefined,
            };
          });

        if (postId) {
          queryClient.setQueryData(['comments', postId], (old: Comment[] | undefined) => updateComment(old || []));
        }
      }

      return { postsData, postData, commentsData };
    },
    onSuccess: (result, variables) => {
      if (!result) return;

      const { targetId, targetType, postId } = variables;
      const upvotes = result?.upvotes ?? undefined;
      const downvotes = result?.downvotes ?? undefined;
      const userVote = result?.user_vote ?? undefined;

      if (targetType === 'post') {
        queryClient.setQueryData(['posts'], (old: Post[] | undefined) =>
          old?.map(post =>
            post.id === targetId
              ? { ...post, upvotes: upvotes ?? post.upvotes, downvotes: downvotes ?? post.downvotes, user_vote: userVote ?? post.user_vote }
              : post
          )
        );

        queryClient.setQueryData(['post', targetId], (old: Post | undefined) =>
          old
            ? { ...old, upvotes: upvotes ?? old.upvotes, downvotes: downvotes ?? old.downvotes, user_vote: userVote ?? old.user_vote }
            : old
        );
      }

      if (targetType === 'comment' && postId) {
        const updateComment = (comments: Comment[]): Comment[] =>
          comments.map(comment => {
            if (comment.id === targetId) {
              return {
                ...comment,
                upvotes: upvotes ?? comment.upvotes,
                downvotes: downvotes ?? comment.downvotes,
                user_vote: userVote ?? comment.user_vote,
              };
            }
            return {
              ...comment,
              replies: comment.replies ? updateComment(comment.replies) : undefined,
            };
          });

        queryClient.setQueryData(['comments', postId], (old: Comment[] | undefined) => updateComment(old || []));
      }
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.postsData) {
        queryClient.setQueryData(['posts'], context.postsData);
      }
      if (context?.postData) {
        queryClient.setQueryData(['post', context.postData.id], context.postData);
      }
      if (context?.commentsData) {
        const postId = Array.isArray(context.commentsData) ? context.commentsData[0]?.post_id : undefined;
        if (postId) {
          queryClient.setQueryData(['comments', postId], context.commentsData);
        }
      }
      toast({ title: 'Error', description: 'Failed to update vote', variant: 'destructive' });
    },
  });
}
