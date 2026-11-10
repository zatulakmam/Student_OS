export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskCategory = 'assignment' | 'project' | 'exam' | 'quiz' | 'reading' | 'other';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type CourseStatus = 'active' | 'passed' | 'retake' | 'planned';

export type GradeLetter = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E' | 'A-' | 'B+' | 'B-' | 'C+';

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number; // SKS
  lecturer: string;
  room: string;
  day: DayOfWeek;
  timeStart: string;
  timeEnd: string;
  semester: number;
  status: CourseStatus;
  color: string;
  targetGrade: GradeLetter;
  currentScore?: number;
  syllabusProgress: number; // 0-100
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  courseId?: string;
  title: string;
  day: DayOfWeek;
  startTime: string; // "08:00"
  endTime: string;   // "10:30"
  location: string;
  type: 'lecture' | 'lab' | 'seminar' | 'study_group' | 'office_hours';
  color?: string;
}

export interface CourseGradeItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: GradeLetter;
  gradePoint: number;
}

export interface SemesterGPA {
  id: string;
  semester: number;
  name: string;
  courses: CourseGradeItem[];
  ips: number;
  totalCredits: number;
}

export interface StudySession {
  id: string;
  courseId?: string;
  courseName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  sessionType: 'pomodoro' | 'deep_work' | 'revision' | 'assignment';
  notes?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  courseId?: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  updatedAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'academic' | 'project' | 'skill' | 'career';
  targetDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  milestones: GoalMilestone[];
}

export interface StudentProfile {
  name: string;
  studentId: string;
  university: string;
  major: string;
  faculty: string;
  currentSemester: number;
  academicYear: string;
  targetGPA: number;
  weeklyStudyTargetHours: number; // e.g. 15 hours / week
  gradeScale: Record<string, number>; // e.g. { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 }
  avatarUrl?: string;
  pomodoroConfig: {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
  };
  supabaseConfig?: {
    url: string;
    anonKey: string;
    connected: boolean;
    userEmail?: string;
  };
}
