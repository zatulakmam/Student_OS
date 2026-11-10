'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Trash2,
  BookOpen,
  TrendingUp,
  Clock,
  Sparkles,
  PieChart as PieChartIcon,
  Calendar,
  Target,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { StudySession } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDuration, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type TimerMode = 'focus' | 'short_break' | 'long_break';

const PIE_COLORS = ['#3B82F6', '#6366F1', '#A855F7', '#10B981', '#F59E0B', '#F43F5E', '#06B6D4'];

export default function StudyTrackerPage() {
  const {
    studySessions,
    courses,
    profile,
    updateProfile,
    addStudySession,
    deleteStudySession,
    weeklyStudyMinutes,
  } = useStudent();

  const [isMounted, setIsMounted] = useState(false);
  const [todayDateStr, setTodayDateStr] = useState('');
  const [dailyBarData, setDailyBarData] = useState<any[]>([]);

  // Target Study Hours Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetInputHours, setTargetInputHours] = useState(profile.weeklyStudyTargetHours || 15);

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(profile.pomodoroConfig.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState<number>(0);

  // Manual Log Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<{
    courseId: string;
    courseName: string;
    date: string;
    durationMinutes: number;
    sessionType: 'pomodoro' | 'deep_work' | 'revision' | 'assignment';
    notes: string;
  }>({
    courseId: courses[0]?.id || '',
    courseName: courses[0]?.name || 'Belajar Mandiri',
    date: '',
    durationMinutes: 45,
    sessionType: 'deep_work',
    notes: '',
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Timer interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const todayStr = new Date().toISOString().split('T')[0];
    setTodayDateStr(todayStr);

    const result = [];
    const daysIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = daysIndo[d.getDay()];

      const totalMins = studySessions
        .filter((s) => s.date === dateStr)
        .reduce((sum, curr) => sum + curr.durationMinutes, 0);

      result.push({
        day: dayLabel,
        menit: totalMins,
        jam: Number((totalMins / 60).toFixed(1)),
      });
    }
    setDailyBarData(result);
  }, [studySessions]);

  // Set time when mode changes
  const setMode = (mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === 'focus') {
      setTimeLeft(profile.pomodoroConfig.focusMinutes * 60);
    } else if (mode === 'short_break') {
      setTimeLeft(profile.pomodoroConfig.shortBreakMinutes * 60);
    } else {
      setTimeLeft(profile.pomodoroConfig.longBreakMinutes * 60);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode]);

  // Handle session completion
  const handleTimerComplete = () => {
    if (timerMode === 'focus') {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const courseName = selectedCourse ? selectedCourse.name : 'Sesi Fokus Mandiri';

      addStudySession({
        courseId: selectedCourseId || undefined,
        courseName,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: profile.pomodoroConfig.focusMinutes,
        sessionType: 'pomodoro',
        notes: sessionNotes || 'Sesi Pomodoro fokus selesai.',
      });

      setSessionsCompletedToday((prev) => prev + 1);
      setSessionNotes('');

      // Auto switch to short break or long break
      const nextMode =
        (sessionsCompletedToday + 1) % profile.pomodoroConfig.longBreakInterval === 0
          ? 'long_break'
          : 'short_break';
      setMode(nextMode);
    } else {
      setMode('focus');
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode(timerMode);
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === manualForm.courseId);
    const courseName = course ? course.name : manualForm.courseName || 'Belajar Mandiri';

    addStudySession({
      courseId: manualForm.courseId || undefined,
      courseName,
      date: manualForm.date || new Date().toISOString().split('T')[0],
      durationMinutes: manualForm.durationMinutes,
      sessionType: manualForm.sessionType,
      notes: manualForm.notes,
    });

    setIsManualModalOpen(false);
  };

  // Calculations for stats
  const totalStudyMinutesAllTime = useMemo(() => {
    return studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [studySessions]);

  const studyMinutesToday = useMemo(() => {
    if (!todayDateStr) return 0;
    return studySessions
      .filter((s) => s.date === todayDateStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [studySessions, todayDateStr]);

  // Target study hours calculations
  const targetWeeklyHours = profile.weeklyStudyTargetHours || 15;
  const targetWeeklyMinutes = targetWeeklyHours * 60;
  const targetProgressPercent = Math.min(
    100,
    Math.round((weeklyStudyMinutes / (targetWeeklyMinutes || 1)) * 100)
  );
  const remainingTargetMinutes = Math.max(0, targetWeeklyMinutes - weeklyStudyMinutes);

  // Course Breakdown Pie Data
  const coursePieData = useMemo(() => {
    const map = new Map<string, number>();
    studySessions.forEach((s) => {
      map.set(s.courseName, (map.get(s.courseName) || 0) + s.durationMinutes);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [studySessions]);

  const handleSaveTargetHours = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ weeklyStudyTargetHours: targetInputHours });
    setIsTargetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Study Tracker & Focus Timer</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Target: {targetWeeklyHours} Jam/Minggu
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Timer belajar Pomodoro interaktif, durasi harian, statistik mingguan, dan pelacak target jam belajar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<Target className="w-4 h-4" />}
            onClick={() => {
              setTargetInputHours(profile.weeklyStudyTargetHours || 15);
              setIsTargetModalOpen(true);
            }}
          >
            Ubah Target Belajar
          </Button>

          <Button
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setManualForm((prev) => ({
                ...prev,
                date: new Date().toISOString().split('T')[0],
              }));
              setIsManualModalOpen(true);
            }}
          >
            Catat Sesi Manual
          </Button>
        </div>
      </div>

      {/* Target Progress Card */}
      <Card className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-blue-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Target Jam Belajar Mingguan</h3>
              <p className="text-xs text-slate-400">
                Tercapai <span className="text-blue-400 font-semibold">{formatDuration(weeklyStudyMinutes)}</span> dari target{' '}
                <span className="text-white font-semibold">{targetWeeklyHours} jam</span> ({targetProgressPercent}%)
              </p>
            </div>
          </div>

          <div className="text-right">
            {remainingTargetMinutes === 0 ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Target Terpenuhi! 🎉
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Sisa waktu target: <strong className="text-amber-400">{formatDuration(remainingTargetMinutes)}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              targetProgressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${targetProgressPercent}%` }}
          />
        </div>
      </Card>

      {/* Main Focus Timer Card */}
      <Card className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-blue-500/30 p-6 sm:p-8">
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => setMode('focus')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                timerMode === 'focus'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fokus ({profile.pomodoroConfig.focusMinutes}m)
            </button>
            <button
              onClick={() => setMode('short_break')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                timerMode === 'short_break'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Istirahat ({profile.pomodoroConfig.shortBreakMinutes}m)
            </button>
            <button
              onClick={() => setMode('long_break')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                timerMode === 'long_break'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Istirahat Panjang ({profile.pomodoroConfig.longBreakMinutes}m)
            </button>
          </div>

          {/* Large Digital Clock Display */}
          <div className="relative py-4">
            <div
              className={`text-6xl sm:text-8xl font-black tracking-tighter transition-colors select-none font-mono ${
                isRunning
                  ? timerMode === 'focus'
                    ? 'text-blue-400 drop-shadow-[0_0_35px_rgba(59,130,246,0.4)]'
                    : 'text-emerald-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]'
                  : 'text-white'
              }`}
            >
              {timeFormatted}
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-2">
              {isRunning
                ? timerMode === 'focus'
                  ? '🔥 Sesi Fokus Sedang Berjalan...'
                  : '☕ Istirahat, Rileks Sejenak...'
                : 'Timer Siap Dimulai'}
            </p>
          </div>

          {/* Controls: Play/Pause, Reset, Skip */}
          <div className="flex items-center gap-4">
            <Button
              variant={isRunning ? 'secondary' : 'primary'}
              size="lg"
              className="px-8 text-base font-bold shadow-xl"
              icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              onClick={toggleTimer}
            >
              {isRunning ? 'Jeda' : 'Mulai Fokus'}
            </Button>

            <button
              onClick={resetTimer}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setMode(timerMode === 'focus' ? 'short_break' : 'focus')}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Lewati Sesi Ini"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Course Association Selector & Quick Notes */}
          {timerMode === 'focus' && (
            <div className="w-full pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Mata Kuliah Terkait:
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Belajar Mandiri (Umum)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Catatan Sesi (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mengerjakan bab 3, latihan soal..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Row: Durasi Harian & Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Durasi Belajar Hari Ini</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{formatDuration(studyMinutesToday)}</h3>
              <p className="text-xs text-slate-400 mt-2">
                {sessionsCompletedToday} sesi pomodoro hari ini
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Total Belajar Minggu Ini</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {formatDuration(weeklyStudyMinutes)}
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Target: {targetWeeklyHours} jam ({targetProgressPercent}%)
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Fokus Terbanyak</p>
              <h3 className="text-lg font-bold text-white mt-1 truncate max-w-[200px]">
                {coursePieData[0]?.name || '-'}
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                {coursePieData[0] ? formatDuration(coursePieData[0].value) : 'Belum ada data'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <PieChartIcon className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Row: Statistik Mingguan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Study Distribution Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader
              title="Statistik Belajar Mingguan (7 Hari)"
              subtitle="Total menit belajar yang tercatat setiap harinya"
            />
            <div className="h-60 w-full pt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} menit`, 'Waktu Fokus']}
                    />
                    <Bar dataKey="menit" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Course Breakdown Donut Chart (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader
              title="Distribusi Per Mata Kuliah"
              subtitle="Porsi waktu belajar berdasarkan mata kuliah"
            />
            <div className="h-60 w-full pt-2">
              {isMounted && coursePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coursePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {coursePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} menit`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada log sesi belajar
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Study History Logs Table */}
      <Card>
        <CardHeader
          title="Histori Sesi Belajar"
          subtitle="Daftar riwayat sesi pomodoro dan pencatatan belajar mandiri"
        />

        {studySessions.length === 0 ? (
          <EmptyState
            icon={<Timer className="w-8 h-8" />}
            title="Belum Ada Sesi Belajar"
            description="Jalankan timer Pomodoro di atas atau catat sesi belajar manual untuk melihat histori."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Mata Kuliah</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Tipe Sesi</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studySessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {formatDate(session.date)}
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">{session.courseName}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {formatDuration(session.durationMinutes)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 uppercase text-[11px] font-semibold">
                      {session.sessionType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{session.notes || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeletingId(session.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Sesi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Target Hours Edit Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Ubah Target Jam Belajar Mingguan"
        description="Tetapkan komitmen jumlah jam belajar yang ingin Anda capai setiap pekannya."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveTargetHours} className="space-y-4">
          <Input
            label="Target Belajar (Jam / Minggu)"
            type="number"
            min={1}
            max={80}
            value={targetInputHours}
            onChange={(e) => setTargetInputHours(parseFloat(e.target.value) || 1)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsTargetModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Simpan Target
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Catat Sesi Belajar Manual"
        description="Masukkan riwayat belajar yang dilakukan di luar timer aplikasi."
        maxWidth="md"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Select
            label="Mata Kuliah Terkait"
            value={manualForm.courseId}
            onChange={(e) => setManualForm({ ...manualForm, courseId: e.target.value })}
            options={[
              { label: 'Belajar Mandiri / Umum', value: '' },
              ...courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c.id })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tanggal"
              type="date"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
              required
            />

            <Input
              label="Durasi (Menit)"
              type="number"
              min={5}
              max={600}
              value={manualForm.durationMinutes}
              onChange={(e) => setManualForm({ ...manualForm, durationMinutes: parseInt(e.target.value) || 15 })}
              required
            />
          </div>

          <Select
            label="Jenis Sesi"
            value={manualForm.sessionType}
            onChange={(e) => setManualForm({ ...manualForm, sessionType: e.target.value as any })}
            options={[
              { label: 'Deep Work Fokus', value: 'deep_work' },
              { label: 'Pomodoro', value: 'pomodoro' },
              { label: 'Review / Kisi-kisi', value: 'revision' },
              { label: 'Pengerjaan Tugas', value: 'assignment' },
            ]}
          />

          <Textarea
            label="Catatan Sesi"
            placeholder="Apa saja topik yang dipelajari atau diselesaikan..."
            value={manualForm.notes}
            onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsManualModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Simpan Sesi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteStudySession(deletingId);
        }}
        title="Hapus Sesi Belajar"
        message="Hapus catatan riwayat sesi belajar ini?"
      />
    </div>
  );
}
