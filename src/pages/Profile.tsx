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
} from 'lucide-react';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: currentUserProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    skills: [] as string[],
    social_linkedin: '',
    social_github: '',
    social_portfolio: '',
  });
  const [newSkill, setNewSkill] = useState('');
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {isOwnProfile ? (
                <ImageUpload
                  currentImage={profile.avatar_url}
                  onUpload={uploadAvatar}
                  isUploading={isUploadingAvatar}
                  fallback={profile.full_name}
                  type="profile"
                />
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    {isEditing ? (
                      <Input
                        value={editForm.full_name}
                        onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="text-2xl font-bold mb-2"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {profile.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Session {profile.batch}
                      </span>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => updateProfile.mutate(editForm)}>
                            <Save className="h-4 w-4 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={startEditing}>
                          <Edit className="h-4 w-4 mr-1" /> Edit Profile
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-4">
                  {isEditing ? (
                    <Textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {profile.bio || 'No bio yet.'}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-3 mt-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        <Input
                          value={editForm.social_linkedin}
                          onChange={e => setEditForm(prev => ({ ...prev, social_linkedin: e.target.value }))}
                          placeholder="LinkedIn URL"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <Input
                          value={editForm.social_github}
                          onChange={e => setEditForm(prev => ({ ...prev, social_github: e.target.value }))}
                          placeholder="GitHub URL"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <Input
                          value={editForm.social_portfolio}
                          onChange={e => setEditForm(prev => ({ ...prev, social_portfolio: e.target.value }))}
                          placeholder="Portfolio URL"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {profile.social_linkedin && (
                        <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {profile.social_github && (
                        <a href={profile.social_github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {profile.social_portfolio && (
                        <a href={profile.social_portfolio} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(isEditing ? editForm.skills : profile.skills || []).map(skill => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  {isEditing && (
                    <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    placeholder="Add skill"
                    className="h-8 w-32"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button size="sm" variant="outline" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!isEditing && (!profile.skills || profile.skills.length === 0) && (
                <span className="text-muted-foreground">No skills added yet.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Research Papers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Research Papers
            </CardTitle>
            {isOwnProfile && (
              <Dialog open={isResearchDialogOpen} onOpenChange={setIsResearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Research
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
                      className="w-full"
                    >
                      {createResearch.isPending ? 'Adding...' : 'Add Research'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {research && research.length > 0 ? (
              <div className="space-y-4">
                {research.map(paper => (
                  <div key={paper.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{paper.title}</h3>
                        {paper.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{paper.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {paper.published_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(paper.published_at), 'MMM yyyy')}
                            </span>
                          )}
                          {paper.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {paper.publication_url && (
                          <a href={paper.publication_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteResearch.mutate(paper.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No research papers yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </CardTitle>
            {isOwnProfile && (
              <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Project
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
                      className="w-full"
                    >
                      {createProject.isPending ? 'Adding...' : 'Add Project'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{project.title}</h3>
                      <div className="flex items-center gap-1">
                        {project.project_url && (
                          <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <Github className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteProject.mutate(project.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map(tech => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No projects yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.achievements && profile.achievements.length > 0 ? (
              <ul className="space-y-2">
                {profile.achievements.map((achievement, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {achievement}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No achievements yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
