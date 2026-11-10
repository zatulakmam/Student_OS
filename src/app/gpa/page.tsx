'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  Award,
  TrendingUp,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { GradeLetter } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DEFAULT_GRADE_SCALE } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';

const STANDARD_GRADES: GradeLetter[] = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'];

export default function GPACalculatorPage() {
  const {
    gpaSemesters,
    profile,
    cumulativeGPA,
    totalCreditsCompleted,
    addSemester,
    deleteSemester,
    addCourseToSemester,
    updateCourseInSemester,
    removeCourseFromSemester,
    updateGradeScale,
  } = useStudent();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Simulator target state
  const [simulatorTargetGPA, setSimulatorTargetGPA] = useState<number>(profile.targetGPA || 3.8);
  const [simulatorRemainingCredits, setSimulatorRemainingCredits] = useState<number>(20);

  // Expanded semester state
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});

  // New Semester Modal
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newSemesterNum, setNewSemesterNum] = useState(gpaSemesters.length + 1);

  // New / Edit Course in Semester Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<{
    code: string;
    name: string;
    credits: number;
    grade: GradeLetter;
  }>({
    code: '',
    name: '',
    credits: 3,
    grade: 'A',
  });

  // Grade Scale Config Modal
  const [isGradeScaleModalOpen, setIsGradeScaleModalOpen] = useState(false);
  const [scaleForm, setScaleForm] = useState<Record<string, number>>(
    profile.gradeScale || DEFAULT_GRADE_SCALE
  );

  // Delete confirmations
  const [deletingSemesterId, setDeletingSemesterId] = useState<string | null>(null);
  const [deletingCourseTarget, setDeletingCourseTarget] = useState<{
    semesterId: string;
    courseId: string;
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Predikat kelulusan
  const honorsTitle = useMemo(() => {
    if (cumulativeGPA >= 3.51) return { title: 'Cum Laude (Dengan Pujian)', color: 'text-amber-400' };
    if (cumulativeGPA >= 3.0) return { title: 'Sangat Memuaskan', color: 'text-blue-400' };
    if (cumulativeGPA >= 2.75) return { title: 'Memuaskan', color: 'text-slate-300' };
    return { title: 'Cukup', color: 'text-slate-400' };
  }, [cumulativeGPA]);

  // Target GPA Simulation logic
  const simulationResult = useMemo(() => {
    let currentTotalQualityPoints = 0;
    gpaSemesters.forEach((s) => {
      s.courses.forEach((c) => {
        currentTotalQualityPoints += c.credits * c.gradePoint;
      });
    });

    const targetCreditsTotal = totalCreditsCompleted + simulatorRemainingCredits;
    const requiredTotalPoints = targetCreditsTotal * simulatorTargetGPA;
    const pointsNeeded = requiredTotalPoints - currentTotalQualityPoints;
    const requiredIPS = simulatorRemainingCredits > 0 ? pointsNeeded / simulatorRemainingCredits : 0;

    const isPossible = requiredIPS <= 4.0;
    const isAlreadyReached = pointsNeeded <= 0;

    return {
      requiredIPS: Number(requiredIPS.toFixed(2)),
      isPossible,
      isAlreadyReached,
      targetCreditsTotal,
    };
  }, [gpaSemesters, totalCreditsCompleted, simulatorTargetGPA, simulatorRemainingCredits]);

  // Chart data
  const chartData = useMemo(() => {
    return gpaSemesters.map((s) => ({
      name: `Sem ${s.semester}`,
      ips: s.ips,
      target: simulatorTargetGPA,
      sks: s.totalCredits,
    }));
  }, [gpaSemesters, simulatorTargetGPA]);

  const handleOpenAddCourse = (semesterId: string) => {
    setActiveSemesterId(semesterId);
    setEditingCourseId(null);
    setCourseForm({
      code: '',
      name: '',
      credits: 3,
      grade: 'A',
    });
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (
    semesterId: string,
    course: { id: string; code: string; name: string; credits: number; grade: GradeLetter }
  ) => {
    setActiveSemesterId(semesterId);
    setEditingCourseId(course.id);
    setCourseForm({
      code: course.code,
      name: course.name,
      credits: course.credits,
      grade: course.grade,
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSemesterId || !courseForm.name.trim()) return;

    if (editingCourseId) {
      updateCourseInSemester(activeSemesterId, editingCourseId, courseForm);
    } else {
      addCourseToSemester(activeSemesterId, courseForm);
    }
    setIsCourseModalOpen(false);
  };

  const handleAddSemester = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSemesterName.trim() || `Semester ${newSemesterNum}`;
    addSemester(name, newSemesterNum);
    setIsSemesterModalOpen(false);
    setNewSemesterName('');
    setNewSemesterNum((prev) => prev + 1);
  };

  const handleSaveScale = (e: React.FormEvent) => {
    e.preventDefault();
    updateGradeScale(scaleForm);
    setIsGradeScaleModalOpen(false);
  };

  const handleResetScale = () => {
    setScaleForm(DEFAULT_GRADE_SCALE);
    updateGradeScale(DEFAULT_GRADE_SCALE);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">GPA Calculator & Simulator</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Skala A, AB, B, BC, C, D, E (Fleksibel)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Hitung Indeks Prestasi Semester (IPS), akumulasi IPK kumulatif, dan atur bobot nilai sesuai ketentuan kampus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<Sliders className="w-4 h-4" />}
            onClick={() => {
              setScaleForm(profile.gradeScale || DEFAULT_GRADE_SCALE);
              setIsGradeScaleModalOpen(true);
            }}
          >
            Atur Skala Bobot
          </Button>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setNewSemesterNum(gpaSemesters.length + 1);
              setNewSemesterName(`Semester ${gpaSemesters.length + 1}`);
              setIsSemesterModalOpen(true);
            }}
          >
            Tambah Semester
          </Button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-950/60 to-slate-900 border-blue-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">IPK Kumulatif</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{cumulativeGPA.toFixed(2)}</h3>
              <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${honorsTitle.color}`}>
                <Award className="w-3.5 h-3.5" />
                {honorsTitle.title}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Calculator className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Beban SKS Lulus</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalCreditsCompleted} SKS</h3>
              <p className="text-xs text-slate-400 mt-2">
                Dari {gpaSemesters.length} semester terdaftar
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Target IPK Profil</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{profile.targetGPA.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-2">
                {cumulativeGPA >= profile.targetGPA
                  ? 'Target tercapai! Pertahankan 🎉'
                  : `Selisih ${(profile.targetGPA - cumulativeGPA).toFixed(2)} poin 🎯`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Simulator Card & Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulator Card (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader
                title="Target GPA Simulator"
                subtitle="Hitung nilai minimal yang dibutuhkan semester berikutnya"
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Target IPK Akhir
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="2.0"
                    max="4.0"
                    value={simulatorTargetGPA}
                    onChange={(e) => setSimulatorTargetGPA(parseFloat(e.target.value) || 3.0)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Sisa SKS yang Akan Ditempuh
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={simulatorRemainingCredits}
                    onChange={(e) => setSimulatorRemainingCredits(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Simulation Result Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Minimal IPS Dibutuhkan:</span>
                    <span
                      className={`text-2xl font-extrabold ${
                        simulationResult.isAlreadyReached
                          ? 'text-emerald-400'
                          : !simulationResult.isPossible
                          ? 'text-rose-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {simulationResult.isAlreadyReached
                        ? 'Tercapai 🎉'
                        : simulationResult.requiredIPS.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                    {!simulationResult.isPossible ? (
                      <span className="text-rose-400 font-medium">
                        Target ini secara matematis membutuhkan IPS di atas 4.00 ({simulationResult.requiredIPS}). Coba sesuaikan target atau tambah SKS.
                      </span>
                    ) : simulationResult.isAlreadyReached ? (
                      <span className="text-emerald-400 font-medium">
                        IPK saat ini sudah melebihi target! Pertahankan rata-rata nilai pada semester berikutnya.
                      </span>
                    ) : (
                      <span>
                        Kamu harus mempertahankan rata-rata nilai minimal{' '}
                        <strong className="text-white">
                          IPS {simulationResult.requiredIPS.toFixed(2)}
                        </strong>{' '}
                        selama {simulatorRemainingCredits} SKS ke depan untuk mencapai target IPK{' '}
                        {simulatorTargetGPA.toFixed(2)}.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                Bobot aktif: A={profile.gradeScale?.['A'] ?? 4.0}, AB={profile.gradeScale?.['AB'] ?? 3.5}, B={profile.gradeScale?.['B'] ?? 3.0}, BC={profile.gradeScale?.['BC'] ?? 2.5}, C={profile.gradeScale?.['C'] ?? 2.0}
              </span>
            </div>
          </Card>
        </div>

        {/* GPA History Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader
              title="Grafik Tren IPS Per Semester"
              subtitle="Perbandingan Indeks Prestasi Semester vs Target Kelulusan"
            />

            <div className="h-64 w-full pt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      formatter={(val: any, name: any) => [
                        Number(val).toFixed(2),
                        name === 'ips' ? 'IPS Riil' : 'Target Simulator',
                      ]}
                    />
                    <Bar dataKey="ips" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={32} />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Semesters List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Rincian Nilai Per Semester</h3>

        {gpaSemesters.length === 0 ? (
          <Card className="text-center py-8 text-slate-400">
            Belum ada data semester. Klik tombol "Tambah Semester" di atas untuk memulai.
          </Card>
        ) : (
          gpaSemesters.map((sem) => {
            const isCollapsed = expandedSemesters[sem.id] === true;

            return (
              <Card key={sem.id} className="overflow-hidden">
                {/* Semester Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(sem.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isCollapsed ? 'Buka' : 'Tutup'}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <div>
                      <h4 className="text-base font-bold text-white">{sem.name}</h4>
                      <p className="text-xs text-slate-400">
                        {sem.courses.length} mata kuliah • Total {sem.totalCredits} SKS
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-right">
                      <span className="text-[10px] text-blue-300 uppercase font-semibold block">IPS</span>
                      <span className="text-base font-extrabold text-blue-400">{sem.ips.toFixed(2)}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenAddCourse(sem.id)}
                    >
                      Tambah Matkul
                    </Button>

                    <button
                      onClick={() => setDeletingSemesterId(sem.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Semester"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Course List in Semester */}
                {!isCollapsed && (
                  <div className="mt-4">
                    {sem.courses.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada mata kuliah dalam semester ini. Klik "Tambah Matkul" untuk memasukkan nilai.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                            <tr>
                              <th className="py-2.5 px-3">Kode</th>
                              <th className="py-2.5 px-3">Nama Mata Kuliah</th>
                              <th className="py-2.5 px-3">SKS</th>
                              <th className="py-2.5 px-3">Nilai Huruf</th>
                              <th className="py-2.5 px-3">Bobot Angka</th>
                              <th className="py-2.5 px-3">Mutu (SKS x Nilai)</th>
                              <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {sem.courses.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-blue-400">{c.code || '-'}</td>
                                <td className="py-2.5 px-3 font-medium text-white">{c.name}</td>
                                <td className="py-2.5 px-3 text-slate-300">{c.credits} SKS</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {c.grade}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-300">{c.gradePoint.toFixed(1)}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-200">
                                  {(c.credits * c.gradePoint).toFixed(1)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditCourse(sem.id, c)}
                                      className="p-1 rounded text-slate-400 hover:text-white"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeletingCourseTarget({ semesterId: sem.id, courseId: c.id })
                                      }
                                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Grade Scale Configuration Modal */}
      <Modal
        isOpen={isGradeScaleModalOpen}
        onClose={() => setIsGradeScaleModalOpen(false)}
        title="Konfigurasi Skala Bobot Nilai Kampus"
        description="Atur bobot angka setiap huruf nilai (A, AB, B, BC, C, D, E) sesuai ketentuan universitas Anda."
        maxWidth="md"
      >
        <form onSubmit={handleSaveScale} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.keys(DEFAULT_GRADE_SCALE).map((grade) => (
              <Input
                key={grade}
                label={`Nilai ${grade}`}
                type="number"
                step="0.05"
                min="0.0"
                max="4.0"
                value={scaleForm[grade] !== undefined ? scaleForm[grade] : DEFAULT_GRADE_SCALE[grade]}
                onChange={(e) =>
                  setScaleForm({
                    ...scaleForm,
                    [grade]: parseFloat(e.target.value) || 0.0,
                  })
                }
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetScale}
            >
              Reset ke Standar
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsGradeScaleModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Terapkan Skala
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Semester Modal */}
      <Modal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        title="Tambah Semester Baru"
        description="Masukkan nama dan nomor urut semester."
        maxWidth="sm"
      >
        <form onSubmit={handleAddSemester} className="space-y-4">
          <Input
            label="Nomor Semester"
            type="number"
            min={1}
            max={14}
            value={newSemesterNum}
            onChange={(e) => setNewSemesterNum(parseInt(e.target.value) || 1)}
            required
          />
          <Input
            label="Nama Semester"
            placeholder="e.g. Semester 5 (Gasal 2026/2027)"
            value={newSemesterName}
            onChange={(e) => setNewSemesterName(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsSemesterModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Buat Semester
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Course in Semester Modal */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourseId ? 'Edit Nilai Mata Kuliah' : 'Tambah Nilai Mata Kuliah'}
        description="Tentukan kode, nama mata kuliah, bobot SKS, dan nilai perolehan (A, AB, B, BC, C, D, E)."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Kode Matkul"
              placeholder="e.g. IF3110"
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Nama Mata Kuliah"
                placeholder="e.g. Pemrograman Web"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Bobot SKS"
              type="number"
              min={1}
              max={6}
              value={courseForm.credits}
              onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) || 1 })}
              required
            />

            <Select
              label="Nilai Huruf (Grade)"
              value={courseForm.grade}
              onChange={(e) => setCourseForm({ ...courseForm, grade: e.target.value as GradeLetter })}
              options={STANDARD_GRADES.map((g) => {
                const pt = profile.gradeScale?.[g] ?? DEFAULT_GRADE_SCALE[g];
                return {
                  label: `Grade ${g} (${pt.toFixed(1)})`,
                  value: g,
                };
              })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCourseModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCourseId ? 'Simpan Nilai' : 'Tambahkan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Semester Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSemesterId}
        onClose={() => setDeletingSemesterId(null)}
        onConfirm={() => {
          if (deletingSemesterId) deleteSemester(deletingSemesterId);
        }}
        title="Hapus Semester"
        message="Apakah Anda yakin ingin menghapus semester ini beserta semua data mata kuliah di dalamnya?"
      />

      {/* Delete Course Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCourseTarget}
        onClose={() => setDeletingCourseTarget(null)}
        onConfirm={() => {
          if (deletingCourseTarget) {
            removeCourseFromSemester(deletingCourseTarget.semesterId, deletingCourseTarget.courseId);
          }
        }}
        title="Hapus Mata Kuliah"
        message="Hapus nilai mata kuliah ini dari semester terpilih?"
      />
    </div>
  );
}
