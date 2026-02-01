import { useState } from 'react';
import { MainLayout, MobileNav } from '@/components/layout';
import { useKorums, useCreateKorum, useJoinKorum, useLeaveKorum, Korum } from '@/hooks/useKorums';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUpload } from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Lock,
  Globe,
  GraduationCap,
  Building,
  FolderKanban,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const korumTypeIcons = {
  batch: GraduationCap,
  department: Building,
  project: FolderKanban,
  club: Sparkles,
  course: BookOpen,
};

const korumTypeColors = {
  batch: 'bg-blue-500/10 text-blue-500',
  department: 'bg-green-500/10 text-green-500',
  project: 'bg-purple-500/10 text-purple-500',
  club: 'bg-orange-500/10 text-orange-500',
  course: 'bg-pink-500/10 text-pink-500',
};

export default function Korums() {
  const { data: korums, isLoading } = useKorums();
  const createKorum = useCreateKorum();
  const joinKorum = useJoinKorum();
  const leaveKorum = useLeaveKorum();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'project',
    is_private: false,
    avatar_url: '',
  });

  const { upload: uploadKorumAvatar, isUploading: isUploadingAvatar } = useImageUpload({
    bucket: 'korum-images',
    folder: 'avatars',
    onSuccess: (url) => {
      setForm(prev => ({ ...prev, avatar_url: url }));
    },
  });

  const handleCreate = () => {
    createKorum.mutate({
      name: form.name,
      description: form.description,
      type: form.type,
      is_private: form.is_private,
      avatar_url: form.avatar_url || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setForm({ name: '', description: '', type: 'project', is_private: false, avatar_url: '' });
      },
    });
  };

  const filteredKorums = (korums as Korum[] | undefined)?.filter(k => 
    filter === 'all' || k.type === filter || (filter === 'joined' && k.is_member)
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Korums
          </h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Korums</SelectItem>
                <SelectItem value="joined">Joined</SelectItem>
                <SelectItem value="batch">Batch</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="club">Club</SelectItem>
                <SelectItem value="course">Course</SelectItem>
              </SelectContent>
            </Select>

            {user && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Korum
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Korum</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Korum Avatar Upload */}
                    <div className="flex justify-center">
                      <ImageUpload
                        currentImage={form.avatar_url}
                        onUpload={uploadKorumAvatar}
                        isUploading={isUploadingAvatar}
                        type="korum"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Click to upload korum photo</p>
                    <div>
                      <Input
                        placeholder="e.g., EEE 2020, EEE Study Group"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Examples: EEE Batch 2021, EEE Circuit Lab, EEE Project Team
                      </p>
                    </div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                    <Select
                      value={form.type}
                      onValueChange={value => setForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batch">Batch</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="club">Club</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="private" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private Korum
                      </Label>
                      <Switch
                        id="private"
                        checked={form.is_private}
                        onCheckedChange={checked => setForm(prev => ({ ...prev, is_private: checked }))}
                      />
                    </div>
                    <Button 
                      onClick={handleCreate} 
                      disabled={!form.name || createKorum.isPending || isUploadingAvatar}
                      className="w-full"
                    >
                      {createKorum.isPending ? 'Creating...' : 'Create Korum'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKorums && filteredKorums.length > 0 ? (
            filteredKorums.map(korum => {
              const TypeIcon = korumTypeIcons[korum.type] || Users;
              const typeColor = korumTypeColors[korum.type] || '';

              return (
                <Card key={korum.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={korum.avatar_url || undefined} />
                          <AvatarFallback className={typeColor}>
                            <TypeIcon className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {korum.name}
                            {korum.is_private && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {korum.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {korum.member_count} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {korum.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {korum.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/korums/${korum.id}`}>View</Link>
                      </Button>
                      {user && !korum.is_member && (
                        <Button 
                          size="sm" 
                          onClick={() => joinKorum.mutate(korum.id)}
                          disabled={joinKorum.isPending}
                          className="flex-1"
                        >
                          Join
                        </Button>
                      )}
                      {user && korum.is_member && korum.created_by !== user.id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => leaveKorum.mutate(korum.id)}
                          disabled={leaveKorum.isPending}
                          className="flex-1"
                        >
                          Leave
                        </Button>
                      )}
                      {korum.is_member && (
                        <Badge variant="secondary" className="ml-auto">
                          {korum.user_role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No korums found</p>
                {user && (
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    Create your first Korum
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
