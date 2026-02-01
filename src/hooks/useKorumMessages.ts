import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface KorumMessage {
  id: string;
  sender_id: string;
  korum_id: string;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
    department: string;
  };
  is_pinned?: boolean;
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

      const pinnedIds = new Set(pinnedMessages?.map(p => p.message_id) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return messages?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id),
        is_pinned: pinnedIds.has(msg.id),
      })) as KorumMessage[];
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

      // Get sender profiles for pinned messages
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
    mutationFn: async ({ korumId, content }: { korumId: string; content: string }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if user can post in this korum
      const { data: korum } = await supabase
        .from('korums')
        .select('admin_only_posting')
        .eq('id', korumId)
        .single();

      if (korum?.admin_only_posting) {
        // Check if user is admin or moderator
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
