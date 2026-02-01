// User & Auth Types
export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  department: string;
  batch: string;
  bio?: string;
  skills: string[];
  achievements: string[];
  socialLinks: SocialLinks;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface UserWithProfile extends User {
  profile: Profile;
  role: UserRole;
}

// Post Types
export type PostCategory = 'academic_help' | 'project' | 'notice' | 'question' | 'resource';

export interface Post {
  id: string;
  authorId: string;
  author?: Profile;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  korumId?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: Profile;
  parentId?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  value: 1 | -1;
}

// Korum Types
export type KorumType = 'batch' | 'department' | 'project' | 'club' | 'course';
export type KorumMemberRole = 'admin' | 'moderator' | 'member';

export interface Korum {
  id: string;
  name: string;
  description: string;
  type: KorumType;
  avatarUrl?: string;
  coverUrl?: string;
  isPrivate: boolean;
  memberCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KorumMember {
  id: string;
  korumId: string;
  userId: string;
  role: KorumMemberRole;
  joinedAt: string;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  sender?: Profile;
  receiverId?: string;
  korumId?: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants?: Profile[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// Announcement Types
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';
export type AnnouncementTarget = 'university' | 'department' | 'batch' | 'korum';

export interface Announcement {
  id: string;
  authorId: string;
  author?: Profile;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetType: AnnouncementTarget;
  targetValue?: string;
  isPinned: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 
  | 'message'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'announcement'
  | 'korum_invite'
  | 'upvote';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
