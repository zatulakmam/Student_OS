# Student_OS
> Membantu mahasiswa dalam perkuliahannya — Academic Productivity Management System

Student OS adalah aplikasi manajemen produktivitas akademik modern yang dirancang khusus untuk mahasiswa. Dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, Lucide React, Recharts, LocalStorage, dan dukungan integrasi database Supabase.

---

## 🚀 Fitur Utama

1. **Dashboard Eksekutif**
   - Ringkasan IPK Kumulatif, total SKS aktif, tugas mendekati tenggat, dan jam belajar mingguan.
   - Jadwal perkuliahan hari ini (*real-time*).
   - Grafik interaktif waktu fokus 7 hari dan tren IPK semester vs target.

2. **Course Manager (`/courses`)**
   - Manajemen mata kuliah aktif, nama dosen pengampu, jumlah SKS, semester, dan status (*Sedang Diambil, Lulus, Mengulang, Rencana Ambil*).
   - Tampilan Grid & List view, filter status & semester, serta progres silabus.

3. **GPA Calculator & Simulator (`/gpa`)**
   - Perhitungan otomatis IPS dan IPK kumulatif dengan skala nilai standar Indonesia (**A, AB, B, BC, C, D, E**).
   - **Skala Bobot Fleksibel**: Konfigurasi bobot nilai sesuai peraturan masing-masing universitas.
   - **Target GPA Simulator**: Menghitung IPS minimal yang dibutuhkan untuk mencapai target IPK kelulusan (*Cum Laude*).

4. **Task Manager (`/tasks`)**
   - Papan Kanban 4 kolom (*To Do, In Progress, Review, Completed*) dan tampilan List.
   - Filter tugas berdasarkan Status, Tanggal Deadline (*Hari ini, 7 hari ke depan, Bulan ini, Overdue*), Mata Kuliah, dan Prioritas.

5. **Academic Schedule (`/schedule`)**
   - Timetable mingguan visual (Senin – Minggu) dengan penanda otomatis hari ini.
   - Informasi ruangan, jam mulai/selesai, dan jenis kegiatan (*Lecture, Lab, Seminar, Study Group, Office Hours*).

6. **Study Tracker & Focus Timer (`/study-tracker`)**
   - Timer Pomodoro interaktif (*Focus 25m, Short Break 5m, Long Break 15m*).
   - Catatan sesi belajar dan pengaitan ke mata kuliah.
   - Pencatatan durasi harian, statistik mingguan, dan target jam belajar mingguan dengan progress bar.

7. **Notes (`/notes`)**
   - Catatan materi perkuliahan dengan kategori (*Summary, Lecture Notes, Cheat Sheet, Meeting, Idea*).
   - Fitur Pin to Top, tagar, dan modal pembaca yang nyaman.

8. **Goal Tracker (`/goals`)**
   - Penetapan sasaran akademik dan karier dengan milestone checklist dinamis.

9. **Settings & Supabase Cloud (`/settings`)**
   - Profil identitas mahasiswa dan konfigurasi durasi Pomodoro.
   - Backup & Restore JSON (Export / Import data).
   - **Integrasi Supabase**: Database cloud PostgreSQL dan autentikasi user mahasiswa. Skrip skema database tersedia di `supabase/schema.sql`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **State & Storage**: React Context + LocalStorage (Offline Mode) + Supabase Cloud (Online Mode)

---

## 💻 Panduan Instalasi Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/zatulakmam/Student_OS.git
   cd Student_OS
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```

4. **Buka di browser**:
   Akses [http://localhost:3000](http://localhost:3000)

---

## 📄 Lisensi
Distributed under the MIT License.
