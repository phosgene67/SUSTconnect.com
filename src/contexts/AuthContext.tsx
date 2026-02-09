import { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  department: string;
  batch: string;
  bio: string | null;
  skills: string[];
  achievements: string[];
  social_linkedin: string | null;
  social_github: string | null;
  social_portfolio: string | null;
  theme_preference?: 'light' | 'dark' | 'system' | null;
  user_type?: 'student' | 'teacher' | 'alumni' | 'developer' | null;
  status?: 'active' | 'banned' | 'restricted' | null;
  banned_at?: string | null;
  ban_reason?: string | null;
  restrictions?: string | number | boolean | null | Record<string, string | number | boolean | null>;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata: { full_name: string; department: string; batch: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
