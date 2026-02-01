import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name?: string;
}

export interface KorumMessage {
  id: string;
  sender_id: string;
  korum_id: string;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  reply_to_id: string | null;
  sender?: {
    full_name: string;
    avatar_url: string | null;
    department: string;
  };
  is_pinned?: boolean;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
  reactions?: MessageReaction[];
}

export function useKorumMessages(korumId: string) {
  return useQuery({
    queryKey: ['korum-messages', korumId],
    queryFn: async () => {
      // Get messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('korum_id', korumId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department')
        .in('user_id', senderIds);

      // Get pinned messages
      const { data: pinnedMessages } = await supabase
        .from('korum_pinned_messages')
        .select('message_id')
        .eq('korum_id', korumId);

      // Get reactions
      const messageIds = messages?.map(m => m.id) || [];
      const { data: reactions } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      // Get reply-to messages
      const replyToIds = messages?.filter(m => m.reply_to_id).map(m => m.reply_to_id) || [];
      const { data: replyToMessages } = replyToIds.length > 0
        ? await supabase
            .from('messages')
            .select('id, content, sender_id')
            .in('id', replyToIds)
        : { data: [] };

      const pinnedIds = new Set(pinnedMessages?.map(p => p.message_id) || []);
      const profileMap = new Map<string, { user_id: string; full_name: string; avatar_url: string | null; department: string }>();
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

      return messages?.map(msg => {
        const replyTo = msg.reply_to_id ? replyToMap.get(msg.reply_to_id) : null;
        return {
          ...msg,
          sender: profileMap.get(msg.sender_id),
          is_pinned: pinnedIds.has(msg.id),
          reactions: reactionsMap.get(msg.id) || [],
          reply_to: replyTo ? {
            id: replyTo.id,
            content: replyTo.content,
            sender_name: profileMap.get(replyTo.sender_id)?.full_name || 'Unknown',
          } : undefined,
        };
      }) as KorumMessage[];
    },
    enabled: !!korumId,
  });
}

export function useKorumMembers(korumId: string) {
  return useQuery({
    queryKey: ['korum-members-chat', korumId],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('korum_members')
        .select('*')
        .eq('korum_id', korumId);

      if (error) throw error;
      if (!members || members.length === 0) return [];

      // Fetch profiles separately
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department')
        .in('user_id', userIds);

      const profileMap = new Map<string, { user_id: string; full_name: string; avatar_url: string | null; department: string }>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));

      return members.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id) || null,
      }));
    },
    enabled: !!korumId,
  });
}

export function usePinnedMessages(korumId: string) {
  return useQuery({
    queryKey: ['korum-pinned-messages', korumId],
    queryFn: async () => {
      const { data: pinnedMessages, error } = await supabase
        .from('korum_pinned_messages')
        .select('*, messages(*)')
        .eq('korum_id', korumId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;

      const messageData = pinnedMessages?.map(p => (p as any).messages) || [];
      const senderIds = [...new Set(messageData.map((m: any) => m?.sender_id).filter(Boolean))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return pinnedMessages?.map(pinned => ({
        ...pinned,
        message: {
          ...(pinned as any).messages,
          sender: profileMap.get((pinned as any).messages?.sender_id),
        },
      }));
    },
    enabled: !!korumId,
  });
}

export function useSendKorumMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ korumId, content, replyToId }: { korumId: string; content: string; replyToId?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data: korum } = await supabase
        .from('korums')
        .select('admin_only_posting')
        .eq('id', korumId)
        .single();

      if (korum?.admin_only_posting) {
        const { data: membership } = await supabase
          .from('korum_members')
          .select('role')
          .eq('korum_id', korumId)
          .eq('user_id', user.id)
          .single();

        if (!membership || !['admin', 'moderator'].includes(membership.role || '')) {
          throw new Error('Only admins and moderators can post in this korum');
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          korum_id: korumId,
          content,
          reply_to_id: replyToId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['korum-messages', variables.korumId] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, korumId }: { messageId: string; korumId?: string; receiverId?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.korumId) {
        queryClient.invalidateQueries({ queryKey: ['korum-messages', variables.korumId] });
      }
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Success', description: 'Message deleted for everyone' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReactToMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, emoji, korumId }: { messageId: string; emoji: string; korumId?: string; receiverId?: string }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, variables) => {
      if (variables.korumId) {
        queryClient.invalidateQueries({ queryKey: ['korum-messages', variables.korumId] });
      }
      if (variables.receiverId) {
        queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      }
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ korumId, messageId }: { korumId: string; messageId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('korum_pinned_messages')
        .insert({
          korum_id: korumId,
          message_id: messageId,
          pinned_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['korum-messages', variables.korumId] });
      queryClient.invalidateQueries({ queryKey: ['korum-pinned-messages', variables.korumId] });
      toast({ title: 'Success', description: 'Message pinned!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ korumId, messageId }: { korumId: string; messageId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('korum_pinned_messages')
        .delete()
        .eq('korum_id', korumId)
        .eq('message_id', messageId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['korum-messages', variables.korumId] });
      queryClient.invalidateQueries({ queryKey: ['korum-pinned-messages', variables.korumId] });
      toast({ title: 'Success', description: 'Message unpinned' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
