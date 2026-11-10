'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Plus, CheckSquare, FileText, Timer, Cloud } from 'lucide-react';
import { useStudent } from '@/context/StudentContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { profile, cumulativeGPA, supabaseStatus } = useStudent();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [greeting, setGreeting] = useState('Selamat Datang');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi');
      else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
      else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');

      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setCurrentDateTime(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-18 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: mobile hamburger & greeting */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-white">
              {greeting}, <span className="text-blue-400">{profile.name.split(' ')[0]}</span>
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {profile.academicYear}
            </span>
          </div>
          <p className="text-xs text-slate-400">{currentDateTime || 'Memuat tanggal...'}</p>
        </div>
      </div>

      {/* Right section: Quick actions & academic summary */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/settings"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
          title={supabaseStatus.isConfigured ? 'Supabase Online' : 'LocalStorage Offline'}
        >
          <Cloud
            className={`w-3.5 h-3.5 ${
              supabaseStatus.isConfigured ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
          <span className="text-[11px] font-medium">
            {supabaseStatus.isConfigured ? 'Cloud Sync' : 'Offline'}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400">Target IPK:</span>
          <span className="font-semibold text-emerald-400">{profile.targetGPA.toFixed(2)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Aktual:</span>
          <span className="font-semibold text-blue-400">{cumulativeGPA.toFixed(2)}</span>
        </div>

        <Link href="/tasks">
          <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
            <span className="hidden sm:inline">Tugas Baru</span>
          </Button>
        </Link>

        <Link href="/study-tracker">
          <Button variant="primary" size="sm" icon={<Timer className="w-3.5 h-3.5" />}>
            <span className="hidden sm:inline">Fokus Belajar</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
