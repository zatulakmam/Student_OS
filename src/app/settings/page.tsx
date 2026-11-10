'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  ShieldAlert,
  Sparkles,
  Timer,
  Save,
  CheckCircle2,
  Cloud,
  Database,
  Lock,
  LogOut,
  Copy,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { StudentProfile } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { getSupabaseClient } from '@/lib/supabase';

export default function SettingsPage() {
  const {
    profile,
    updateProfile,
    resetToDefault,
    exportData,
    importData,
    connectSupabase,
    disconnectSupabase,
    syncToSupabase,
    pullFromSupabase,
    supabaseStatus,
  } = useStudent();

  const [profileForm, setProfileForm] = useState<StudentProfile>(profile);
  const [profileSaved, setProfileSaved] = useState(false);

  // Backup & Import state
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Config Form
  const [supabaseUrl, setSupabaseUrl] = useState(profile.supabaseConfig?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(profile.supabaseConfig?.anonKey || '');
  const [supabaseMessage, setSupabaseMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auth Form State (Email / Password)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  // Schema viewer modal
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);

  // Confirmation dialogs
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
          setImportStatus('Data berhasil diimpor!');
        } else {
          setImportStatus('Gagal membaca file JSON. Format tidak valid.');
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Supabase Connect
  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSupabaseMessage('Silakan masukkan Project URL dan Anon Key.');
      return;
    }
    setIsConnecting(true);
    const result = await connectSupabase(supabaseUrl.trim(), supabaseKey.trim());
    setIsConnecting(false);
    setSupabaseMessage(result.message);
    setTimeout(() => setSupabaseMessage(null), 5000);
  };

  // Supabase Auth (Sign In / Sign Up)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setAuthFeedback('Hubungkan URL & Anon Key Supabase terlebih dahulu.');
      return;
    }

    const client = getSupabaseClient(supabaseUrl, supabaseKey);
    if (!client) {
      setAuthFeedback('Klien Supabase tidak tersedia.');
      return;
    }

    setAuthLoading(true);
    setAuthFeedback(null);

    try {
      if (authMode === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        updateProfile({
          supabaseConfig: {
            url: supabaseUrl,
            anonKey: supabaseKey,
            connected: true,
            userEmail: data.user?.email || authEmail,
          },
        });
        setAuthFeedback(`Berhasil masuk sebagai ${data.user?.email}!`);
      } else {
        const { data, error } = await client.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        updateProfile({
          supabaseConfig: {
            url: supabaseUrl,
            anonKey: supabaseKey,
            connected: true,
            userEmail: data.user?.email || authEmail,
          },
        });
        setAuthFeedback('Pendaftaran berhasil! Cek email untuk verifikasi atau langsung gunakan.');
      }
    } catch (err: any) {
      setAuthFeedback(err.message || 'Terjadi kesalahan autentikasi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient(supabaseUrl, supabaseKey);
    if (client) {
      await client.auth.signOut();
    }
    disconnectSupabase();
    setAuthFeedback('Berhasil keluar dari akun Supabase. Kembali ke mode LocalStorage offline.');
  };

  const handleTriggerSync = async () => {
    const res = await syncToSupabase();
    setSupabaseMessage(res.message);
    setTimeout(() => setSupabaseMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Settings & Cloud Management</h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Tahap 5: Supabase Ready
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Sesuaikan profil identitas mahasiswa, durasi belajar pomodoro, dan integrasikan database online Supabase.
        </p>
      </div>

      {/* Tahap 5: Supabase Cloud Database & Authentication Card */}
      <Card className="border-blue-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20">
        <CardHeader
          title="Tahap 5 – Integrasi Database Online & Autentikasi (Supabase)"
          subtitle="Migrasikan penyimpanan lokal (LocalStorage) ke cloud database PostgreSQL Supabase dengan user authentication"
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<Code2 className="w-3.5 h-3.5" />}
              onClick={() => setIsSchemaModalOpen(true)}
            >
              Lihat SQL Schema
            </Button>
          }
        />

        {/* Current Cloud Status Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                supabaseStatus.isConfigured
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Status Penyimpanan:</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    supabaseStatus.isConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {supabaseStatus.isConfigured ? 'Online (Supabase Cloud)' : 'Offline (LocalStorage)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {supabaseStatus.userEmail
                  ? `Terhubung sebagai: ${supabaseStatus.userEmail}`
                  : 'Aplikasi berjalan dalam mode penyimpanan lokal browser yang privat.'}
              </p>
            </div>
          </div>

          {supabaseStatus.isConfigured && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Database className="w-3.5 h-3.5" />}
                onClick={handleTriggerSync}
                disabled={supabaseStatus.isSyncing}
              >
                {supabaseStatus.isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Data'}
              </Button>
              <Button variant="danger" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={handleSignOut}>
                Putuskan
              </Button>
            </div>
          )}
        </div>

        {/* Supabase Connection Form */}
        <form onSubmit={handleConnectSupabase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Supabase Project URL"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              helperText="Dapatkan dari Project Settings > API di dashboard Supabase Anda."
              required
            />
            <Input
              label="Supabase Public Anon Key"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              helperText="Kunci publik (anon / public key) untuk akses aman client-side."
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {supabaseMessage ? (
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {supabaseMessage}
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Data tetap tersimpan di LocalStorage secara otomatis dan disinkronkan saat terhubung.
              </span>
            )}

            <Button
              variant="secondary"
              size="sm"
              type="submit"
              icon={<Cloud className="w-3.5 h-3.5" />}
              disabled={isConnecting}
            >
              {isConnecting ? 'Menghubungkan...' : 'Hubungkan Supabase'}
            </Button>
          </div>
        </form>

        {/* User Auth Section (Sign In / Sign Up) */}
        {supabaseUrl && supabaseKey && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>Autentikasi Pengguna Mahasiswa</span>
              </h4>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`px-2.5 py-1 rounded-lg ${
                    authMode === 'signin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Masuk (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`px-2.5 py-1 rounded-lg ${
                    authMode === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daftar (Sign Up)
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <Input
                label="Email Mahasiswa"
                type="email"
                placeholder="nama@mahasiswa.ac.id"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter..."
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
              <Button variant="primary" type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Memproses...'
                  : authMode === 'signin'
                  ? 'Masuk Akun'
                  : 'Daftar Akun'}
              </Button>
            </form>

            {authFeedback && (
              <p className="text-xs text-blue-300 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                {authFeedback}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Profile Form Card */}
      <Card>
        <CardHeader
          title="Profil Mahasiswa"
          subtitle="Informasi akademik yang digunakan pada header dan perhitungan target"
        />

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
            />
            <Input
              label="Nomor Induk Mahasiswa (NIM)"
              value={profileForm.studentId}
              onChange={(e) => setProfileForm({ ...profileForm, studentId: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Universitas / Institut"
              value={profileForm.university}
              onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
              required
            />
            <Input
              label="Fakultas / Sekolah"
              value={profileForm.faculty}
              onChange={(e) => setProfileForm({ ...profileForm, faculty: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Program Studi / Jurusan"
              value={profileForm.major}
              onChange={(e) => setProfileForm({ ...profileForm, major: e.target.value })}
              required
            />
            <Input
              label="Semester Saat Ini"
              type="number"
              min={1}
              max={14}
              value={profileForm.currentSemester}
              onChange={(e) =>
                setProfileForm({ ...profileForm, currentSemester: parseInt(e.target.value) || 1 })
              }
              required
            />
            <Input
              label="Tahun Akademik"
              placeholder="e.g. 2026/2027 Gasal"
              value={profileForm.academicYear}
              onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target IPK Kelulusan (Skala 4.00)"
              type="number"
              step="0.01"
              min="2.00"
              max="4.00"
              value={profileForm.targetGPA}
              onChange={(e) =>
                setProfileForm({ ...profileForm, targetGPA: parseFloat(e.target.value) || 3.0 })
              }
              required
            />
            <Input
              label="Target Belajar Mingguan (Jam / Minggu)"
              type="number"
              min={1}
              max={80}
              value={profileForm.weeklyStudyTargetHours}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  weeklyStudyTargetHours: parseFloat(e.target.value) || 15,
                })
              }
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {profileSaved ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Profil berhasil disimpan ke LocalStorage!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Data otomatis disimpan di browser Anda.</span>
            )}

            <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
              Simpan Profil
            </Button>
          </div>
        </form>
      </Card>

      {/* Pomodoro Preferences Card */}
      <Card>
        <CardHeader
          title="Preferensi Timer Pomodoro"
          subtitle="Atur durasi default waktu fokus dan jeda istirahat"
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Durasi Fokus (Menit)"
            type="number"
            min={1}
            max={120}
            value={profileForm.pomodoroConfig.focusMinutes}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                pomodoroConfig: {
                  ...profileForm.pomodoroConfig,
                  focusMinutes: parseInt(e.target.value) || 25,
                },
              })
            }
          />

          <Input
            label="Istirahat Singkat (Menit)"
            type="number"
            min={1}
            max={30}
            value={profileForm.pomodoroConfig.shortBreakMinutes}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                pomodoroConfig: {
                  ...profileForm.pomodoroConfig,
                  shortBreakMinutes: parseInt(e.target.value) || 5,
                },
              })
            }
          />

          <Input
            label="Istirahat Panjang (Menit)"
            type="number"
            min={5}
            max={60}
            value={profileForm.pomodoroConfig.longBreakMinutes}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                pomodoroConfig: {
                  ...profileForm.pomodoroConfig,
                  longBreakMinutes: parseInt(e.target.value) || 15,
                },
              })
            }
          />

          <Input
            label="Interval Sesi Panjang"
            type="number"
            min={2}
            max={10}
            value={profileForm.pomodoroConfig.longBreakInterval}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                pomodoroConfig: {
                  ...profileForm.pomodoroConfig,
                  longBreakInterval: parseInt(e.target.value) || 4,
                },
              })
            }
          />
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              updateProfile(profileForm);
              setProfileSaved(true);
              setTimeout(() => setProfileSaved(false), 3000);
            }}
          >
            Simpan Pengaturan Timer
          </Button>
        </div>
      </Card>

      {/* Backup, Export & Import Card */}
      <Card>
        <CardHeader
          title="Backup & Manajemen Data (LocalStorage)"
          subtitle="Unduh salinan cadangan data atau pulihkan data dari file JSON"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-white">Ekspor Data Cadangan (Backup JSON)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Unduh seluruh data mata kuliah, tugas, jadwal, nilai IPK, dan catatan dalam satu berkas JSON.
              </p>
            </div>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Ekspor Data
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-white">Impor Data Cadangan</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Pulihkan data Student OS dari berkas JSON hasil ekspor sebelumnya.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Pilih Berkas JSON
              </Button>
            </div>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 font-semibold">
              {importStatus}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Reset ke Data Awal (Sample Data)</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Mengembalikan seluruh data ke data demo bawaan Student OS.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setIsResetConfirmOpen(true)}
            >
              Reset Data
            </Button>
          </div>
        </div>
      </Card>

      {/* SQL Schema Modal */}
      <Modal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        title="Supabase Database SQL Schema"
        description="Salin skrip SQL ini ke SQL Editor di dashboard Supabase Anda untuk membuat seluruh tabel dan RLS."
        maxWidth="xl"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">File: supabase/schema.sql</span>
            <Button
              variant="outline"
              size="sm"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={() => {
                const schemaCode = `-- Supabase Schema for Student OS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, student_id TEXT NOT NULL, university TEXT NOT NULL, major TEXT NOT NULL,
  faculty TEXT, current_semester INTEGER DEFAULT 1, academic_year TEXT DEFAULT '2026/2027 Gasal',
  target_gpa NUMERIC(3,2) DEFAULT 3.85, weekly_study_target_hours NUMERIC(4,1) DEFAULT 15.0,
  grade_scale JSONB, pomodoro_config JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL, name TEXT NOT NULL, credits INTEGER NOT NULL, lecturer TEXT, room TEXT,
  day TEXT NOT NULL, time_start TEXT NOT NULL, time_end TEXT NOT NULL, semester INTEGER NOT NULL,
  status TEXT DEFAULT 'active', color TEXT DEFAULT 'blue', target_grade TEXT DEFAULT 'A',
  current_score NUMERIC(5,2), syllabus_progress INTEGER DEFAULT 0, notes TEXT
);
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID, title TEXT NOT NULL, description TEXT, due_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'todo', category TEXT DEFAULT 'assignment'
);`;
                navigator.clipboard.writeText(schemaCode);
                setSchemaCopied(true);
                setTimeout(() => setSchemaCopied(false), 3000);
              }}
            >
              {schemaCopied ? 'Tersalin!' : 'Salin SQL'}
            </Button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-blue-300 font-mono overflow-x-auto max-h-80 leading-relaxed">
{`-- STUDENT OS: Academic Productivity Management System
-- Skema Tabel Supabase & Row Level Security (RLS)

1. profiles (id, name, student_id, university, major, target_gpa, ...)
2. courses (id, user_id, code, name, credits, lecturer, room, semester, status, ...)
3. tasks (id, user_id, course_id, title, due_date, priority, status, category, ...)
4. schedule_items (id, user_id, title, day, start_time, end_time, location, ...)
5. gpa_semesters (id, user_id, semester, name, courses JSONB, ips, total_credits)
6. study_sessions (id, user_id, course_id, date, duration_minutes, session_type)
7. notes (id, user_id, title, content, category, tags, is_pinned)
8. goals (id, user_id, title, category, target_date, progress, status, milestones JSONB)

*File lengkap tersimpan di: student-os/supabase/schema.sql`}
          </pre>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsSchemaModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetToDefault}
        title="Konfirmasi Reset Data"
        message="Apakah Anda yakin ingin mengatur ulang semua data ke data contoh awal? Perubahan yang Anda buat akan ditimpa."
        confirmLabel="Ya, Reset Data"
      />
    </div>
  );
}
