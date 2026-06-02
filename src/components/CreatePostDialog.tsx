import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlignLeft,
  Bold,
  BookOpen,
  Code,
  FileCode2,
  FileText,
  FolderKanban,
  HelpCircle,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  MessageCircleQuestion,
  PenLine,
  Plus,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Korum, useKorums } from '@/hooks/useKorums';
import { Post, useCreatePost } from '@/hooks/usePosts';
import { cn } from '@/lib/utils';

const GENERAL_TARGET = 'general-feed';

const postTypes: Array<{
  value: Post['category'];
  label: string;
  icon: typeof HelpCircle;
}> = [
  { value: 'question', label: 'Question', icon: MessageCircleQuestion },
  { value: 'academic_help', label: 'Academic Help', icon: HelpCircle },
  { value: 'resource', label: 'Resource', icon: BookOpen },
  { value: 'project', label: 'Project', icon: FolderKanban },
  { value: 'notice', label: 'Notice', icon: FileText },
];

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKorumId?: string;
}

export const openCreatePostDialog = (korumId?: string) => {
  window.dispatchEvent(
    new CustomEvent('open-create-post', {
      detail: { korumId },
    })
  );
};

export function CreatePostDialog({ open, onOpenChange, initialKorumId }: CreatePostDialogProps) {
  const { user, profile } = useAuth();
  const { data: korums } = useKorums();
  const createPost = useCreatePost();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Post['category']>('question');
  const [target, setTarget] = useState(GENERAL_TARGET);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const userKorums = ((korums as Korum[] | undefined) || []).filter((korum) => korum.is_member);
  const selectedKorumId = target === GENERAL_TARGET ? undefined : target;

  useEffect(() => {
    if (open) {
      setTarget(initialKorumId || GENERAL_TARGET);
    }
  }, [initialKorumId, open]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('question');
    setTarget(GENERAL_TARGET);
    setTags([]);
    setNewTag('');
  };

  const addTag = () => {
    const tag = newTag.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    setTags((current) => [...current, tag]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !user) return;

    createPost.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        korum_id: selectedKorumId,
      },
      {
        onSuccess: () => {
          if (selectedKorumId) {
            queryClient.invalidateQueries({ queryKey: ['korum-posts', selectedKorumId] });
          }
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl dark:bg-white dark:text-gray-900 [&>button]:hidden">
        <div className="bg-red-800 px-5 py-4 text-white sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold tracking-wide text-white">
              <PenLine className="h-5 w-5" />
              Create New Post
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Compose and publish a post to the feed or one of your Korums.
          </DialogDescription>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-gray-200 bg-slate-100">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-100 text-gray-500">
                  {profile?.full_name?.charAt(0) || <UserRound className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{profile?.full_name || 'SUST Connect User'}</h3>
                <p className="text-xs font-medium text-gray-400">
                  {formatDistanceToNow(new Date(), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="w-full text-left sm:w-auto sm:text-right">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Post to:
              </label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="mt-1 h-9 w-full border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 focus:ring-red-800 sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENERAL_TARGET}>General Feed</SelectItem>
                  {userKorums.map((korum) => (
                    <SelectItem key={korum.id} value={korum.id}>
                      {korum.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="mt-0.5 block text-[10px] text-gray-400">
                Feed or specific project groups
              </span>
            </div>
          </div>

          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="Give your post a clear title"
            className="h-11 rounded-xl border-gray-200 bg-gray-50/60 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus-visible:ring-red-800"
          />

          <div className="overflow-hidden rounded-xl border border-gray-200 transition-all focus-within:border-red-800 focus-within:ring-1 focus-within:ring-red-800/20">
            <Textarea
              className="min-h-32 resize-none rounded-none border-0 bg-gray-50/30 p-4 text-sm leading-relaxed text-gray-700 placeholder:text-gray-400 focus-visible:ring-0"
              placeholder="Share an update, academic paper abstract, or project milestone..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2 text-gray-400">
              {[Bold, Italic, LinkIcon, List, ListOrdered, AlignLeft, Code].map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className="rounded p-1 text-sm transition-colors hover:text-red-800"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Attach Files</h4>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: 'Upload PDF', icon: Upload },
                { label: 'Add Image/Video', icon: Image },
                { label: 'Attach Code', icon: FileCode2 },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-all hover:border-red-200 hover:bg-red-50/30"
                >
                  <Icon className="mr-2 h-4 w-4 text-red-800" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Post Options</h4>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="w-20 shrink-0 text-xs font-semibold text-gray-500">Add Tags</span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="gap-1 rounded-md border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {tags.length < 5 && (
                  <div className="flex min-w-40 items-center gap-1">
                    <Input
                      value={newTag}
                      onChange={(event) => setNewTag(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="tag"
                      className="h-7 rounded-md border-gray-200 bg-white px-2 text-xs focus-visible:ring-red-800"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded-md border border-dashed border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-400 transition-colors hover:border-red-300 hover:text-red-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="w-20 shrink-0 text-xs font-semibold text-gray-500">Post Type</span>
              <div className="flex flex-wrap rounded-lg border border-gray-200 bg-white p-1 text-xs font-medium text-gray-600 shadow-inner">
                {postTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-3 py-1 transition-colors',
                      category === value
                        ? 'bg-red-800 font-semibold text-white shadow-sm'
                        : 'hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-100"
            onClick={resetForm}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-red-800 px-5 text-sm font-bold text-white shadow-md shadow-red-900/10 hover:bg-red-900"
            disabled={!title.trim() || !content.trim() || createPost.isPending || !user}
            onClick={handleSubmit}
          >
            {createPost.isPending ? 'Posting...' : 'Post Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePostDialogHost() {
  const [open, setOpen] = useState(false);
  const [initialKorumId, setInitialKorumId] = useState<string | undefined>();

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ korumId?: string }>;
      setInitialKorumId(customEvent.detail?.korumId);
      setOpen(true);
    };

    window.addEventListener('open-create-post', handleOpen);
    return () => window.removeEventListener('open-create-post', handleOpen);
  }, []);

  return (
    <CreatePostDialog
      open={open}
      onOpenChange={setOpen}
      initialKorumId={initialKorumId}
    />
  );
}
