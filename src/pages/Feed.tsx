import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout, MobileNav } from '@/components/layout';
import { usePosts, useVote, Post } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
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
  Bell,
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

const trendingTopics = [
  { name: 'Final Exams', posts: 124 },
  { name: 'Thesis Defense', posts: 89 },
  { name: 'Career Fair 2026', posts: 67 },
  { name: 'CSE Project Ideas', posts: 45 },
];

const categories = [
  { name: 'Academic Help', icon: HelpCircle, color: 'bg-primary/10 text-primary', count: 234, value: 'academic_help' },
  { name: 'Projects', icon: FolderKanban, color: 'bg-green-500/10 text-green-500', count: 156, value: 'project' },
  { name: 'Resources', icon: BookOpen, color: 'bg-pink-500/10 text-pink-500', count: 89, value: 'resource' },
];

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const vote = useVote();
  const score = (post.upvotes || 0) - (post.downvotes || 0);

  const handleVote = (value: 1 | -1) => {
    if (!user) return;
    const newValue = post.user_vote === value ? 0 : value;
    vote.mutate({ targetId: post.id, targetType: 'post', value: newValue as 1 | -1 | 0 });
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
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
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
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(selectedCategory === cat.value ? undefined : cat.value)}
                  className={`flex items-center justify-between p-2 rounded-md w-full transition-colors ${
                    selectedCategory === cat.value ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${cat.color}`}>
                      <cat.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{cat.count}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic, i) => (
                <Link
                  key={topic.name}
                  to={`/search?q=${encodeURIComponent(topic.name)}`}
                  className="flex items-center gap-3 group"
                >
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {topic.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Announcements Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-orange-500" />
                Latest Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No announcements at the moment.
              </p>
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
