import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Korum {
  id: string;
  name: string;
  description: string | null;
  type: 'batch' | 'department' | 'project' | 'club' | 'course';
  avatar_url: string | null;
  cover_url: string | null;
  is_private: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
  user_role?: 'admin' | 'moderator' | 'member';
}

export function useKorums() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['korums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('korums')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;

      // Get user membership if logged in
      if (user && data) {
        const { data: memberships } = await supabase
          .from('korum_members')
          .select('korum_id, role')
          .eq('user_id', user.id);

        const membershipMap = new Map(memberships?.map(m => [m.korum_id, m.role]) || []);
        return data.map(korum => ({
          ...korum,
          is_member: membershipMap.has(korum.id),
          user_role: membershipMap.get(korum.id),
        }));
      }

      return data;
    },
  });
}

export function useKorum(korumId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['korum', korumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('korums')
        .select('*')
        .eq('id', korumId)
        .single();

      if (error) throw error;

      // Get user membership if logged in
      if (user) {
        const { data: membership } = await supabase
          .from('korum_members')
          .select('role')
          .eq('korum_id', korumId)
          .eq('user_id', user.id)
          .single();

        return {
          ...data,
          is_member: !!membership,
          user_role: membership?.role,
        };
      }

      return data;
    },
    enabled: !!korumId,
  });
}

export function useCreateKorum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (korum: { name: string; description?: string; type: string; is_private?: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('korums')
        .insert({
          name: korum.name,
          description: korum.description || null,
          type: korum.type as any,
          is_private: korum.is_private || false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from('korum_members')
        .insert({
          korum_id: data.id,
          user_id: user.id,
          role: 'admin',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['korums'] });
      toast({ title: 'Success', description: 'Korum created!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useJoinKorum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (korumId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('korum_members')
        .insert({
          korum_id: korumId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      // Update member count
      const { data: korum } = await supabase
        .from('korums')
        .select('member_count')
        .eq('id', korumId)
        .single();

      if (korum) {
        await supabase
          .from('korums')
          .update({ member_count: (korum.member_count || 0) + 1 })
          .eq('id', korumId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['korums'] });
      queryClient.invalidateQueries({ queryKey: ['korum'] });
      toast({ title: 'Success', description: 'Joined korum!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useLeaveKorum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (korumId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('korum_members')
        .delete()
        .eq('korum_id', korumId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update member count
      const { data: korum } = await supabase
        .from('korums')
        .select('member_count')
        .eq('id', korumId)
        .single();

      if (korum) {
        await supabase
          .from('korums')
          .update({ member_count: Math.max((korum.member_count || 1) - 1, 0) })
          .eq('id', korumId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['korums'] });
      queryClient.invalidateQueries({ queryKey: ['korum'] });
      toast({ title: 'Success', description: 'Left korum' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
