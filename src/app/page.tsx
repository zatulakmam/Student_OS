'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  CheckSquare,
  Timer,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge, Badge } from '@/components/ui/Badge';
import { getDaysRemaining, getCourseColor, formatDuration } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const {
    profile,
    courses,
    tasks,
    schedule,
    gpaSemesters,
    studySessions,
    cumulativeGPA,
    totalCreditsCompleted,
    currentSemesterCredits,
    pendingTasksCount,
    urgentTasksCount,
    weeklyStudyMinutes,
    toggleTaskComplete,
  } = useStudent();

  const [isMounted, setIsMounted] = useState(false);
  const [currentDayName, setCurrentDayName] = useState('Monday');
  const [weeklyStudyChartData, setWeeklyStudyChartData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setCurrentDayName(days[new Date().getDay()]);

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
    setWeeklyStudyChartData(result);
  }, [studySessions]);

  const todayClasses = useMemo(() => {
    return schedule
      .filter((s) => s.day === currentDayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedule, currentDayName]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  const gpaChartData = useMemo(() => {
    return gpaSemesters.map((s) => ({
      name: `Sem ${s.semester}`,
      ips: s.ips,
      target: profile.targetGPA,
    }));
  }, [gpaSemesters, profile.targetGPA]);

  const courseMap = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [courses]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Pusat Kendali Akademik</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat Belajar, <span className="text-blue-400">{profile.name}</span>!
            </h2>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Kamu saat ini terdaftar di <span className="text-slate-200 font-medium">{profile.major}</span>,{' '}
              {profile.faculty}. Tetap konsisten menggapai target IPK{' '}
              <span className="text-emerald-400 font-bold">{profile.targetGPA.toFixed(2)}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/tasks">
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Tambah Tugas
              </Button>
            </Link>
            <Link href="/study-tracker">
              <Button variant="outline" icon={<Timer className="w-4 h-4" />}>
                Mulai Pomodoro
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="IPK Kumulatif"
          value={cumulativeGPA.toFixed(2)}
          subtitle={`Target: ${profile.targetGPA.toFixed(2)}`}
          icon={<GraduationCap className="w-6 h-6" />}
          trend={{
            value: cumulativeGPA >= profile.targetGPA ? 'On Track 🌟' : 'Perlu Dorongan 🎯',
            isPositive: cumulativeGPA >= profile.targetGPA,
          }}
          color="blue"
        />

        <StatCard
          title="Mata Kuliah Aktif"
          value={courses.filter((c) => (c.status || 'active') === 'active').length}
          subtitle={`Total Beban: ${currentSemesterCredits} SKS`}
          icon={<BookOpen className="w-6 h-6" />}
          trend={{ value: `${totalCreditsCompleted} SKS Lulus`, isPositive: true }}
          color="indigo"
        />

        <StatCard
          title="Tugas Menunggu"
          value={pendingTasksCount}
          subtitle={urgentTasksCount > 0 ? `${urgentTasksCount} mendesak / hari ini` : 'Semua aman'}
          icon={<CheckSquare className="w-6 h-6" />}
          trend={{
            value: urgentTasksCount > 0 ? 'Perlu Dikerjakan' : 'Terjadwal',
            isPositive: urgentTasksCount === 0,
          }}
          color="purple"
        />

        <StatCard
          title="Jam Belajar (7 Hari)"
          value={formatDuration(weeklyStudyMinutes)}
          subtitle={`Target: ${profile.weeklyStudyTargetHours || 15} jam/minggu`}
          icon={<Timer className="w-6 h-6" />}
          trend={{
            value:
              weeklyStudyMinutes >= (profile.weeklyStudyTargetHours || 15) * 60
                ? 'Target Tercapai! 🎉'
                : `${Math.round(
                    (weeklyStudyMinutes / ((profile.weeklyStudyTargetHours || 15) * 60 || 1)) * 100
                  )}% Target`,
            isPositive:
              weeklyStudyMinutes >= (profile.weeklyStudyTargetHours || 15) * 60,
          }}
          color="emerald"
        />
      </div>

      {/* Main Grid: Schedule & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule & Urgent Tasks (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Schedule Card */}
          <Card>
            <CardHeader
              title={`Jadwal Hari Ini (${currentDayName})`}
              subtitle={
                todayClasses.length > 0
                  ? `${todayClasses.length} agenda perkuliahan & kegiatan hari ini`
                  : 'Tidak ada agenda kuliah terjadwal hari ini'
              }
              action={
                <Link
                  href="/schedule"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {todayClasses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
                <p>Hari ini bebas kuliah! Waktu yang tepat untuk self-study atau proyek.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((item) => {
                  const color = getCourseColor(item.color);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-1.5 h-10 rounded-full ${color.bg}`} style={{ backgroundColor: color.accent }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.startTime} - {item.endTime}
                            </span>
                            <span>•</span>
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="blue" size="sm">
                        {item.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Upcoming Deadlines Card */}
          <Card>
            <CardHeader
              title="Tenggat Waktu Terdekat"
              subtitle="Tugas yang perlu segera diselesaikan"
              action={
                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Task Board <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {upcomingTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p>Semua tugas sudah beres! Tidak ada tenggat mendekati saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const remaining = getDaysRemaining(task.dueDate);
                  const courseName = courseMap.get(task.courseId) || 'Mata Kuliah';
                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-all group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                          title="Tandai Selesai"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                            <span className="text-slate-400 truncate max-w-[200px]">{courseName}</span>
                            <span className="text-slate-600">•</span>
                            <span
                              className={`font-medium ${
                                remaining.isOverdue
                                  ? 'text-rose-400 font-semibold'
                                  : remaining.isToday
                                  ? 'text-amber-400 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {remaining.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Visual Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Study Hours Chart */}
          <Card>
            <CardHeader
              title="Aktivitas Belajar (7 Hari)"
              subtitle="Distribusi waktu fokus harian (dalam menit)"
              action={
                <Link
                  href="/study-tracker"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Detail <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            <div className="h-56 w-full pt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStudyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                      formatter={(val: any) => [`${val} menit`, 'Fokus']}
                    />
                    <Bar dataKey="menit" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* GPA Progression Trend Chart */}
          <Card>
            <CardHeader
              title="Tren Prestasi IPK / IPS"
              subtitle="Perkembangan nilai per semester vs Target"
              action={
                <Link
                  href="/gpa"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Kalkulator <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            <div className="h-56 w-full pt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gpaChartData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis domain={[2.0, 4.0]} stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [Number(val).toFixed(2), '']}
                    />
                    <Line
                      type="monotone"
                      dataKey="ips"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="IPS Riil"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#10B981"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      dot={false}
                      name="Target IPK"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Quick Links Card */}
          <Card className="bg-gradient-to-br from-slate-900 to-blue-950/40 border-blue-500/20">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Target & Pencapaian</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Kamu telah mengumpulkan target mingguan. Periksa milestone pada pelacak target atau tambahkan ringkasan catatan kuliah.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/goals" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  Lihat Goals
                </Button>
              </Link>
              <Link href="/notes" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Catatan Kuliah
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
