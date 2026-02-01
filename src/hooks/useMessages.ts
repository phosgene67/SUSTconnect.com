import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  korum_id: string | null;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  reply_to_id: string | null;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
  reactions?: MessageReaction[];
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

  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`messages:${user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
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

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);

      // Get reactions
      const messageIds = messages?.map(m => m.id) || [];
      const { data: reactions } = messageIds.length > 0
        ? await supabase
            .from('message_reactions')
            .select('*')
            .in('message_id', messageIds)
        : { data: [] };

      // Get reply-to messages
      const replyToIds = messages?.filter(m => m.reply_to_id).map(m => m.reply_to_id) || [];
      const { data: replyToMessages } = replyToIds.length > 0
        ? await supabase
            .from('messages')
            .select('id, content, sender_id')
            .in('id', replyToIds)
        : { data: [] };

      const profileMap = new Map<string, { user_id: string; full_name: string; avatar_url: string | null }>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));
      
      const replyToMap = new Map<string, { id: string; content: string; sender_id: string }>();
      replyToMessages?.forEach((m: any) => replyToMap.set(m.id, m));

      // Group reactions by message
      const reactionsMap = new Map<string, MessageReaction[]>();
      reactions?.forEach(r => {
        const existing = reactionsMap.get(r.message_id) || [];
        existing.push({
          id: r.id,
          emoji: r.emoji,
          user_id: r.user_id,
          user_name: profileMap.get(r.user_id)?.full_name,
        });
        reactionsMap.set(r.message_id, existing);
      });

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      return messages?.map(msg => {
        const replyTo = msg.reply_to_id ? replyToMap.get(msg.reply_to_id) : null;
        return {
          ...msg,
          sender: profileMap.get(msg.sender_id),
          reactions: reactionsMap.get(msg.id) || [],
          reply_to: replyTo ? {
            id: replyTo.id,
            content: replyTo.content,
            sender_name: profileMap.get(replyTo.sender_id)?.full_name || 'Unknown',
          } : undefined,
        };
      }) as Message[];
    },
    enabled: !!user && !!otherUserId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content, replyToId }: { receiverId: string; content: string; replyToId?: string }) => {
      if (!user) throw new Error('Must be logged in');

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

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          reply_to_id: replyToId || null,
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
