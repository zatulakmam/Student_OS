'use client';

import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { Goal, GoalMilestone } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, generateId } from '@/lib/utils';

const CATEGORIES = [
  { label: 'Semua Kategori', value: 'all' },
  { label: 'Target Akademik', value: 'academic' },
  { label: 'Proyek / Lomba', value: 'project' },
  { label: 'Pengembangan Skill', value: 'skill' },
  { label: 'Karier & Magang', value: 'career' },
];

export default function GoalTrackerPage() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } = useStudent();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: 'academic' | 'project' | 'skill' | 'career';
    targetDate: string;
    milestones: { title: string; completed: boolean }[];
  }>({
    title: '',
    description: '',
    category: 'academic',
    targetDate: '',
    milestones: [
      { title: '', completed: false },
      { title: '', completed: false },
    ],
  });

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      category: 'academic',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: [
        { title: '', completed: false },
        { title: '', completed: false },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      targetDate: goal.targetDate,
      milestones: goal.milestones.map((m) => ({ title: m.title, completed: m.completed })),
    });
    setIsModalOpen(true);
  };

  const handleAddMilestoneInput = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', completed: false }],
    }));
  };

  const handleRemoveMilestoneInput = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const handleMilestoneTextChange = (index: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.milestones];
      updated[index] = { ...updated[index], title: val };
      return { ...prev, milestones: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Filter valid milestones
    const validMilestones: GoalMilestone[] = formData.milestones
      .filter((m) => m.title.trim())
      .map((m) => ({
        id: generateId(),
        title: m.title.trim(),
        completed: m.completed,
      }));

    const completedCount = validMilestones.filter((m) => m.completed).length;
    const progress =
      validMilestones.length > 0 ? Math.round((completedCount / validMilestones.length) * 100) : 0;
    const status: 'completed' | 'in_progress' | 'not_started' =
      progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

    const goalData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      targetDate: formData.targetDate,
      progress,
      status,
      milestones: validMilestones,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, goalData);
    } else {
      addGoal(goalData);
    }
    setIsModalOpen(false);
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (selectedCategory === 'all') return true;
      return g.category === selectedCategory;
    });
  }, [goals, selectedCategory]);

  // Overall Goal Stats
  const completedGoalsCount = useMemo(() => {
    return goals.filter((g) => g.status === 'completed').length;
  }, [goals]);

  const avgProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const sum = goals.reduce((acc, g) => acc + g.progress, 0);
    return Math.round(sum / goals.length);
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Academic Goal Tracker</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {completedGoalsCount} dari {goals.length} Tercapai
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tetapkan target capaian semester, publikasi, kompetisi, dan langkah terukur (milestones).
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Buat Target Baru
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Rata-Rata Progres</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{avgProgress}%</h3>
              <div className="w-40 h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Target Tercapai</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{completedGoalsCount}</h3>
              <p className="text-xs text-slate-400 mt-2">Milestone tuntas 100%</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Target Berjalan</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {goals.length - completedGoalsCount}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Sedang diperjuangkan semester ini</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="Belum Ada Target di Kategori Ini"
          description="Tetapkan sasaran akademik, proyek portofolio, atau target karier impianmu."
          actionLabel="Buat Target Baru"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const isCompleted = goal.status === 'completed';

            return (
              <Card
                key={goal.id}
                hoverable
                className={`flex flex-col justify-between group ${
                  isCompleted ? 'border-emerald-500/40 bg-gradient-to-br from-slate-900 to-emerald-950/10' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                      {goal.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {goal.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Goal Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-1.5">
                    {goal.title}
                  </h3>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{goal.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Langkah Capaian (Milestones):
                    </p>
                    <div className="space-y-1.5">
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => toggleMilestone(goal.id, m.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer text-xs ${
                            m.completed ? 'bg-slate-950/40 text-slate-400' : 'hover:bg-slate-800/40 text-slate-200'
                          }`}
                        >
                          <button className="mt-0.5 text-blue-400 shrink-0">
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <span className={m.completed ? 'line-through text-slate-400' : ''}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer: Target Date & Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Target: {formatDate(goal.targetDate)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(goal.id)}
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

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Target Capaian' : 'Buat Target Baru'}
        description="Rumuskan tujuan yang spesifik, terukur, dan memiliki tenggat waktu."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Sasaran / Judul Target"
            placeholder="e.g. Publikasi Paper Riset AI di Konferensi Nasional"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Kategori"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              options={[
                { label: 'Target Akademik', value: 'academic' },
                { label: 'Proyek / Lomba', value: 'project' },
                { label: 'Pengembangan Skill', value: 'skill' },
                { label: 'Karier & Magang', value: 'career' },
              ]}
            />

            <Input
              label="Target Tanggal Selesai"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Deskripsi / Motivasi Sasaran"
            placeholder="Mengapa target ini penting dan bagaimana mencapainya..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />

          {/* Milestones dynamic builder */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-slate-300">
                Milestones / Subtask Checklist
              </label>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddMilestoneInput}
              >
                Tambah Subtask
              </Button>
            </div>

            <div className="space-y-2">
              {formData.milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Langkah ${idx + 1} (e.g. Selesai draf pertama bab 1)...`}
                    value={m.title}
                    onChange={(e) => handleMilestoneTextChange(idx, e.target.value)}
                  />
                  {formData.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneInput(idx)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingGoal ? 'Simpan Perubahan' : 'Buat Target'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteGoal(deletingId);
        }}
        title="Hapus Target"
        message="Apakah Anda yakin ingin menghapus target ini beserta langkah capaiannya?"
      />
    </div>
  );
}
