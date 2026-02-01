import { z } from 'zod';
import { UNIVERSITY_EMAIL_DOMAIN } from './constants';

// Email validation with university domain check
export const universityEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .refine(
    (email) => email.toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN),
    `Email must end with ${UNIVERSITY_EMAIL_DOMAIN}`
  );

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Login form schema
export const loginSchema = z.object({
  email: universityEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration form schema
export const registerSchema = z.object({
  email: universityEmailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(1, 'Please select your department'),
  batch: z.string().min(1, 'Please select your batch year'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Profile update schema
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(1, 'Department is required'),
  batch: z.string().min(1, 'Batch is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.array(z.string()).max(20, 'Maximum 20 skills allowed'),
  achievements: z.array(z.string()).max(10, 'Maximum 10 achievements allowed'),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
  }),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Post creation schema
export const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(10000, 'Content too long'),
  category: z.enum(['academic_help', 'project', 'notice', 'question', 'resource']),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
  korumId: z.string().uuid().optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

// Comment creation schema
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  parentId: z.string().uuid().optional(),
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;

// Korum creation schema
export const createKorumSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  type: z.enum(['batch', 'department', 'project', 'club', 'course']),
  isPrivate: z.boolean().default(false),
});

export type CreateKorumFormData = z.infer<typeof createKorumSchema>;

// Message schema
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  receiverId: z.string().uuid().optional(),
  korumId: z.string().uuid().optional(),
}).refine((data) => data.receiverId || data.korumId, {
  message: 'Either receiverId or korumId must be provided',
});

export type SendMessageFormData = z.infer<typeof sendMessageSchema>;

// Announcement schema
export const createAnnouncementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content too long'),
  priority: z.enum(['normal', 'important', 'urgent']),
  targetType: z.enum(['university', 'department', 'batch', 'korum']),
  targetValue: z.string().optional(),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export type CreateAnnouncementFormData = z.infer<typeof createAnnouncementSchema>;
