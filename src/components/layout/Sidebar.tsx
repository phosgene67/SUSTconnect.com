import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  MessageSquare, 
  Bell, 
  User, 
  Settings,
  PlusCircle,
  Megaphone,
  Search,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const navigation = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Korums', href: '/korums', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

const secondaryNav = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-sidebar">
      {/* Logo */}
      <Link to="/feed" className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <img src={logo} alt={APP_NAME} className="h-10 w-auto" />
      </Link>

      {/* Search */}
      <div className="p-4">
        <Link
          to="/search"
          className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
        </Link>
      </div>

      {/* Create Post Button */}
      {user && (
        <div className="px-4 pb-2">
          <Link
            to="/create-post"
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Post</span>
          </Link>
        </div>
      )}

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           location.pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 h-px bg-sidebar-border" />

        {/* Secondary Navigation */}
        <ul className="space-y-1">
          {secondaryNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-sidebar-border p-4">
        {user && profile ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.department}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
