'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Sparkles,
  CheckSquare,
  Filter,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { Course, DayOfWeek, GradeLetter, CourseStatus } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { getCourseColor, COURSE_STATUS_CONFIG } from '@/lib/utils';
import Link from 'next/link';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const GRADES: GradeLetter[] = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'];
const COLORS = ['blue', 'indigo', 'purple', 'emerald', 'amber', 'rose', 'cyan'];

const STATUS_OPTIONS: { label: string; value: CourseStatus }[] = [
  { label: 'Sedang Diambil (Aktif)', value: 'active' },
  { label: 'Lulus', value: 'passed' },
  { label: 'Mengulang', value: 'retake' },
  { label: 'Rencana Ambil', value: 'planned' },
];

export default function CoursesPage() {
  const { courses, tasks, addCourse, updateCourse, deleteCourse } = useStudent();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Delete State
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    credits: number;
    lecturer: string;
    room: string;
    day: DayOfWeek;
    timeStart: string;
    timeEnd: string;
    semester: number;
    status: CourseStatus;
    color: string;
    targetGrade: GradeLetter;
    currentScore: number;
    syllabusProgress: number;
    notes: string;
  }>({
    code: '',
    name: '',
    credits: 3,
    lecturer: '',
    room: '',
    day: 'Monday',
    timeStart: '08:00',
    timeEnd: '10:30',
    semester: 5,
    status: 'active',
    color: 'blue',
    targetGrade: 'A',
    currentScore: 85,
    syllabusProgress: 50,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      credits: 3,
      lecturer: '',
      room: '',
      day: 'Monday',
      timeStart: '08:00',
      timeEnd: '10:30',
      semester: 5,
      status: 'active',
      color: 'blue',
      targetGrade: 'A',
      currentScore: 85,
      syllabusProgress: 50,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      credits: course.credits,
      lecturer: course.lecturer,
      room: course.room,
      day: course.day,
      timeStart: course.timeStart,
      timeEnd: course.timeEnd,
      semester: course.semester,
      status: course.status || 'active',
      color: course.color,
      targetGrade: course.targetGrade,
      currentScore: course.currentScore || 80,
      syllabusProgress: course.syllabusProgress,
      notes: course.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) return;

    if (editingCourse) {
      updateCourse(editingCourse.id, formData);
    } else {
      addCourse(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingCourseId) {
      deleteCourse(deletingCourseId);
      setDeletingCourseId(null);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lecturer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSemester =
        filterSemester === 'all' || c.semester.toString() === filterSemester;

      const matchesStatus =
        filterStatus === 'all' || (c.status || 'active') === filterStatus;

      return matchesSearch && matchesSemester && matchesStatus;
    });
  }, [courses, searchQuery, filterSemester, filterStatus]);

  // Unique semesters for filter dropdown
  const semesters = useMemo(() => {
    const set = new Set(courses.map((c) => c.semester));
    return Array.from(set).sort((a, b) => a - b);
  }, [courses]);

  // Count tasks per course
  const taskCounts = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.status !== 'completed') {
        map.set(t.courseId, (map.get(t.courseId) || 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  const totalCredits = useMemo(() => {
    return filteredCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  }, [filteredCourses]);

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Course Manager</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {filteredCourses.length} Mata Kuliah ({totalCredits} SKS)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola mata kuliah, dosen pengampu, bobot SKS, semester, dan status perkuliahan.
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Tambah Mata Kuliah
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kode matkul, nama, atau nama dosen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Status</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Semester Filter */}
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Semester</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem.toString()}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses List / Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Tidak Ada Mata Kuliah Ditemukan"
          description="Coba ubah kata kunci pencarian atau tambahkan mata kuliah baru untuk semester ini."
          actionLabel="Tambah Mata Kuliah Sekarang"
          onAction={handleOpenAdd}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const color = getCourseColor(course.color);
            const pendingTasks = taskCounts.get(course.id) || 0;
            const statusConfig = COURSE_STATUS_CONFIG[course.status || 'active'];

            return (
              <Card key={course.id} hoverable className="flex flex-col justify-between group">
                <div>
                  {/* Top Tags: Code, Status, SKS */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${color.badge}`}>
                      {course.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {course.credits} SKS
                      </span>
                    </div>
                  </div>

                  {/* Course Name */}
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mb-2">
                    {course.name}
                  </h3>

                  {/* Lecturer, Semester, Schedule Details */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{course.lecturer || 'Dosen Pengampu Belum Diatur'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Semester {course.semester}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Target {course.targetGrade}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {course.day}, {course.timeStart} - {course.timeEnd}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{course.room || 'Ruang Kuliah'}</span>
                    </div>
                  </div>

                  {/* Syllabus Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Progres Silabus</span>
                      <span className="font-semibold text-slate-200">{course.syllabusProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${course.syllabusProgress}%`,
                          backgroundColor: color.accent,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Pending Tasks & Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={`/tasks?course=${course.id}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{pendingTasks} tugas aktif</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Mata Kuliah"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCourseId(course.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Mata Kuliah"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Kode & Mata Kuliah</th>
                  <th className="px-5 py-3.5">SKS</th>
                  <th className="px-5 py-3.5">Semester</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Dosen Pengampu</th>
                  <th className="px-5 py-3.5">Jadwal & Ruang</th>
                  <th className="px-5 py-3.5">Silabus</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCourses.map((course) => {
                  const color = getCourseColor(course.color);
                  const statusConfig = COURSE_STATUS_CONFIG[course.status || 'active'];

                  return (
                    <tr key={course.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${color.badge}`}>
                            {course.code}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{course.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-300">{course.credits} SKS</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-300">Semester {course.semester}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300 max-w-[180px] truncate">
                        {course.lecturer || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300">
                        <div>
                          {course.day}, {course.timeStart}-{course.timeEnd}
                        </div>
                        <div className="text-slate-500">{course.room}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-24 space-y-1">
                          <span className="text-xs font-medium text-slate-300">{course.syllabusProgress}%</span>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${course.syllabusProgress}%`, backgroundColor: color.accent }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(course)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCourseId(course.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
        description="Lengkapi nama mata kuliah, dosen, SKS, semester, dan status perkuliahan."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Kode Matkul"
              placeholder="e.g. IF3110"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Nama Mata Kuliah"
                placeholder="e.g. Pengembangan Aplikasi Web"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nama Dosen Pengampu"
              placeholder="e.g. Dr. Eng. Ir. Budi Santoso, M.T."
              value={formData.lecturer}
              onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
              required
            />
            <Input
              label="Ruangan / Link Kelas"
              placeholder="e.g. Lab Komputer 4 / Zoom"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Jumlah SKS"
              type="number"
              min={1}
              max={6}
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 1 })}
              required
            />
            <Input
              label="Semester"
              type="number"
              min={1}
              max={14}
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
              required
            />
            <Select
              label="Status Mata Kuliah"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CourseStatus })}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Hari Kuliah"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
              options={DAYS.map((d) => ({ label: d, value: d }))}
            />
            <Input
              label="Jam Mulai"
              type="time"
              value={formData.timeStart}
              onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={formData.timeEnd}
              onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Warna Kartu
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      formData.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: getCourseColor(c).accent }}
                  />
                ))}
              </div>
            </div>

            <Select
              label="Target Nilai Huruf"
              value={formData.targetGrade}
              onChange={(e) => setFormData({ ...formData, targetGrade: e.target.value as GradeLetter })}
              options={GRADES.map((g) => ({ label: `Grade ${g}`, value: g }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Progres Silabus / Materi: {formData.syllabusProgress}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={formData.syllabusProgress}
              onChange={(e) => setFormData({ ...formData, syllabusProgress: parseInt(e.target.value) || 0 })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <Textarea
            label="Catatan Perkuliahan / Silabus (Opsional)"
            placeholder="Silabus materi, kontrak perkuliahan, atau catatan khusus..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCourse ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCourseId}
        onClose={() => setDeletingCourseId(null)}
        onConfirm={confirmDelete}
        title="Hapus Mata Kuliah"
        message="Apakah Anda yakin ingin menghapus mata kuliah ini? Jadwal yang terhubung dengannya juga akan dihapus."
      />
    </div>
  );
}
