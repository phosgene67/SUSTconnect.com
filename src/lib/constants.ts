// University email domain for validation
export const UNIVERSITY_EMAIL_DOMAIN = '@student.sust.edu';

// App metadata
export const APP_NAME = 'SUST Connect';
export const APP_DESCRIPTION = 'Private academic social platform for SUST students';

// Post categories with metadata
export const POST_CATEGORIES = {
  academic_help: {
    label: 'Academic Help',
    color: 'category-help',
    icon: 'HelpCircle',
  },
  project: {
    label: 'Project',
    color: 'category-project',
    icon: 'FolderKanban',
  },
  notice: {
    label: 'Notice',
    color: 'category-notice',
    icon: 'Bell',
  },
  question: {
    label: 'Question',
    color: 'category-question',
    icon: 'MessageCircleQuestion',
  },
  resource: {
    label: 'Resource',
    color: 'category-resource',
    icon: 'FileText',
  },
} as const;

// Korum types with metadata
export const KORUM_TYPES = {
  batch: {
    label: 'Batch',
    description: 'Connect with your batchmates',
    icon: 'Users',
  },
  department: {
    label: 'Department',
    description: 'Your department community',
    icon: 'Building2',
  },
  project: {
    label: 'Project',
    description: 'Collaborate on projects',
    icon: 'FolderKanban',
  },
  club: {
    label: 'Club',
    description: 'University clubs & organizations',
    icon: 'Heart',
  },
  course: {
    label: 'Course',
    description: 'Course-specific discussions',
    icon: 'BookOpen',
  },
} as const;

// Departments list
export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Industrial & Production Engineering',
  'Chemical Engineering',
  'Food Engineering & Tea Technology',
  'Architecture',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Statistics',
  'Economics',
  'Business Administration',
  'English',
  'Bangla',
  'Sociology',
  'Political Science',
  'Public Administration',
  'Anthropology',
  'Social Work',
  'Geography & Environment',
  'Genetic Engineering & Biotechnology',
  'Biochemistry & Molecular Biology',
  'Forestry & Environmental Science',
  'Petroleum & Mining Engineering',
  'Oceanography',
] as const;

// Batch years (dynamic, last 10 years)
export const generateBatchYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
};

// Announcement priorities
export const ANNOUNCEMENT_PRIORITIES = {
  normal: {
    label: 'Normal',
    color: 'secondary',
  },
  important: {
    label: 'Important',
    color: 'warning',
  },
  urgent: {
    label: 'Urgent',
    color: 'destructive',
  },
} as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
