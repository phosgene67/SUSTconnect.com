import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  target_type: 'university' | 'department' | 'batch' | 'korum';
  target_value: string | null;
  is_pinned: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    department: string;
  };
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data: rawAnnouncements, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get author profiles
      const authorIds = [...new Set(rawAnnouncements?.map(a => a.author_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, department')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return rawAnnouncements?.map(announcement => ({
        ...announcement,
        author: profileMap.get(announcement.author_id),
      })) as Announcement[];
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (announcement: {
      title: string;
      content: string;
      priority?: string;
      target_type?: string;
      target_value?: string;
      is_pinned?: boolean;
      expires_at?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          author_id: user.id,
          title: announcement.title,
          content: announcement.content,
          priority: (announcement.priority || 'normal') as any,
          target_type: (announcement.target_type || 'university') as any,
          target_value: announcement.target_value || null,
          is_pinned: announcement.is_pinned || false,
          expires_at: announcement.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Success', description: 'Announcement created!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
