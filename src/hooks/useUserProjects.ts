import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  project_url: string | null;
  github_url: string | null;
  image_url: string | null;
  technologies: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserProjects(userId: string) {
  return useQuery({
    queryKey: ['user-projects', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', userId)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProject[];
    },
    enabled: !!userId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: {
      title: string;
      description?: string;
      project_url?: string;
      github_url?: string;
      image_url?: string;
      technologies?: string[];
      is_featured?: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('user_projects')
        .insert({
          user_id: user.id,
          title: project.title,
          description: project.description || null,
          project_url: project.project_url || null,
          github_url: project.github_url || null,
          image_url: project.image_url || null,
          technologies: project.technologies || [],
          is_featured: project.is_featured || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
      toast({ title: 'Success', description: 'Project added!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserProject> & { id: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
      toast({ title: 'Success', description: 'Project updated!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
      toast({ title: 'Success', description: 'Project deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
