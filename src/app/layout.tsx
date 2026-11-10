import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { StudentProvider } from '@/context/StudentContext';
import { Shell } from '@/components/layout/Shell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Student OS - Academic Productivity Management System',
  description: 'Sistem Manajemen Produktivitas Akademik Modern untuk Mahasiswa: Jadwal Kuliah, Tugas, Kalkulator IPK, Tracker Belajar & Target Akademik.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-[#0B1120] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <StudentProvider>
          <Shell>{children}</Shell>
        </StudentProvider>
      </body>
    </html>
  );
}
