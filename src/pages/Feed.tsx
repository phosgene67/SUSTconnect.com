import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout, MobileNav } from '@/components/layout';
import { usePosts, useVote, Post } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { 
  Users, 
  MessageSquare, 
  Megaphone, 
  TrendingUp,
  PlusCircle,
  BookOpen,
  HelpCircle,
  FolderKanban,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Bookmark,
  AlertCircle,
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  academic_help: 'bg-blue-500/10 text-blue-600',
  project: 'bg-green-500/10 text-green-600',
  notice: 'bg-orange-500/10 text-orange-600',
  question: 'bg-purple-500/10 text-purple-600',
  resource: 'bg-pink-500/10 text-pink-600',
};

const categoryLabels: Record<string, string> = {
  academic_help: 'Academic Help',
  project: 'Project',
  notice: 'Notice',
  question: 'Question',
  resource: 'Resource',
};

const categoryIcons: Record<string, typeof HelpCircle> = {
  academic_help: HelpCircle,
  project: FolderKanban,
  notice: AlertCircle,
  question: MessageSquare,
  resource: BookOpen,
};

const categoryIconColors: Record<string, string> = {
  academic_help: 'bg-primary/10 text-primary',
  project: 'bg-green-500/10 text-green-500',
  notice: 'bg-orange-500/10 text-orange-500',
  question: 'bg-purple-500/10 text-purple-500',
  resource: 'bg-pink-500/10 text-pink-500',
};

// Hook to fetch category counts
function useCategoryCounts() {
  return useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('category');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(post => {
        counts[post.category] = (counts[post.category] || 0) + 1;
      });
      return counts;
    },
  });
}

// Hook to fetch trending tags
function useTrendingTags() {
  return useQuery({
    queryKey: ['trending-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null);
      
      if (error) throw error;
      
      const tagCounts: Record<string, number> = {};
      data?.forEach(post => {
        post.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, posts]) => ({ name, posts }));
    },
  });
}

// Hook to fetch latest announcements
function useLatestAnnouncements() {
  return useQuery({
    queryKey: ['latest-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, priority, created_at')
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const vote = useVote();
  const queryClient = useQueryClient();
  const score = (post.upvotes || 0) - (post.downvotes || 0);

  // Check if post is saved
  const { data: isSaved } = useQuery({
    queryKey: ['saved-post', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const handleVote = (value: 1 | -1) => {
    if (!user) return;
    const newValue = post.user_vote === value ? 0 : value;
    vote.mutate({ targetId: post.id, targetType: 'post', value: newValue as 1 | -1 | 0 });
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (isSaved) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['saved-post', post.id, user.id] });
      }
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ post_id: post.id, user_id: user.id });
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['saved-post', post.id, user.id] });
      }
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${post.user_vote === 1 ? 'text-primary bg-primary/10' : ''}`}
              onClick={() => handleVote(1)}
            >
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className={`text-sm font-medium ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : ''}`}>
              {score}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${post.user_vote === -1 ? 'text-destructive bg-destructive/10' : ''}`}
              onClick={() => handleVote(-1)}
            >
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Category & Author */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={categoryColors[post.category] || ''}>
                {categoryLabels[post.category] || post.category}
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <Link to={`/profile/${post.author_id}`} className="flex items-center gap-1 hover:underline">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {post.author?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{post.author?.full_name || 'Unknown'}</span>
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Title */}
            <Link to={`/post/${post.id}`}>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary cursor-pointer">
                {post.title}
              </h3>
            </Link>

            {/* Content preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {post.content}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" asChild>
                <Link to={`/post/${post.id}`}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.comment_count || 0} Comments
                </Link>
              </Button>
              {user && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={handleSave}
                >
                  <Bookmark className={`h-4 w-4 mr-1 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: posts, isLoading } = usePosts(selectedCategory);
  const { data: categoryCounts } = useCategoryCounts();
  const { data: trendingTags } = useTrendingTags();
  const { data: latestAnnouncements } = useLatestAnnouncements();

  const allCategories = ['academic_help', 'project', 'notice', 'question', 'resource'];

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Welcome to SUST Connect! 🎓</CardTitle>
              <CardDescription>
                Connect with your peers, share knowledge, and grow together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/create-post">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Post
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/korums">
                    <Users className="mr-2 h-4 w-4" />
                    Explore Korums
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter Bar */}
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              <Badge variant="secondary">{categoryLabels[selectedCategory]}</Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(undefined)}>
                Clear
              </Button>
            </div>
          )}

          {/* Posts */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post as Post} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Be the first to start a conversation in your community!
                </p>
                <Button asChild>
                  <Link to="/create-post">Create First Post</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Browse by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allCategories.map((catValue) => {
                const Icon = categoryIcons[catValue];
                const count = categoryCounts?.[catValue] || 0;
                return (
                  <button
                    key={catValue}
                    onClick={() => setSelectedCategory(selectedCategory === catValue ? undefined : catValue)}
                    className={`flex items-center justify-between p-2 rounded-md w-full transition-colors ${
                      selectedCategory === catValue ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${categoryIconColors[catValue]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{categoryLabels[catValue]}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Trending Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trending Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTags && trendingTags.length > 0 ? (
                trendingTags.map((tag, i) => (
                  <Link
                    key={tag.name}
                    to={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        #{tag.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{tag.posts} post{tag.posts !== 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No trending tags yet</p>
              )}
            </CardContent>
          </Card>

          {/* Announcements Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-destructive" />
                Latest Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestAnnouncements && latestAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {latestAnnouncements.map((announcement) => (
                    <Link
                      key={announcement.id}
                      to="/announcements"
                      className="block group"
                    >
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No announcements at the moment.
                </p>
              )}
              <Button variant="link" className="px-0 mt-2" asChild>
                <Link to="/announcements">View all announcements →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </MainLayout>
  );
}
