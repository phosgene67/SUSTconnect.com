

# SUST CONNECT - University Social Platform
## Implementation Plan

### Overview
A private, secure academic social platform exclusively for SUST university students, combining:
- **Reddit-style** discussion forums
- **LinkedIn-style** academic profiles
- **WhatsApp-style** messaging
- **Korum** community system
- **Official announcements** system

**Tech Stack**: React + TypeScript + Vite (Frontend) | Supabase (Backend, Auth, Database, Realtime, Storage)

---

## Phase 1: Foundation & Authentication
*Building the secure core of the platform*

### 1.1 Authentication System
- **University-only registration** with @student.sust.edu email validation
- Email OTP verification flow
- Secure login with password hashing (handled by Supabase Auth)
- JWT-based session management
- Password reset functionality

### 1.2 Role-Based Access Control
- Three user roles: **Student**, **Teacher**, **Admin**
- Secure roles table (separate from profiles to prevent privilege escalation)
- Role-checking utility functions
- Protected routes based on user role

### 1.3 Core Layout & Navigation
- Clean, minimal design system (professional academic aesthetic)
- Responsive sidebar navigation
- Top header with search, notifications, and profile
- Mobile-friendly bottom navigation

---

## Phase 2: Profile System (LinkedIn-style)
*Academic identity for every student*

### 2.1 Profile Components
- Profile photo upload (Supabase Storage)
- Basic info: Name, Department, Batch year
- Bio/About section
- Skills tags (searchable)
- Academic projects showcase
- Achievements & certifications
- Social links

### 2.2 Profile Features
- View own profile
- View other users' profiles
- Edit profile functionality
- Profile completeness indicator
- Activity feed (posts, comments, Korums joined)

---

## Phase 3: Reddit-style Feed System
*Knowledge sharing and discussions*

### 3.1 Post System
- Create posts with rich text editor
- Post categories: **Academic Help**, **Project**, **Notice**, **Question**, **Resource**
- Image/file attachments
- Tag system for better discovery

### 3.2 Engagement Features
- **Upvote/Downvote** system with score calculation
- **Nested comments** (threaded discussions)
- Post ranking algorithm (hot, new, top)
- Save/bookmark posts
- Share posts

### 3.3 Feed Views
- Main feed (all posts)
- Category-filtered feeds
- Following feed (posts from followed users/Korums)
- Trending posts section

---

## Phase 4: Korum System (Groups/Communities)
*Community building for academic collaboration*

### 4.1 Korum Types
- **Batch Korum** (e.g., CSE'22)
- **Department Korum** (e.g., Computer Science)
- **Project Korum** (collaborative projects)
- **Club Korum** (university clubs/organizations)
- **Course Korum** (specific courses)

### 4.2 Korum Features
- Create/join Korums
- Member roles: **Admin**, **Moderator**, **Member**
- Korum feed (posts within the community)
- Member directory
- Korum settings & rules
- File sharing repository

### 4.3 Korum Discovery
- Browse all Korums
- Search Korums
- Recommended Korums based on department/batch
- Pending join requests (for private Korums)

---

## Phase 5: Real-time Chat System
*WhatsApp-style messaging*

### 5.1 Direct Messages
- One-on-one private messaging
- Real-time message delivery (Supabase Realtime)
- Message status: Sent, Delivered, Read
- Image/file sharing
- Typing indicators

### 5.2 Group Chat (Korum Chat)
- Linked to each Korum
- Real-time group messaging
- Member mentions (@username)
- Message reactions
- Pin important messages

### 5.3 Chat Features
- Unread message counts
- Message search
- Media gallery per conversation
- Block/report users

---

## Phase 6: Announcements & Notifications
*Official communication channels*

### 6.1 Announcement System
- Admin/Teacher-only posting
- Target audiences: **University-wide**, **Department**, **Batch**, **Specific Korum**
- Priority levels (Normal, Important, Urgent)
- Announcement expiration dates
- Pinned announcements

### 6.2 Notification Center
- Real-time notifications
- Notification types:
  - New messages
  - Comments on your posts
  - Replies to your comments
  - Mentions (@you)
  - New announcements
  - Korum activity
- Push notification readiness (for future mobile app)
- Notification preferences/settings

---

## Phase 7: Search & Discovery
*Finding content and people*

### 7.1 Global Search
- Search posts by keywords
- Search users by name/department/skills
- Search Korums
- Filter search results

### 7.2 Discovery Features
- Trending topics
- Popular posts this week
- Active Korums
- Suggested connections (same batch/department)

---

## Phase 8: Moderation & Security
*Keeping the platform safe*

### 8.1 Content Moderation
- Report posts/comments/users
- Admin moderation dashboard
- Content flagging system
- User warnings and bans

### 8.2 Security Measures
- Row-level security (RLS) on all tables
- API rate limiting
- Input validation and sanitization
- Secure file upload restrictions
- Activity logging for security audits

---

## Database Architecture
*Secure, scalable PostgreSQL schema*

**Core Tables:**
- `users` (auth.users - Supabase managed)
- `profiles` (extended user info)
- `user_roles` (separate roles table for security)
- `posts` (all posts/content)
- `comments` (nested comment system)
- `votes` (upvote/downvote tracking)
- `korums` (groups/communities)
- `korum_members` (membership with roles)
- `messages` (DM messages)
- `group_messages` (Korum chat)
- `announcements` (official notices)
- `notifications` (user notifications)
- `reports` (moderation reports)

---

## UI/UX Design System

**Design Philosophy:** Clean, minimal, professional academic platform

**Key Pages:**
1. **Landing/Login** - University branding, secure login form
2. **Registration** - Multi-step with email verification
3. **Main Feed** - Card-based post layout with filters
4. **Profile Page** - LinkedIn-style academic portfolio
5. **Korum Page** - Community hub with feed and chat
6. **Chat Page** - WhatsApp-style conversation list and chat view
7. **Announcements** - Official notice board
8. **Notifications** - Activity feed
9. **Settings** - Profile, privacy, notification preferences
10. **Admin Dashboard** - Moderation and analytics (admin-only)

**Color Palette:** Professional blues and whites with accent colors for categories

---

## Implementation Order

| Week | Focus Area |
|------|------------|
| 1 | Auth system, role management, base layout |
| 2 | Profile system, profile page |
| 3 | Post creation, feed display, voting |
| 4 | Comments system, post interactions |
| 5 | Korum system, membership |
| 6 | Direct messaging with real-time |
| 7 | Group chat, Korum chat |
| 8 | Announcements, notifications |
| 9 | Search, discovery features |
| 10 | Moderation tools, security hardening |

---

## Future Mobile App Readiness
The entire backend (Supabase) will be API-ready for a future React Native mobile app, sharing:
- Same authentication system
- Same database
- Same real-time subscriptions
- Same storage buckets

