import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout, MobileNav } from '@/components/layout';
import { useCreatePost } from '@/hooks/usePosts';
import { useKorums, Korum } from '@/hooks/useKorums';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  PenLine, 
  X,
  Plus,
  HelpCircle,
  FolderKanban,
  Bell,
  MessageCircleQuestion,
  BookOpen,
} from 'lucide-react';

const categories = [
  { value: 'question', label: 'Question', icon: MessageCircleQuestion, description: 'Ask the community' },
  { value: 'academic_help', label: 'Academic Help', icon: HelpCircle, description: 'Get help with studies' },
  { value: 'project', label: 'Project', icon: FolderKanban, description: 'Share your project' },
  { value: 'resource', label: 'Resource', icon: BookOpen, description: 'Share learning materials' },
  { value: 'notice', label: 'Notice', icon: Bell, description: 'Important information' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const createPost = useCreatePost();
  const { data: korums } = useKorums();

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'question',
    tags: [] as string[],
    korum_id: '',
  });
  const [newTag, setNewTag] = useState('');

  // Pre-fill korum if coming from korum detail page
  useEffect(() => {
    const korumParam = searchParams.get('korum');
    if (korumParam) {
      setForm(prev => ({
        ...prev,
        korum_id: korumParam,
      }));
    }
  }, [searchParams]);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to create a post</p>
          <Button className="mt-4" onClick={() => navigate('/login')}>Log In</Button>
        </div>
        <MobileNav />
      </MainLayout>
    );
  }

  const selectedCategory = categories.find(c => c.value === form.category);
  const userKorums = ((korums as Korum[] | undefined) || []).filter(k => k.is_member);

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim()) && form.tags.length < 5) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;

    createPost.mutate({
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      tags: form.tags,
      korum_id: form.korum_id || undefined,
    }, {
      onSuccess: () => {
        if (form.korum_id) {
          navigate(`/korum/${form.korum_id}`);
        } else {
          navigate('/feed');
        }
      },
    });
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Create Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = form.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="font-medium text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Korum Selection */}
            {userKorums.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Post to Korum (optional)</label>
                <Select
                  value={form.korum_id}
                  onValueChange={value => setForm(prev => ({ ...prev, korum_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Korum or post to general feed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General Feed</SelectItem>
                    {userKorums.map(korum => (
                      <SelectItem key={korum.id} value={korum.id}>
                        {korum.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="What's your post about?"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{form.title.length}/200</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your post content here..."
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (up to 5)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {form.tags.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!form.title.trim() || !form.content.trim() || createPost.isPending}
              >
                {createPost.isPending ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </MainLayout>
  );
}
