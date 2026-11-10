'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Eye,
  Tag,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { Note } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, getCourseColor } from '@/lib/utils';

const CATEGORIES = ['All', 'Summary', 'Lecture Notes', 'Cheat Sheet', 'Meeting', 'Idea'];

export default function NotesPage() {
  const { notes, courses, addNote, updateNote, deleteNote, togglePinNote } = useStudent();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Reading / Preview Modal
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    courseId: string;
    category: string;
    tagsInput: string;
    isPinned: boolean;
  }>({
    title: '',
    content: '',
    courseId: courses[0]?.id || '',
    category: 'Lecture Notes',
    tagsInput: '',
    isPinned: false,
  });

  const handleOpenAdd = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      courseId: courses[0]?.id || '',
      category: 'Lecture Notes',
      tagsInput: '',
      isPinned: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      courseId: note.courseId || '',
      category: note.category,
      tagsInput: note.tags.join(', '),
      isPinned: note.isPinned,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const notePayload = {
      title: formData.title,
      content: formData.content,
      courseId: formData.courseId || undefined,
      category: formData.category,
      tags,
      isPinned: formData.isPinned,
    };

    if (editingNote) {
      updateNote(editingNote.id, notePayload);
    } else {
      addNote(notePayload);
    }
    setIsModalOpen(false);
  };

  const courseMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string; color: string }>();
    courses.forEach((c) => map.set(c.id, { name: c.name, code: c.code, color: c.color }));
    return map;
  }, [courses]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesSearch =
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
        const matchesCourse = selectedCourseFilter === 'all' || n.courseId === selectedCourseFilter;

        return matchesSearch && matchesCat && matchesCourse;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchQuery, selectedCategory, selectedCourseFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Academic Notes</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {filteredNotes.length} Catatan
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simpan rangkuman kuliah, kisi-kisi ujian, cheat sheet rumus, dan referensi akademik penting.
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Buat Catatan Baru
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari judul catatan, isi materi, atau tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Mata Kuliah</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Pill Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="Tidak Ada Catatan Ditemukan"
          description="Coba ubah filter pencarian atau mulai tulis catatan perkuliahan barumu sekarang."
          actionLabel="Buat Catatan Baru"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const course = note.courseId ? courseMap.get(note.courseId) : null;
            const color = getCourseColor(course?.color);

            return (
              <Card
                key={note.id}
                hoverable
                className={`flex flex-col justify-between group relative ${
                  note.isPinned ? 'border-amber-500/40 bg-gradient-to-br from-slate-900 to-amber-950/10' : ''
                }`}
              >
                <div>
                  {/* Card Header: Category & Pin */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {note.category}
                      </span>
                      {course && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color.badge}`}>
                          {course.code}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => togglePinNote(note.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.isPinned
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-500 hover:text-white hover:bg-slate-800'
                      }`}
                      title={note.isPinned ? 'Lepas Pin' : 'Sematkan Catatan'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setViewingNote(note)}
                    className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer mb-2"
                  >
                    {note.title}
                  </h3>

                  {/* Content Preview */}
                  <p
                    onClick={() => setViewingNote(note)}
                    className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 cursor-pointer"
                  >
                    {note.content.replace(/[#*`_]/g, '')}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer: Date & Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(note.updatedAt)}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingNote(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Baca Catatan"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(note.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* View / Read Note Modal */}
      <Modal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        title={viewingNote?.title || 'Baca Catatan'}
        description={
          viewingNote
            ? `${viewingNote.category} • Diperbarui ${formatDate(viewingNote.updatedAt)}`
            : undefined
        }
        maxWidth="xl"
      >
        {viewingNote && (
          <div className="space-y-4">
            {/* Tags and Course */}
            <div className="flex flex-wrap items-center gap-2">
              {viewingNote.courseId && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {courseMap.get(viewingNote.courseId)?.name || 'Mata Kuliah'}
                </span>
              )}
              {viewingNote.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Note Content */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-[60vh] overflow-y-auto">
              {viewingNote.content}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  const noteToEdit = viewingNote;
                  setViewingNote(null);
                  handleOpenEdit(noteToEdit);
                }}
              >
                Edit Catatan
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setViewingNote(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Edit Catatan' : 'Buat Catatan Baru'}
        description="Dokumentasikan materi perkuliahan dengan format rapi."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Judul Catatan"
            placeholder="e.g. Ringkasan Bab 3: Kompleksitas Algoritma..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Mata Kuliah Terkait"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              options={[
                { label: 'Umum (Tanpa Mata Kuliah)', value: '' },
                ...courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c.id })),
              ]}
            />

            <Select
              label="Kategori"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORIES.filter((c) => c !== 'All').map((c) => ({ label: c, value: c }))}
            />
          </div>

          <Input
            label="Tagar / Tags (Pisahkan dengan koma)"
            placeholder="e.g. Algoritma, Big-O, Sorting"
            value={formData.tagsInput}
            onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
          />

          <Textarea
            label="Isi Catatan"
            placeholder="Tulis ringkasan, poin-poin penjelasan materi, atau formula..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            required
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="rounded accent-blue-500 cursor-pointer"
            />
            <label htmlFor="isPinned" className="text-xs text-slate-300 cursor-pointer">
              Sematkan catatan ini di baris teratas (Pin to top)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingNote ? 'Simpan Catatan' : 'Tambah Catatan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteNote(deletingId);
        }}
        title="Hapus Catatan"
        message="Apakah Anda yakin ingin menghapus catatan perkuliahan ini?"
      />
    </div>
  );
}
