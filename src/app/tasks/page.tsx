'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { Task, Priority, TaskStatus, TaskCategory } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge, Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { getDaysRemaining, getCourseColor } from '@/lib/utils';

const CATEGORIES: { label: string; value: TaskCategory }[] = [
  { label: 'Tugas Kuliah (Assignment)', value: 'assignment' },
  { label: 'Tugas Besar (Project)', value: 'project' },
  { label: 'Ujian (Exam)', value: 'exam' },
  { label: 'Kuis (Quiz)', value: 'quiz' },
  { label: 'Materi Bacaan (Reading)', value: 'reading' },
  { label: 'Lainnya (Other)', value: 'other' },
];

const STATUS_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'completed', title: 'Completed', color: 'bg-emerald-500' },
];

export default function TaskManagerPage() {
  const { tasks, courses, addTask, updateTask, deleteTask, toggleTaskComplete } = useStudent();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'overdue'
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete State
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    courseId: string;
    dueDate: string;
    priority: Priority;
    status: TaskStatus;
    category: TaskCategory;
  }>({
    title: '',
    description: '',
    courseId: courses[0]?.id || '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    category: 'assignment',
  });

  const handleOpenAdd = (defaultStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      courseId: courses[0]?.id || '',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      status: defaultStatus,
      category: 'assignment',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      courseId: task.courseId,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      category: task.category,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const courseMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string; color: string }>();
    courses.forEach((c) => map.set(c.id, { name: c.name, code: c.code, color: c.color }));
    return map;
  }, [courses]);

  // Filter tasks based on Search, Course, Status, Date Range, Priority, Category
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCourse = filterCourse === 'all' || t.courseId === filterCourse;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

      let matchesDate = true;
      if (filterDateRange === 'today') {
        matchesDate = t.dueDate === todayStr;
      } else if (filterDateRange === 'week') {
        matchesDate = t.dueDate >= todayStr && t.dueDate <= nextWeekStr;
      } else if (filterDateRange === 'month') {
        matchesDate = t.dueDate >= todayStr && t.dueDate <= nextMonthStr;
      } else if (filterDateRange === 'overdue') {
        matchesDate = t.dueDate < todayStr && t.status !== 'completed';
      }

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [tasks, searchQuery, filterCourse, filterStatus, filterDateRange, filterPriority, filterCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Task Manager</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {filteredTasks.length} Tugas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola tugas, deadline, prioritas, status pengerjaan, dan filter berdasarkan tanggal & status.
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => handleOpenAdd('todo')}>
          Tambah Tugas Baru
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari judul tugas atau instruksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'board' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Kanban Board View"
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
                <ListIcon className="w-4 h-4" />
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

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>

          {/* Filter Date Range */}
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Tanggal Deadline</option>
            <option value="today">Deadline Hari Ini</option>
            <option value="week">7 Hari ke Depan</option>
            <option value="month">Bulan Ini</option>
            <option value="overdue">Terlewat / Overdue</option>
          </select>

          {/* Filter Course */}
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Mata Kuliah</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>

          {/* Filter Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Prioritas</option>
            <option value="high">Prioritas Tinggi</option>
            <option value="medium">Prioritas Sedang</option>
            <option value="low">Prioritas Rendah</option>
          </select>
        </div>
      </div>

      {/* Main Task View */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title="Tidak Ada Tugas yang Cocok"
          description="Coba bersihkan filter pencarian atau tambahkan tugas akademik baru."
          actionLabel="Tambah Tugas Baru"
          onAction={() => handleOpenAdd('todo')}
        />
      ) : viewMode === 'board' ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id);

            return (
              <div
                key={column.id}
                className="rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col max-h-[85vh]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                    <h3 className="text-sm font-bold text-white tracking-tight">{column.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenAdd(column.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={`Tambah tugas ke ${column.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[150px]">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border border-dashed border-slate-800/60 rounded-xl text-xs text-slate-400 text-center p-2">
                      Belum ada tugas di kolom ini
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const course = courseMap.get(task.courseId);
                      const color = getCourseColor(course?.color);
                      const remaining = getDaysRemaining(task.dueDate);

                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md transition-all group"
                        >
                          {/* Course code & Priority */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {course ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border truncate max-w-[120px] ${color.badge}`}
                              >
                                {course.code}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                Umum
                              </span>
                            )}
                            <PriorityBadge priority={task.priority} />
                          </div>

                          {/* Task Title */}
                          <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-1.5">
                            {task.title}
                          </h4>

                          {/* Task Description */}
                          {task.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Due Date & Category */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 mb-3">
                            <span
                              className={`flex items-center gap-1 font-medium ${
                                remaining.isOverdue
                                  ? 'text-rose-400'
                                  : remaining.isToday
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {remaining.text}
                            </span>
                            <span className="text-[10px] uppercase font-medium text-slate-400">
                              {task.category}
                            </span>
                          </div>

                          {/* Move Column & Action buttons */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            {/* Column Quick Switch Dropdown */}
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                            </select>

                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleOpenEdit(task)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingTaskId(task.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
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
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Tugas & Deskripsi</th>
                  <th className="px-5 py-3.5">Mata Kuliah</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Prioritas</th>
                  <th className="px-5 py-3.5">Tenggat Waktu</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((task) => {
                  const course = courseMap.get(task.courseId);
                  const color = getCourseColor(course?.color);
                  const remaining = getDaysRemaining(task.dueDate);

                  return (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className="flex items-center text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <p
                          className={`font-semibold text-white ${
                            task.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {course ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${color.badge}`}>
                            {course.code}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-300 capitalize">{task.category}</td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-medium ${
                            remaining.isOverdue
                              ? 'text-rose-400 font-semibold'
                              : remaining.isToday
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {task.dueDate} ({remaining.text})
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTaskId(task.id)}
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

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Tugas' : 'Tambah Tugas Baru'}
        description="Rincikan deskripsi, prioritas, deadline, dan status pengerjaan."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Judul Tugas"
            placeholder="e.g. Laporan Praktikum Modul 3..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Mata Kuliah"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              options={courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c.id }))}
            />

            <Select
              label="Kategori Tugas"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
              options={CATEGORIES}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tenggat Waktu (Deadline)"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />

            <Select
              label="Prioritas"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              options={[
                { label: 'Tinggi (High)', value: 'high' },
                { label: 'Sedang (Medium)', value: 'medium' },
                { label: 'Rendah (Low)', value: 'low' },
              ]}
            />

            <Select
              label="Status Pengerjaan"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              options={[
                { label: 'To Do', value: 'todo' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Review', value: 'review' },
                { label: 'Completed', value: 'completed' },
              ]}
            />
          </div>

          <Textarea
            label="Catatan / Rincian Instruksi (Opsional)"
            placeholder="Rincian persyaratan tugas, kriteria penilaian, atau tautan repositori..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingTask ? 'Simpan Perubahan' : 'Tambah Tugas'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={confirmDelete}
        title="Hapus Tugas"
        message="Apakah Anda yakin ingin menghapus tugas ini secara permanen dari Task Manager?"
      />
    </div>
  );
}
