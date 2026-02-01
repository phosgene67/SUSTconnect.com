import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout, MobileNav } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
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
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

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
                        Batch {profile.batch}
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
