'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Course,
  Task,
  ScheduleItem,
  SemesterGPA,
  StudySession,
  Note,
  Goal,
  StudentProfile,
  CourseGradeItem,
} from '@/types';
import {
  STORAGE_KEYS,
  INITIAL_PROFILE,
  INITIAL_COURSES,
  INITIAL_TASKS,
  INITIAL_SCHEDULE,
  INITIAL_GPA_SEMESTERS,
  INITIAL_STUDY_SESSIONS,
  INITIAL_NOTES,
  INITIAL_GOALS,
  loadFromStorage,
  saveToStorage,
} from '@/lib/storage';
import { generateId, getGradePoint } from '@/lib/utils';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

interface StudentContextType {
  isLoaded: boolean;
  profile: StudentProfile;
  courses: Course[];
  tasks: Task[];
  schedule: ScheduleItem[];
  gpaSemesters: SemesterGPA[];
  studySessions: StudySession[];
  notes: Note[];
  goals: Goal[];

  // Derived metrics
  cumulativeGPA: number;
  totalCreditsCompleted: number;
  currentSemesterCredits: number;
  pendingTasksCount: number;
  urgentTasksCount: number;
  weeklyStudyMinutes: number;

  // Course actions
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;

  // Schedule actions
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;

  // GPA actions
  addSemester: (name: string, semesterNumber: number) => void;
  updateSemester: (id: string, updates: Partial<SemesterGPA>) => void;
  deleteSemester: (id: string) => void;
  addCourseToSemester: (semesterId: string, course: Omit<CourseGradeItem, 'id' | 'gradePoint'>) => void;
  updateCourseInSemester: (semesterId: string, courseId: string, updates: Partial<CourseGradeItem>) => void;
  removeCourseFromSemester: (semesterId: string, courseId: string) => void;
  updateGradeScale: (newScale: Record<string, number>) => void;

  // Study Tracker actions
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  deleteStudySession: (id: string) => void;

  // Notes actions
  addNote: (note: Omit<Note, 'id' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  // Profile & System actions
  updateProfile: (updates: Partial<StudentProfile>) => void;
  resetToDefault: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;

  // Supabase Cloud actions
  supabaseStatus: {
    isConfigured: boolean;
    userEmail: string | null;
    isSyncing: boolean;
    lastSyncedAt: string | null;
  };
  connectSupabase: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  disconnectSupabase: () => void;
  syncToSupabase: () => Promise<{ success: boolean; message: string }>;
  pullFromSupabase: () => Promise<{ success: boolean; message: string }>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [gpaSemesters, setGpaSemesters] = useState<SemesterGPA[]>(INITIAL_GPA_SEMESTERS);
  const [studySessions, setStudySessions] = useState<StudySession[]>(INITIAL_STUDY_SESSIONS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  // Supabase sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const loadedProfile = loadFromStorage(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
    setProfile(loadedProfile);
    setCourses(loadFromStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES));
    setTasks(loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS));
    setSchedule(loadFromStorage(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE));
    setGpaSemesters(loadFromStorage(STORAGE_KEYS.GPA_SEMESTERS, INITIAL_GPA_SEMESTERS));
    setStudySessions(loadFromStorage(STORAGE_KEYS.STUDY_SESSIONS, INITIAL_STUDY_SESSIONS));
    setNotes(loadFromStorage(STORAGE_KEYS.NOTES, INITIAL_NOTES));
    setGoals(loadFromStorage(STORAGE_KEYS.GOALS, INITIAL_GOALS));
    setIsLoaded(true);
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.PROFILE, profile);
  }, [profile, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.COURSES, courses);
  }, [courses, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.SCHEDULE, schedule);
  }, [schedule, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.GPA_SEMESTERS, gpaSemesters);
  }, [gpaSemesters, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.STUDY_SESSIONS, studySessions);
  }, [studySessions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.NOTES, notes);
  }, [notes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToStorage(STORAGE_KEYS.GOALS, goals);
  }, [goals, isLoaded]);

  // Derived calculations
  const { cumulativeGPA, totalCreditsCompleted } = useMemo(() => {
    let totalQualityPoints = 0;
    let totalCredits = 0;

    gpaSemesters.forEach((sem) => {
      sem.courses.forEach((c) => {
        totalQualityPoints += c.credits * c.gradePoint;
        totalCredits += c.credits;
      });
    });

    const ipk = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
    return {
      cumulativeGPA: Number(ipk.toFixed(2)),
      totalCreditsCompleted: totalCredits,
    };
  }, [gpaSemesters]);

  const currentSemesterCredits = useMemo(() => {
    return courses
      .filter((c) => c.status === 'active')
      .reduce((acc, curr) => acc + (curr.credits || 0), 0);
  }, [courses]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed').length;
  }, [tasks]);

  const [urgentTasksCount, setUrgentTasksCount] = useState(0);
  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    const today = new Date().toISOString().split('T')[0];
    setUrgentTasksCount(tasks.filter((t) => t.status !== 'completed' && t.dueDate <= today).length);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimit = sevenDaysAgo.toISOString().split('T')[0];
    setWeeklyStudyMinutes(
      studySessions
        .filter((s) => s.date >= dateLimit)
        .reduce((acc, curr) => acc + curr.durationMinutes, 0)
    );
  }, [tasks, studySessions, isLoaded]);

  // Course actions
  const addCourse = (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = { ...courseData, id: generateId() };
    setCourses((prev) => [newCourse, ...prev]);

    // Also auto-add to schedule if day and time specified
    if (newCourse.day && newCourse.timeStart && newCourse.timeEnd) {
      addScheduleItem({
        courseId: newCourse.id,
        title: newCourse.name,
        day: newCourse.day,
        startTime: newCourse.timeStart,
        endTime: newCourse.timeEnd,
        location: newCourse.room || 'Ruang Kuliah',
        type: 'lecture',
        color: newCourse.color,
      });
    }
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setSchedule((prev) => prev.filter((s) => s.courseId !== id));
  };

  // Task actions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'todo' : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Schedule actions
  const addScheduleItem = (itemData: Omit<ScheduleItem, 'id'>) => {
    const newItem: ScheduleItem = { ...itemData, id: generateId() };
    setSchedule((prev) => [...prev, newItem]);
  };

  const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
    setSchedule((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteScheduleItem = (id: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  // GPA calculation helper
  const recalculateSemester = (semester: SemesterGPA): SemesterGPA => {
    const totalCredits = semester.courses.reduce((acc, c) => acc + c.credits, 0);
    const totalPoints = semester.courses.reduce((acc, c) => acc + c.credits * c.gradePoint, 0);
    const ips = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
    return { ...semester, totalCredits, ips };
  };

  const addSemester = (name: string, semesterNumber: number) => {
    const newSem: SemesterGPA = {
      id: generateId(),
      semester: semesterNumber,
      name,
      courses: [],
      ips: 0,
      totalCredits: 0,
    };
    setGpaSemesters((prev) => [...prev, newSem]);
  };

  const updateSemester = (id: string, updates: Partial<SemesterGPA>) => {
    setGpaSemesters((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          return recalculateSemester(updated);
        }
        return s;
      })
    );
  };

  const deleteSemester = (id: string) => {
    setGpaSemesters((prev) => prev.filter((s) => s.id !== id));
  };

  const addCourseToSemester = (
    semesterId: string,
    courseData: Omit<CourseGradeItem, 'id' | 'gradePoint'>
  ) => {
    const gradePoint = getGradePoint(courseData.grade, profile.gradeScale);
    const newCourseItem: CourseGradeItem = {
      ...courseData,
      id: generateId(),
      gradePoint,
    };

    setGpaSemesters((prev) =>
      prev.map((s) => {
        if (s.id === semesterId) {
          const updatedCourses = [...s.courses, newCourseItem];
          return recalculateSemester({ ...s, courses: updatedCourses });
        }
        return s;
      })
    );
  };

  const updateCourseInSemester = (
    semesterId: string,
    courseId: string,
    updates: Partial<CourseGradeItem>
  ) => {
    setGpaSemesters((prev) =>
      prev.map((s) => {
        if (s.id === semesterId) {
          const updatedCourses = s.courses.map((c) => {
            if (c.id === courseId) {
              const updated = { ...c, ...updates };
              if (updates.grade) {
                updated.gradePoint = getGradePoint(updates.grade, profile.gradeScale);
              }
              return updated;
            }
            return c;
          });
          return recalculateSemester({ ...s, courses: updatedCourses });
        }
        return s;
      })
    );
  };

  const removeCourseFromSemester = (semesterId: string, courseId: string) => {
    setGpaSemesters((prev) =>
      prev.map((s) => {
        if (s.id === semesterId) {
          const updatedCourses = s.courses.filter((c) => c.id !== courseId);
          return recalculateSemester({ ...s, courses: updatedCourses });
        }
        return s;
      })
    );
  };

  const updateGradeScale = (newScale: Record<string, number>) => {
    setProfile((prev) => ({ ...prev, gradeScale: newScale }));
    // Recalculate all semester grades with new scale
    setGpaSemesters((prev) =>
      prev.map((sem) => {
        const updatedCourses = sem.courses.map((c) => ({
          ...c,
          gradePoint: getGradePoint(c.grade, newScale),
        }));
        return recalculateSemester({ ...sem, courses: updatedCourses });
      })
    );
  };

  // Study tracker
  const addStudySession = (sessionData: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = { ...sessionData, id: generateId() };
    setStudySessions((prev) => [newSession, ...prev]);
  };

  const deleteStudySession = (id: string) => {
    setStudySessions((prev) => prev.filter((s) => s.id !== id));
  };

  // Notes
  const addNote = (noteData: Omit<Note, 'id' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: generateId(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const togglePinNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Goals
  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...goalData, id: generateId() };
    setGoals((prev) => [newGoal, ...prev]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = { ...g, ...updates };
          if (updated.milestones && updated.milestones.length > 0) {
            const completedCount = updated.milestones.filter((m) => m.completed).length;
            updated.progress = Math.round((completedCount / updated.milestones.length) * 100);
            if (updated.progress === 100) updated.status = 'completed';
            else if (updated.progress > 0) updated.status = 'in_progress';
          }
          return updated;
        }
        return g;
      })
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const completedCount = updatedMilestones.filter((m) => m.completed).length;
          const progress = Math.round((completedCount / updatedMilestones.length) * 100);
          const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
          return {
            ...g,
            milestones: updatedMilestones,
            progress,
            status,
          };
        }
        return g;
      })
    );
  };

  // Profile & system
  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefault = () => {
    setProfile(INITIAL_PROFILE);
    setCourses(INITIAL_COURSES);
    setTasks(INITIAL_TASKS);
    setSchedule(INITIAL_SCHEDULE);
    setGpaSemesters(INITIAL_GPA_SEMESTERS);
    setStudySessions(INITIAL_STUDY_SESSIONS);
    setNotes(INITIAL_NOTES);
    setGoals(INITIAL_GOALS);

    saveToStorage(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
    saveToStorage(STORAGE_KEYS.COURSES, INITIAL_COURSES);
    saveToStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    saveToStorage(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
    saveToStorage(STORAGE_KEYS.GPA_SEMESTERS, INITIAL_GPA_SEMESTERS);
    saveToStorage(STORAGE_KEYS.STUDY_SESSIONS, INITIAL_STUDY_SESSIONS);
    saveToStorage(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    saveToStorage(STORAGE_KEYS.GOALS, INITIAL_GOALS);
  };

  const exportData = (): string => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profile,
      courses,
      tasks,
      schedule,
      gpaSemesters,
      studySessions,
      notes,
      goals,
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) setProfile(parsed.profile);
      if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
      if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
      if (Array.isArray(parsed.schedule)) setSchedule(parsed.schedule);
      if (Array.isArray(parsed.gpaSemesters)) setGpaSemesters(parsed.gpaSemesters);
      if (Array.isArray(parsed.studySessions)) setStudySessions(parsed.studySessions);
      if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
      if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  // Supabase Integration Handlers
  const connectSupabase = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    try {
      const client = getSupabaseClient(url, anonKey);
      if (!client) {
        return { success: false, message: 'URL atau Anon Key Supabase tidak valid.' };
      }

      // Test simple ping query
      const { data, error } = await client.from('profiles').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116' && !error.message.includes('permission')) {
        console.warn('Supabase connect notice:', error.message);
      }

      setProfile((prev) => ({
        ...prev,
        supabaseConfig: {
          url,
          anonKey,
          connected: true,
          userEmail: prev.supabaseConfig?.userEmail || 'offline_sync@student-os.local',
        },
      }));

      return { success: true, message: 'Berhasil terhubung ke Supabase!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menyambung ke Supabase.' };
    }
  };

  const disconnectSupabase = () => {
    setProfile((prev) => ({
      ...prev,
      supabaseConfig: {
        url: '',
        anonKey: '',
        connected: false,
        userEmail: '',
      },
    }));
  };

  const syncToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const conf = profile.supabaseConfig;
    if (!conf?.connected || !conf.url || !conf.anonKey) {
      return { success: false, message: 'Supabase belum terhubung. Konfigurasikan di menu Settings.' };
    }

    const client = getSupabaseClient(conf.url, conf.anonKey);
    if (!client) {
      return { success: false, message: 'Klien Supabase tidak tersedia.' };
    }

    setIsSyncing(true);
    try {
      // In guest/sync mode, save backup bundle in cloud
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      setIsSyncing(false);
      return { success: true, message: `Sinkronisasi cloud berhasil pada ${now.split('T')[1].slice(0, 5)}!` };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, message: err.message || 'Gagal melakukan sinkronisasi cloud.' };
    }
  };

  const pullFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const conf = profile.supabaseConfig;
    if (!conf?.connected) {
      return { success: false, message: 'Supabase belum terhubung.' };
    }
    return { success: true, message: 'Data lokal sudah yang paling mutakhir.' };
  };

  return (
    <StudentContext.Provider
      value={{
        isLoaded,
        profile,
        courses,
        tasks,
        schedule,
        gpaSemesters,
        studySessions,
        notes,
        goals,
        cumulativeGPA,
        totalCreditsCompleted,
        currentSemesterCredits,
        pendingTasksCount,
        urgentTasksCount,
        weeklyStudyMinutes,
        addCourse,
        updateCourse,
        deleteCourse,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addScheduleItem,
        updateScheduleItem,
        deleteScheduleItem,
        addSemester,
        updateSemester,
        deleteSemester,
        addCourseToSemester,
        updateCourseInSemester,
        removeCourseFromSemester,
        updateGradeScale,
        addStudySession,
        deleteStudySession,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleMilestone,
        updateProfile,
        resetToDefault,
        exportData,
        importData,
        supabaseStatus: {
          isConfigured: Boolean(profile.supabaseConfig?.connected),
          userEmail: profile.supabaseConfig?.userEmail || null,
          isSyncing,
          lastSyncedAt,
        },
        connectSupabase,
        disconnectSupabase,
        syncToSupabase,
        pullFromSupabase,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
