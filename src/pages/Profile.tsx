import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout, MobileNav } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserResearch, useCreateResearch, useDeleteResearch } from '@/hooks/useUserResearch';
import { useUserProjects, useCreateProject, useDeleteProject } from '@/hooks/useUserProjects';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUpload } from '@/components/ImageUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Calendar,
  Linkedin,
  Github,
  Globe,
  Edit,
  Save,
  X,
  Plus,
  FileText,
  FolderKanban,
  ExternalLink,
  Trash2,
  Ban,
  Award,
  Sparkles,
  MapPin,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: currentUserProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    skills: [] as string[],
    achievements: [] as string[],
    social_linkedin: '',
    social_github: '',
    social_portfolio: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [researchForm, setResearchForm] = useState({
    title: '',
    description: '',
    publication_url: '',
    published_at: '',
    tags: '',
  });
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    project_url: '',
    github_url: '',
    technologies: '',
  });

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });

  const { data: research } = useUserResearch(targetUserId || '');
  const { data: projects } = useUserProjects(targetUserId || '');
  const createResearch = useCreateResearch();
  const deleteResearch = useDeleteResearch();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const updateProfile = useMutation({
    mutationFn: async (updates: typeof editForm) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          bio: updates.bio,
          skills: updates.skills,
          achievements: updates.achievements,
          social_linkedin: updates.social_linkedin || null,
          social_github: updates.social_github || null,
          social_portfolio: updates.social_portfolio || null,
        })
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      setIsEditing(false);
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateAvatar = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      toast({ title: 'Success', description: 'Profile picture updated!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const { upload: uploadAvatar, isUploading: isUploadingAvatar } = useImageUpload({
    bucket: 'avatars',
    folder: user?.id,
    onSuccess: (url) => {
      updateAvatar.mutate(url);
    },
  });

  const startEditing = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name,
        bio: profile.bio || '',
        skills: profile.skills || [],
          achievements: profile.achievements || [],
        social_linkedin: profile.social_linkedin || '',
        social_github: profile.social_github || '',
        social_portfolio: profile.social_portfolio || '',
      });
      setIsEditing(true);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim() && !editForm.achievements.includes(newAchievement.trim()) && editForm.achievements.length < 10) {
      setEditForm(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()],
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (achievement: string) => {
    setEditForm(prev => ({
      ...prev,
      achievements: prev.achievements.filter(item => item !== achievement),
    }));
  };

  const handleAddResearch = () => {
    createResearch.mutate(
      {
        title: researchForm.title,
        description: researchForm.description || undefined,
        publication_url: researchForm.publication_url || undefined,
        published_at: researchForm.published_at || undefined,
        tags: researchForm.tags ? researchForm.tags.split(',').map(t => t.trim()) : [],
      },
      {
        onSuccess: () => {
          setIsResearchDialogOpen(false);
          setResearchForm({ title: '', description: '', publication_url: '', published_at: '', tags: '' });
        },
      }
    );
  };

  const handleAddProject = () => {
    createProject.mutate(
      {
        title: projectForm.title,
        description: projectForm.description || undefined,
        project_url: projectForm.project_url || undefined,
        github_url: projectForm.github_url || undefined,
        technologies: projectForm.technologies ? projectForm.technologies.split(',').map(t => t.trim()) : [],
      },
      {
        onSuccess: () => {
          setIsProjectDialogOpen(false);
          setProjectForm({ title: '', description: '', project_url: '', github_url: '', technologies: '' });
        },
      }
    );
  };

  const featuredProject = projects?.find(project => project.is_featured) || projects?.[0];
  const projectList = projects || [];
  const otherProjects = projectList.filter(project => project.id !== featuredProject?.id);
  const researchList = research || [];
  const contactEmail = isOwnProfile ? user?.email : undefined;
  const profileStats = [
    { label: 'Projects', value: projects?.length || 0, icon: FolderKanban },
    { label: 'Research', value: research?.length || 0, icon: FileText },
    { label: 'Skills', value: profile?.skills?.length || 0, icon: Sparkles },
    { label: 'Achievements', value: profile?.achievements?.length || 0, icon: Award },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Profile not found</h2>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative overflow-hidden bg-gradient-to-b from-red-50/80 via-background to-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-red-100/70 via-red-50/20 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-28 h-80 w-80 rounded-full bg-red-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-red-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            <aside className="space-y-6 lg:sticky lg:top-20 lg:col-span-4 xl:col-span-3">
              <Card className="overflow-hidden rounded-3xl border-red-100/70 bg-white/95 shadow-xl shadow-red-950/5 backdrop-blur">
                <div className="h-24 bg-gradient-to-r from-red-950 via-red-900 to-red-700" />
                <CardContent className="pt-0 -mt-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow" />
                      {isOwnProfile ? (
                        <ImageUpload
                          currentImage={profile.avatar_url}
                          onUpload={uploadAvatar}
                          isUploading={isUploadingAvatar}
                          fallback={profile.full_name}
                          type="profile"
                        />
                      ) : (
                        <Avatar className="h-32 w-32 border-4 border-white shadow-lg shadow-red-950/10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-4xl bg-red-50 text-red-900">
                            {profile.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <div className="mt-5 w-full space-y-3">
                      {isEditing ? (
                        <Input
                          value={editForm.full_name}
                          onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          className="h-11 text-center text-lg font-bold"
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                            {profile.user_type && (
                              <RoleBadge
                                userType={profile.user_type as 'student' | 'teacher' | 'alumni' | 'developer'}
                              />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Badge className="rounded-full border border-red-200 bg-red-50 text-red-800 hover:bg-red-50">
                              <GraduationCap className="mr-1 h-3.5 w-3.5" />
                              {profile.department}
                            </Badge>
                            <Badge variant="secondary" className="rounded-full">
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              Session {profile.batch}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {profile.status && profile.status !== 'active' && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                          <Ban className="h-3 w-3" />
                          {profile.status === 'banned' ? 'Banned Account' : 'Restricted Account'}
                        </div>
                      )}

                      {isEditing ? (
                        <Textarea
                          value={editForm.bio}
                          onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          className="resize-none"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {profile.bio || 'No bio yet.'}
                        </p>
                      )}
                    </div>

                    {isOwnProfile && (
                      <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              className="rounded-xl bg-red-900 text-white hover:bg-red-800"
                              onClick={() => updateProfile.mutate(editForm)}
                              disabled={updateProfile.isPending}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-xl border-gray-200"
                              onClick={() => setIsEditing(false)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            className="rounded-xl border-red-200 text-red-800 hover:bg-red-50"
                            onClick={startEditing}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="h-4 w-4 text-red-800" />
                    Contact List
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <span className="break-all font-medium text-gray-900">
                        {contactEmail || 'Available in your account session'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span>{profile.department}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Session {profile.batch}</span>
                    </div>
                  </div>

                  <Separator />

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-gray-400" />
                        <Input
                          value={editForm.social_linkedin}
                          onChange={e => setEditForm(prev => ({ ...prev, social_linkedin: e.target.value }))}
                          placeholder="LinkedIn URL"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-gray-400" />
                        <Input
                          value={editForm.social_github}
                          onChange={e => setEditForm(prev => ({ ...prev, social_github: e.target.value }))}
                          placeholder="GitHub URL"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <Input
                          value={editForm.social_portfolio}
                          onChange={e => setEditForm(prev => ({ ...prev, social_portfolio: e.target.value }))}
                          placeholder="Portfolio URL"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.social_linkedin && (
                        <a
                          href={profile.social_linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {profile.social_github && (
                        <a
                          href={profile.social_github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                        >
                          <Github className="h-4 w-4" />
                          GitHub
                        </a>
                      )}
                      {profile.social_portfolio && (
                        <a
                          href={profile.social_portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-800"
                        >
                          <Globe className="h-4 w-4" />
                          Portfolio
                        </a>
                      )}
                      {!profile.social_linkedin && !profile.social_github && !profile.social_portfolio && (
                        <span className="text-sm text-muted-foreground">No external links added yet.</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-red-800" />
                    Core Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {(isEditing ? editForm.skills : profile.skills || []).map(skill => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1 rounded-full px-3 py-1">
                        {skill}
                        {isEditing && (
                          <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <div className="flex w-full items-center gap-2">
                        <Input
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          placeholder="Add skill"
                          className="h-9 flex-1"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        />
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={addSkill}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {!isEditing && (!profile.skills || profile.skills.length === 0) && (
                      <span className="text-sm text-muted-foreground">No skills added yet.</span>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Achievements</h3>
                      {!isEditing && (
                        <span className="text-xs text-muted-foreground">
                          {profile.achievements?.length || 0} items
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(isEditing ? editForm.achievements : profile.achievements || []).map(achievement => (
                        <Badge key={achievement} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-800 hover:bg-red-50">
                          {achievement}
                          {isEditing && (
                            <button onClick={() => removeAchievement(achievement)} className="ml-2 hover:text-red-950">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {isEditing && (
                        <div className="flex w-full items-center gap-2">
                          <Input
                            value={newAchievement}
                            onChange={e => setNewAchievement(e.target.value)}
                            placeholder="Add achievement"
                            className="h-9 flex-1"
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                          />
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={addAchievement}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {!isEditing && (!profile.achievements || profile.achievements.length === 0) && (
                        <span className="text-sm text-muted-foreground">No achievements yet.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </aside>

            <main className="space-y-6 lg:col-span-8 xl:col-span-9">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {profileStats.map(({ label, value, icon: Icon }) => (
                  <Card key={label} className="rounded-3xl border border-gray-200 bg-white/90 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-800">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-muted-foreground">{label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs defaultValue="projects" className="space-y-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-gray-200 bg-white/90 p-1 shadow-sm">
                    <TabsTrigger value="projects" className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-red-900 data-[state=active]:text-white">
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Projects
                    </TabsTrigger>
                    <TabsTrigger value="research" className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-red-900 data-[state=active]:text-white">
                      <FileText className="mr-2 h-4 w-4" />
                      Research Papers
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-red-900 data-[state=active]:text-white">
                      <Award className="mr-2 h-4 w-4" />
                      Achievements
                    </TabsTrigger>
                  </TabsList>

                  {isOwnProfile && !isEditing && (
                    <Button
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-800 hover:bg-red-50"
                      onClick={startEditing}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                <TabsContent value="projects" className="space-y-6">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Featured Active Portfolios</h2>
                      <p className="text-sm text-muted-foreground">Showcase your active work, engineering builds, and live experiments.</p>
                    </div>
                    {isOwnProfile && (
                      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-xl bg-red-900 text-white hover:bg-red-800">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Project</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Project Title"
                              value={projectForm.title}
                              onChange={e => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={projectForm.description}
                              onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                            <Input
                              placeholder="Project URL (optional)"
                              value={projectForm.project_url}
                              onChange={e => setProjectForm(prev => ({ ...prev, project_url: e.target.value }))}
                            />
                            <Input
                              placeholder="GitHub URL (optional)"
                              value={projectForm.github_url}
                              onChange={e => setProjectForm(prev => ({ ...prev, github_url: e.target.value }))}
                            />
                            <Input
                              placeholder="Technologies (comma separated)"
                              value={projectForm.technologies}
                              onChange={e => setProjectForm(prev => ({ ...prev, technologies: e.target.value }))}
                            />
                            <Button
                              onClick={handleAddProject}
                              disabled={!projectForm.title || createProject.isPending}
                              className="w-full rounded-xl bg-red-900 text-white hover:bg-red-800"
                            >
                              {createProject.isPending ? 'Adding...' : 'Add Project'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {featuredProject ? (
                    <Card className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-lg shadow-red-950/5">
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-900 transition-colors hover:text-red-800">{featuredProject.title}</h3>
                              <Badge className="rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                                {featuredProject.is_featured ? 'Active Development' : 'Portfolio Highlight'}
                              </Badge>
                            </div>
                            {featuredProject.description && (
                              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                {featuredProject.description}
                              </p>
                            )}
                            {featuredProject.technologies && featuredProject.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {featuredProject.technologies.map(tech => (
                                  <Badge key={tech} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {featuredProject.project_url && (
                              <a href={featuredProject.project_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="rounded-xl border-red-200 text-red-800 hover:bg-red-50">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Project
                                </Button>
                              </a>
                            )}
                            {featuredProject.github_url && (
                              <a href={featuredProject.github_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
                                  <Github className="mr-2 h-4 w-4" />
                                  Source
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-red-800" />
                            Featured portfolio
                          </span>
                          <span>{format(new Date(featuredProject.created_at), 'MMM yyyy')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="rounded-3xl border-dashed border-gray-300 bg-white/80">
                      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                        <FolderKanban className="h-10 w-10 text-red-200" />
                        <div>
                          <p className="font-semibold text-gray-900">No projects yet</p>
                          <p className="text-sm text-muted-foreground">Add your first portfolio item to showcase your work.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {otherProjects.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {otherProjects.map(project => (
                        <Card key={project.id} className="rounded-3xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-bold text-gray-900">{project.title}</h3>
                                  {project.is_featured && (
                                    <Badge className="rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">Featured</Badge>
                                  )}
                                </div>
                                {project.description && (
                                  <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
                                )}
                              </div>
                              <div className="rounded-2xl bg-red-50 p-3 text-red-800">
                                <FolderKanban className="h-5 w-5" />
                              </div>
                            </div>

                            {project.technologies && project.technologies.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {project.technologies.map(tech => (
                                  <Badge key={tech} variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
                              <span className="text-xs text-muted-foreground">
                                Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
                              </span>
                              <div className="flex items-center gap-1">
                                {project.project_url && (
                                  <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="ghost" className="rounded-xl">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                                {project.github_url && (
                                  <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="ghost" className="rounded-xl">
                                      <Github className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                                {isOwnProfile && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() => deleteProject.mutate(project.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="research" className="space-y-6">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Research Papers</h2>
                      <p className="text-sm text-muted-foreground">Publications, abstracts, and conference submissions.</p>
                    </div>
                    {isOwnProfile && (
                      <Dialog open={isResearchDialogOpen} onOpenChange={setIsResearchDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-xl bg-red-900 text-white hover:bg-red-800">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Research Paper</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Title"
                              value={researchForm.title}
                              onChange={e => setResearchForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={researchForm.description}
                              onChange={e => setResearchForm(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                            <Input
                              placeholder="Publication URL (optional)"
                              value={researchForm.publication_url}
                              onChange={e => setResearchForm(prev => ({ ...prev, publication_url: e.target.value }))}
                            />
                            <Input
                              type="date"
                              placeholder="Publication Date"
                              value={researchForm.published_at}
                              onChange={e => setResearchForm(prev => ({ ...prev, published_at: e.target.value }))}
                            />
                            <Input
                              placeholder="Tags (comma separated)"
                              value={researchForm.tags}
                              onChange={e => setResearchForm(prev => ({ ...prev, tags: e.target.value }))}
                            />
                            <Button
                              onClick={handleAddResearch}
                              disabled={!researchForm.title || createResearch.isPending}
                              className="w-full rounded-xl bg-red-900 text-white hover:bg-red-800"
                            >
                              {createResearch.isPending ? 'Adding...' : 'Add Research'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {researchList.length > 0 ? (
                    <div className="space-y-4">
                      {researchList.map((paper, index) => (
                        <Card key={paper.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-4">
                                  <div className="rounded-2xl bg-red-50 p-3 text-red-900">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-lg font-bold text-gray-900">{paper.title}</h3>
                                      {index === 0 && (
                                        <Badge className="rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">Latest</Badge>
                                      )}
                                    </div>
                                    {paper.description && (
                                      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{paper.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      {paper.published_at && (
                                        <span>{format(new Date(paper.published_at), 'MMM yyyy')}</span>
                                      )}
                                      {paper.tags?.map(tag => (
                                        <Badge key={tag} variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {paper.publication_url && (
                                  <a href={paper.publication_url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="ghost" className="rounded-xl">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                                {isOwnProfile && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() => deleteResearch.mutate(paper.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="rounded-3xl border-dashed border-gray-300 bg-white/80">
                      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                        <FileText className="h-10 w-10 text-red-200" />
                        <div>
                          <p className="font-semibold text-gray-900">No research papers yet</p>
                          <p className="text-sm text-muted-foreground">Add publications, abstracts, or conference work here.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="achievements" className="space-y-6">
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Achievements</h2>
                      <p className="text-sm text-muted-foreground">Badges, awards, accomplishments, and recognitions.</p>
                    </div>
                    <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                      {profile.achievements?.length || 0} achievements
                    </div>
                  </div>

                  {profile.achievements && profile.achievements.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {profile.achievements.map((achievement, index) => (
                        <Card key={`${achievement}-${index}`} className="rounded-3xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:col-span-1">
                          <CardContent className="flex items-start gap-4 p-5">
                            <div className="rounded-2xl bg-red-50 p-3 text-red-800">
                              <Award className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-bold text-gray-900">{achievement}</h3>
                                <span className="text-xs text-muted-foreground">{index + 1}</span>
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                Recognized achievement listed on this profile.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="rounded-3xl border-dashed border-gray-300 bg-white/80">
                      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                        <Award className="h-10 w-10 text-red-200" />
                        <div>
                          <p className="font-semibold text-gray-900">No achievements yet</p>
                          <p className="text-sm text-muted-foreground">Add your wins, awards, and milestones to this section.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
