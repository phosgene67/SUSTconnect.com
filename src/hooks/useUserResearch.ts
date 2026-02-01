import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserResearch {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  publication_url: string | null;
  published_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useUserResearch(userId: string) {
  return useQuery({
    queryKey: ['user-research', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_research')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as UserResearch[];
    },
    enabled: !!userId,
  });
}

export function useCreateResearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (research: {
      title: string;
      description?: string;
      publication_url?: string;
      published_at?: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('user_research')
        .insert({
          user_id: user.id,
          title: research.title,
          description: research.description || null,
          publication_url: research.publication_url || null,
          published_at: research.published_at || null,
          tags: research.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-research'] });
      toast({ title: 'Success', description: 'Research paper added!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateResearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserResearch> & { id: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_research')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-research'] });
      toast({ title: 'Success', description: 'Research paper updated!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteResearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_research')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-research'] });
      toast({ title: 'Success', description: 'Research paper deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
