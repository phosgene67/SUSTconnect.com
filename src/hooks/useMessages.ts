import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  korum_id: string | null;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    department: string;
  };
  last_message?: string;
  unread_count?: number;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get other user profiles and last messages
      const conversations = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_one === user.id ? conv.participant_two : conv.participant_one;

          const [profileRes, messageRes, unreadRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, avatar_url, department, user_id')
              .eq('user_id', otherUserId)
              .single(),
            supabase
              .from('messages')
              .select('content')
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .single(),
            supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('sender_id', otherUserId)
              .eq('receiver_id', user.id)
              .eq('is_read', false),
          ]);

          return {
            ...conv,
            other_user: profileRes.data ? { ...profileRes.data, id: otherUserId } : undefined,
            last_message: messageRes.data?.content,
            unread_count: unreadRes.count || 0,
          };
        })
      );

      return conversations;
    },
    enabled: !!user,
  });
}

export function useMessages(otherUserId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`messages:${user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${otherUserId}),and(sender_id=eq.${otherUserId},receiver_id=eq.${user.id}))`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, queryClient]);

  return useQuery({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      return data;
    },
    enabled: !!user && !!otherUserId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error('Must be logged in');

      // Ensure conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_one.eq.${user.id},participant_two.eq.${receiverId}),and(participant_one.eq.${receiverId},participant_two.eq.${user.id})`)
        .single();

      if (!existingConv) {
        await supabase
          .from('conversations')
          .insert({
            participant_one: user.id,
            participant_two: receiverId,
          });
      } else {
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', existingConv.id);
      }

      // Send message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
