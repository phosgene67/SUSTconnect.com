import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Korums', href: '/korums', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Alerts', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden">
      <ul className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                         location.pathname.startsWith(item.href + '/');
          return (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
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
  );
}
