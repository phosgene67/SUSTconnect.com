import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout, MobileNav } from '@/components/layout';
import { useKorum, useJoinKorum, useLeaveKorum, Korum } from '@/hooks/useKorums';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  Users, 
  Lock,
  Globe,
  MessageSquare,
  Settings,
  Shield,
  UserPlus,
  LogOut,
  ArrowLeft,
  Edit,
  Save,
  X,
  Crown,
  FileText,
} from 'lucide-react';

interface ExtendedKorum extends Korum {
  admin_only_posting?: boolean;
  allow_member_messages?: boolean;
}

export default function KorumDetail() {
  const { korumId } = useParams<{ korumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: korumData, isLoading } = useKorum(korumId || '');
  const korum = korumData as ExtendedKorum | undefined;
  const joinKorum = useJoinKorum();
  const leaveKorum = useLeaveKorum();
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    is_private: false,
    admin_only_posting: false,
  });

  // Get korum members
  const { data: members } = useQuery({
    queryKey: ['korum-members', korumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('korum_members')
        .select('*, profiles:user_id(user_id, full_name, avatar_url, department)')
        .eq('korum_id', korumId!);

      if (error) throw error;
      return data;
    },
    enabled: !!korumId && !!korum?.is_member,
  });

  // Get posts in this korum
  const { data: posts } = useQuery({
    queryKey: ['korum-posts', korumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id(full_name, avatar_url)')
        .eq('korum_id', korumId!)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!korumId && !!korum?.is_member,
  });

  // Update korum settings
  const updateKorum = useMutation({
    mutationFn: async (updates: typeof settingsForm) => {
      const { error } = await supabase
        .from('korums')
        .update({
          name: updates.name,
          description: updates.description || null,
          is_private: updates.is_private,
          admin_only_posting: updates.admin_only_posting,
        })
        .eq('id', korumId!)
        .eq('created_by', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['korum', korumId] });
      queryClient.invalidateQueries({ queryKey: ['korums'] });
      setIsEditingSettings(false);
      toast({ title: 'Success', description: 'Korum settings updated!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const startEditingSettings = () => {
    if (korum) {
      setSettingsForm({
        name: korum.name,
        description: korum.description || '',
        is_private: korum.is_private || false,
        admin_only_posting: korum.admin_only_posting || false,
      });
      setIsEditingSettings(true);
    }
  };

  const isAdmin = korum?.user_role === 'admin';
  const isModerator = korum?.user_role === 'moderator';
  const canManage = isAdmin;

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

  if (!korum) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Korum not found</h2>
          <p className="text-muted-foreground mt-2">This korum may have been deleted or doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/korums')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Korums
          </Button>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  // If private korum and user is not a member
  if (korum.is_private && !korum.is_member) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">{korum.name}</h2>
              <Badge variant="secondary" className="mb-4">
                <Lock className="h-3 w-3 mr-1" />
                Private Korum
              </Badge>
              <p className="text-muted-foreground mb-6">
                This is a private korum. You need to be invited or request access to join.
              </p>
              {user ? (
                <Button onClick={() => joinKorum.mutate(korum.id)} disabled={joinKorum.isPending}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Request to Join
                </Button>
              ) : (
                <Button onClick={() => navigate('/login')}>
                  Sign in to Join
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={korum.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  <Users className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      {korum.name}
                      {korum.is_private ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{korum.type}</Badge>
                      <Badge variant={korum.is_private ? 'secondary' : 'default'}>
                        {korum.is_private ? 'Private' : 'Public'}
                      </Badge>
                      {korum.admin_only_posting && (
                        <Badge variant="outline" className="text-warning">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin Only Posting
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {korum.member_count} members
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {korum.is_member ? (
                      <>
                        <Button asChild>
                          <Link to={`/messages`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Group Chat
                          </Link>
                        </Button>
                        {korum.created_by !== user?.id && (
                          <Button 
                            variant="outline" 
                            onClick={() => leaveKorum.mutate(korum.id)}
                            disabled={leaveKorum.isPending}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Leave
                          </Button>
                        )}
                      </>
                    ) : user ? (
                      <Button onClick={() => joinKorum.mutate(korum.id)} disabled={joinKorum.isPending}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {korum.is_private ? 'Request to Join' : 'Join Korum'}
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/login')}>
                        Sign in to Join
                      </Button>
                    )}
                  </div>
                </div>

                {korum.description && (
                  <p className="text-muted-foreground mt-4">{korum.description}</p>
                )}

                {korum.is_member && (
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary">
                      {korum.user_role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                      {korum.user_role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                      {korum.user_role?.charAt(0).toUpperCase()}{korum.user_role?.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs - Only for members */}
        {korum.is_member && (
          <Tabs defaultValue="posts">
            <TabsList>
              <TabsTrigger value="posts">
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              {canManage && (
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Posts</CardTitle>
                  {(!korum.admin_only_posting || isAdmin || isModerator) && (
                    <Button asChild size="sm">
                      <Link to={`/create-post?korum=${korumId}`}>Create Post</Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {posts && posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.map((post: any) => (
                        <Link key={post.id} to={`/post/${post.id}`}>
                          <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {post.profiles?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{post.profiles?.full_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <h3 className="font-medium">{post.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No posts yet in this korum</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Members ({korum.member_count})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {members?.map((member: any) => (
                        <Link key={member.id} to={`/profile/${member.profiles?.user_id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {member.profiles?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.profiles?.full_name}</p>
                                <p className="text-sm text-muted-foreground">{member.profiles?.department}</p>
                              </div>
                            </div>
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                              {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                              {member.role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                              {member.role}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab - Admin Only */}
            {canManage && (
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Korum Settings</CardTitle>
                    <CardDescription>
                      Manage your korum settings and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditingSettings ? (
                      <>
                        <div className="space-y-2">
                          <Label>Korum Name</Label>
                          <Input
                            value={settingsForm.name}
                            onChange={e => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={settingsForm.description}
                            onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Private Korum
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Only approved members can see posts and content
                              </p>
                            </div>
                            <Switch
                              checked={settingsForm.is_private}
                              onCheckedChange={checked => setSettingsForm(prev => ({ ...prev, is_private: checked }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Admin Only Posting
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Only admins and moderators can create posts and send messages
                              </p>
                            </div>
                            <Switch
                              checked={settingsForm.admin_only_posting}
                              onCheckedChange={checked => setSettingsForm(prev => ({ ...prev, admin_only_posting: checked }))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => updateKorum.mutate(settingsForm)} disabled={updateKorum.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditingSettings(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {korum.is_private ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Globe className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">Privacy</p>
                                <p className="text-sm text-muted-foreground">
                                  {korum.is_private ? 'Private - Only members can see content' : 'Public - Anyone can see and join'}
                                </p>
                              </div>
                            </div>
                            <Badge>{korum.is_private ? 'Private' : 'Public'}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Posting Permissions</p>
                                <p className="text-sm text-muted-foreground">
                                  {korum.admin_only_posting 
                                    ? 'Only admins and moderators can post' 
                                    : 'All members can post'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={korum.admin_only_posting ? 'secondary' : 'default'}>
                              {korum.admin_only_posting ? 'Restricted' : 'Open'}
                            </Badge>
                          </div>
                        </div>
                        <Button onClick={startEditingSettings}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Settings
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Public view for non-members of public korums */}
        {!korum.is_member && !korum.is_private && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Join to see content</h3>
              <p className="text-muted-foreground mb-4">
                Join this korum to see posts, participate in discussions, and connect with members.
              </p>
              {user ? (
                <Button onClick={() => joinKorum.mutate(korum.id)} disabled={joinKorum.isPending}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Korum
                </Button>
              ) : (
                <Button onClick={() => navigate('/login')}>
                  Sign in to Join
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <MobileNav />
    </MainLayout>
  );
}
