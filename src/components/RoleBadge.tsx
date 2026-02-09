import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, Award, Sparkles } from 'lucide-react';

interface RoleBadgeProps {
  userType: 'student' | 'teacher' | 'alumni' | 'developer';
  className?: string;
}

export function RoleBadge({ userType, className }: RoleBadgeProps) {
  const badges = {
    student: {
      label: 'Student',
      icon: GraduationCap,
      variant: 'default' as const,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    teacher: {
      label: 'Teacher',
      icon: BookOpen,
      variant: 'secondary' as const,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    alumni: {
      label: 'Alumni',
      icon: Award,
      variant: 'outline' as const,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    },
    developer: {
      label: 'Developer',
      icon: Sparkles,
      variant: 'default' as const,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
  };

  const badge = badges[userType];
  const Icon = badge.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color} ${className}`}>
      <Icon size={14} />
      {badge.label}
    </div>
  );
}
