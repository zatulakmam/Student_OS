import { GradeLetter, CourseStatus } from '@/types';

export const DEFAULT_GRADE_SCALE: Record<string, number> = {
  'A': 4.0,
  'AB': 3.5,
  'B': 3.0,
  'BC': 2.5,
  'C': 2.0,
  'D': 1.0,
  'E': 0.0,
  'A-': 3.7,
  'B+': 3.3,
  'B-': 2.7,
  'C+': 2.3,
};

export const COURSE_STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; badge: string; color: string }
> = {
  active: {
    label: 'Sedang Diambil',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    color: '#3B82F6',
  },
  passed: {
    label: 'Lulus',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    color: '#10B981',
  },
  retake: {
    label: 'Mengulang',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    color: '#F43F5E',
  },
  planned: {
    label: 'Rencana Ambil',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    color: '#A855F7',
  },
};

export function getGradePoint(
  grade: GradeLetter | string,
  customScale?: Record<string, number>
): number {
  if (customScale && customScale[grade] !== undefined) {
    return customScale[grade];
  }
  return DEFAULT_GRADE_SCALE[grade] ?? 0.0;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  return timeString || '-';
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}j`;
  return `${hrs}j ${mins}m`;
}

export function getDaysRemaining(dueDateStr: string): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dueDateStr) return { text: '-', isOverdue: false, isToday: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Terlambat ${Math.abs(diffDays)} hari`, isOverdue: true, isToday: false };
  } else if (diffDays === 0) {
    return { text: 'Hari ini', isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { text: 'Besok', isOverdue: false, isToday: false };
  } else {
    return { text: `${diffDays} hari lagi`, isOverdue: false, isToday: false };
  }
}

export const COURSE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; accent: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    accent: '#3B82F6',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    accent: '#6366F1',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
    accent: '#10B981',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    accent: '#F59E0B',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    accent: '#A855F7',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
    accent: '#F43F5E',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
    accent: '#06B6D4',
  },
};

export function getCourseColor(colorName?: string) {
  return COURSE_COLORS[colorName || 'blue'] || COURSE_COLORS.blue;
}
