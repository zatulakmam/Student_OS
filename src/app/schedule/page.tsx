'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  BookOpen,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { ScheduleItem, DayOfWeek } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { getCourseColor } from '@/lib/utils';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const INDO_DAYS: Record<DayOfWeek, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
};

const SCHEDULE_TYPES = [
  { label: 'Kuliah Teori (Lecture)', value: 'lecture' },
  { label: 'Praktikum Lab (Lab)', value: 'lab' },
  { label: 'Seminar / Workshop', value: 'seminar' },
  { label: 'Kelompok Belajar (Study Group)', value: 'study_group' },
  { label: 'Konsultasi Dosen (Office Hours)', value: 'office_hours' },
];

export default function AcademicSchedulePage() {
  const { schedule, courses, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useStudent();

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'weekly' | 'agenda'>('weekly');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    courseId: string;
    title: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    location: string;
    type: 'lecture' | 'lab' | 'seminar' | 'study_group' | 'office_hours';
    color: string;
  }>({
    courseId: '',
    title: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Lab Komputer 4',
    type: 'lecture',
    color: 'blue',
  });

  const handleOpenAdd = (presetDay?: DayOfWeek) => {
    setEditingItem(null);
    setFormData({
      courseId: courses[0]?.id || '',
      title: courses[0]?.name || '',
      day: presetDay || 'Monday',
      startTime: '08:00',
      endTime: '10:00',
      location: 'Lab Komputer 4',
      type: 'lecture',
      color: courses[0]?.color || 'blue',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      courseId: item.courseId || '',
      title: item.title,
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      type: item.type,
      color: item.color || 'blue',
    });
    setIsModalOpen(true);
  };

  const handleCourseSelect = (courseId: string) => {
    const selectedCourse = courses.find((c) => c.id === courseId);
    if (selectedCourse) {
      setFormData((prev) => ({
        ...prev,
        courseId: selectedCourse.id,
        title: selectedCourse.name,
        color: selectedCourse.color,
        day: selectedCourse.day,
        startTime: selectedCourse.timeStart,
        endTime: selectedCourse.timeEnd,
        location: selectedCourse.room,
      }));
    } else {
      setFormData((prev) => ({ ...prev, courseId: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingItem) {
      updateScheduleItem(editingItem.id, formData);
    } else {
      addScheduleItem(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteScheduleItem(deletingId);
      setDeletingId(null);
    }
  };

  // Group schedule by day
  const scheduleByDay = useMemo(() => {
    const map = new Map<DayOfWeek, ScheduleItem[]>();
    DAYS_OF_WEEK.forEach((d) => map.set(d, []));

    schedule.forEach((item) => {
      const list = map.get(item.day) || [];
      list.push(item);
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      map.set(item.day, list);
    });

    return map;
  }, [schedule]);

  const [todayName, setTodayName] = useState<DayOfWeek>('Monday');

  useEffect(() => {
    const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setTodayName(dayNames[new Date().getDay()]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Academic Schedule</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {schedule.length} Agenda Kuliah
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Jadwal perkuliahan mingguan, sesi laboratorium, dan agenda belajar terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid Mingguan
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'agenda' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Agenda List
            </button>
          </div>

          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => handleOpenAdd()}>
            Tambah Jadwal
          </Button>
        </div>
      </div>

      {/* Main Timetable Content */}
      {schedule.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-8 h-8" />}
          title="Jadwal Akademik Masih Kosong"
          description="Tambahkan mata kuliah beserta jadwal jam kuliah untuk menampilkannya di jadwal mingguan."
          actionLabel="Tambah Jadwal Kuliah"
          onAction={() => handleOpenAdd()}
        />
      ) : viewMode === 'weekly' ? (
        /* Weekly Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
          {DAYS_OF_WEEK.map((day) => {
            const items = scheduleByDay.get(day) || [];
            const isToday = day === todayName;

            return (
              <div
                key={day}
                className={`rounded-2xl border p-3 flex flex-col min-h-[300px] transition-all ${
                  isToday
                    ? 'bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/30'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{INDO_DAYS[day]}</span>
                      {isToday && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500 text-white">
                          Hari Ini
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400">{day}</p>
                  </div>
                  <button
                    onClick={() => handleOpenAdd(day)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={`Tambah ke hari ${INDO_DAYS[day]}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Items */}
                <div className="space-y-2.5 flex-1">
                  {items.length === 0 ? (
                    <div className="h-20 flex items-center justify-center border border-dashed border-slate-800/50 rounded-xl text-[11px] text-slate-400 text-center">
                      Tidak ada kelas
                    </div>
                  ) : (
                    items.map((item) => {
                      const color = getCourseColor(item.color);

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm transition-all group flex flex-col justify-between"
                        >
                          <div>
                            {/* Time & Type Pill */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.startTime} - {item.endTime}
                              </span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {item.type}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-1.5">
                              {item.title}
                            </h4>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-800/80">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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
        /* Agenda List View */
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const items = scheduleByDay.get(day) || [];
            if (items.length === 0) return null;

            return (
              <Card key={day}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {INDO_DAYS[day]} ({day})
                    </h3>
                    {day === todayName && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{items.length} sesi</span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {items.map((item) => {
                    const color = getCourseColor(item.color);
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1.5 h-10 rounded-full"
                            style={{ backgroundColor: color.accent }}
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {item.startTime} - {item.endTime}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {item.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="blue">{item.type}</Badge>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Jadwal Kuliah' : 'Tambah Jadwal Kuliah'}
        description="Atur slot waktu, mata kuliah, dan lokasi ruangan."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {courses.length > 0 && (
            <Select
              label="Pilih dari Mata Kuliah (Opsional untuk Autofill)"
              value={formData.courseId}
              onChange={(e) => handleCourseSelect(e.target.value)}
              options={[
                { label: '-- Input Manual / Kegiatan Lain --', value: '' },
                ...courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c.id })),
              ]}
            />
          )}

          <Input
            label="Nama Mata Kuliah / Agenda"
            placeholder="e.g. Struktur Data & Algoritma"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Hari"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
              options={DAYS_OF_WEEK.map((d) => ({ label: `${INDO_DAYS[d]} (${d})`, value: d }))}
            />

            <Input
              label="Jam Mulai"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />

            <Input
              label="Jam Selesai"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Ruangan / Link Pertemuan"
              placeholder="e.g. Lab Komputer Lt. 3 / Zoom"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />

            <Select
              label="Jenis Kegiatan"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={SCHEDULE_TYPES}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingItem ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Hapus Jadwal Kuliah"
        message="Apakah Anda yakin ingin menghapus jadwal ini dari kalender akademik?"
      />
    </div>
  );
}
