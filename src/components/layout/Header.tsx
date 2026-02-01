import { Link } from 'react-router-dom';
import { Bell, Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile Logo */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          SC
        </div>
        <span className="font-semibold">{APP_NAME}</span>
      </div>

      {/* Search Bar - Desktop */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts, people, korums..."
            className="pl-9 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link to="/notifications">
            <Bell className="h-5 w-5" />
            {/* Notification badge - placeholder */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        {/* Profile / Login */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Link>
        </Button>

        {/* Login Button - shown when not authenticated */}
        <Button asChild className="hidden sm:inline-flex">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    </header>
  );
}
