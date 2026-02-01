import { MainLayout, MobileNav } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Megaphone, 
  TrendingUp,
  PlusCircle,
  BookOpen,
  HelpCircle,
  FolderKanban,
} from 'lucide-react';

// Placeholder data for feed
const trendingTopics = [
  { name: 'Final Exams', posts: 124 },
  { name: 'Thesis Defense', posts: 89 },
  { name: 'Career Fair 2026', posts: 67 },
  { name: 'CSE Project Ideas', posts: 45 },
];

const categories = [
  { name: 'Academic Help', icon: HelpCircle, color: 'bg-primary/10 text-primary', count: 234 },
  { name: 'Projects', icon: FolderKanban, color: 'bg-success/10 text-success', count: 156 },
  { name: 'Resources', icon: BookOpen, color: 'bg-accent/10 text-accent', count: 89 },
];

export default function Feed() {
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

          {/* Empty state for posts */}
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
                <Link
                  key={cat.name}
                  to={`/feed?category=${cat.name.toLowerCase().replace(' ', '_')}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${cat.color}`}>
                      <cat.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{cat.count}</span>
                </Link>
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
                <Megaphone className="h-4 w-4 text-warning" />
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
