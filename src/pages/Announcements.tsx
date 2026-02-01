import { useState } from 'react';
import { MainLayout, MobileNav } from '@/components/layout';
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useAnnouncements';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { 
  Megaphone, 
  Pin, 
  AlertTriangle, 
  AlertCircle,
  Plus,
} from 'lucide-react';

const priorityBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon?: typeof AlertTriangle }> = {
  normal: { label: 'Normal', variant: 'secondary' },
  important: { label: 'Important', variant: 'default', icon: AlertCircle },
  urgent: { label: 'Urgent', variant: 'destructive', icon: AlertTriangle },
};

export default function Announcements() {
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const { profile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_type: 'university',
  });

  // Check if user can create announcements (admin or teacher)
  // For now, we'll allow any logged-in user to try (RLS will handle permissions)
  const canCreate = !!profile;

  const handleCreate = () => {
    createAnnouncement.mutate(form, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setForm({ title: '', content: '', priority: 'normal', target_type: 'university' });
      },
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Announcements
          </h1>

          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Content"
                    value={form.content}
                    onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={form.priority}
                      onValueChange={value => setForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={form.target_type}
                      onValueChange={value => setForm(prev => ({ ...prev, target_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="batch">Batch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreate} 
                    disabled={!form.title || !form.content || createAnnouncement.isPending}
                    className="w-full"
                  >
                    {createAnnouncement.isPending ? 'Creating...' : 'Create Announcement'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {announcements && announcements.length > 0 ? (
            announcements.map(announcement => {
              const priority = priorityBadges[announcement.priority];
              const PriorityIcon = priority.icon;

              return (
                <Card 
                  key={announcement.id}
                  className={
                    announcement.priority === 'urgent' 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : announcement.priority === 'important'
                        ? 'border-primary/50 bg-primary/5'
                        : ''
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      </div>
                      <Badge variant={priority.variant} className="flex items-center gap-1">
                        {PriorityIcon && <PriorityIcon className="h-3 w-3" />}
                        {priority.label}
                      </Badge>
                    </div>
                    {announcement.author && (
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={announcement.author.avatar_url || undefined} />
                          <AvatarFallback>
                            {announcement.author.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{announcement.author.full_name}</span>
                        <span>•</span>
                        <span>{announcement.author.department}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                        </span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No announcements yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
