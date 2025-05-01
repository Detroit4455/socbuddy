'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { HomeIcon } from '@heroicons/react/solid';

function MarathonChartContent() {
  const searchParams = useSearchParams();
  const initialMarathonId = searchParams.get('marathonId');
  const initialHabitId = searchParams.get('habitId') || null;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [darkMode, setDarkMode] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invLoading, setInvLoading] = useState(!initialHabitId);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(false);
  const [chartHabitId, setChartHabitId] = useState(initialHabitId);
  const [selectedMarathonId, setSelectedMarathonId] = useState(initialMarathonId);

  const currentGroupName = invitations.find(inv => inv.marathonId === selectedMarathonId)?.groupName;

  useEffect(() => {
    setDarkMode(true);
  }, []);

  useEffect(() => {
    setInvLoading(true);
    fetch('/api/habits/marathon')
      .then(res => res.json())
      .then(data => {
        setInvitations(data);
        if (initialMarathonId) {
          const sel = data.find(
            inv => inv.marathonId === initialMarathonId && (inv.status === 'accepted' || inv.status === 'owner')
          );
          if (sel) {
            setSelectedMarathonId(initialMarathonId);
            setChartHabitId(sel.habitId);
          }
        } else if (!initialHabitId) {
          const active = data.find(inv => inv.status === 'accepted' || inv.status === 'owner');
          if (active) {
            setSelectedMarathonId(active.marathonId);
            setChartHabitId(active.habitId);
          }
        } else {
          const inv = data.find(inv => inv.habitId === initialHabitId);
          if (inv?.marathonId) setSelectedMarathonId(inv.marathonId);
        }
      })
      .catch(console.error)
      .finally(() => setInvLoading(false));
  }, []);

  useEffect(() => {
    if (!chartHabitId || !selectedMarathonId) return;
    setLoading(true);
    fetch(
      `/api/habits/marathon/progress?habitId=${encodeURIComponent(chartHabitId)}&marathonId=${encodeURIComponent(
        selectedMarathonId
      )}`
    )
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch progress');
        return res.json();
      })
      .then(data => setProgress(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [chartHabitId, selectedMarathonId]);

  useEffect(() => {
    if (progress) {
      setSlide(false);
      setTimeout(() => setSlide(true), 100);
    }
  }, [progress]);

  if (status === 'loading' || loading || invLoading || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  if (!progress.participants || progress.participants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 flex items-center justify-center text-white">
        No data available.
      </div>
    );
  }

  const participants = progress.participants;
  const maxCompleted = Math.max(...participants.map(p => p.completedDays), 0);
  const trackDays = Math.max(10, maxCompleted);
  const barColors = ['#A78BFA','#3B82F6','#EC4899','#34D399','#FACC15'];
  const formattedStartDate = progress.startDate
    ? new Date(progress.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 text-white py-8 px-4 sm:px-0">
      {/* Top navigation bar */}
      <nav className="w-full mb-4 sm:mb-6 flex items-center justify-between px-2 sm:px-6">
        <Link href="/habit-tracker" className="text-white hover:text-gray-300">
          <HomeIcon className="h-6 w-6 inline-block" />
        </Link>
        <span className="text-xs sm:text-sm font-medium">
          Hello, {session?.user?.username}
        </span>
        <Link href="/habit-marathon" className="px-2 py-0.5 text-xs sm:text-sm font-medium rounded-full bg-white/20 hover:bg-white/30 transition-colors">
          Manage
        </Link>
      </nav>
      <div className="max-w-full sm:max-w-4xl w-full mx-auto p-4 sm:p-6 bg-white/10 border border-white/20 rounded-lg">
        <header className="pb-4 flex flex-col items-center">
          <h1 className="text-lg sm:text-2xl font-semibold text-center">
            Active Marathon: {progress.habitName}
          </h1>
          {currentGroupName && (
            <span className="text-sm font-normal mt-1 block text-center">
              ({currentGroupName})
            </span>
          )}
        </header>
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2">
          {invitations.filter(inv => inv.status === 'accepted' || inv.status === 'owner').map(inv => (
            <button
              key={inv.marathonId}
              onClick={() => {
                setSelectedMarathonId(inv.marathonId);
                setChartHabitId(inv.habitId);
                router.push(`/habit-marathon/chart?marathonId=${inv.marathonId}`, { shallow: true });
              }}
              className={`px-1.5 py-0.5 text-xs sm:px-2 sm:py-0.5 sm:text-xs rounded-full font-medium transition-colors ${
                inv.marathonId === selectedMarathonId ? 'bg-white text-purple-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {inv.name}
            </button>
          ))}
        </div>
        <main className="space-y-6">
          {participants.map((p, i) => {
            const ratio = trackDays > 0 ? p.completedDays / trackDays : 0;
            const percent = ratio * 100;
            const color = barColors[i % barColors.length];
            return (
              <div key={p.userId} className="flex flex-col items-center sm:flex-row sm:items-center overflow-visible">
                <span className="hidden sm:block w-24 text-sm font-medium truncate">
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{p.username}
                </span>
                <div className="relative w-full sm:flex-1 mt-1 mb-0 sm:mx-2 overflow-visible">
                  <div className="overflow-x-auto">
                    <div className="relative w-full h-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <div className="hidden sm:grid absolute -top-1 left-0 right-0 h-3" style={{ gridTemplateColumns: `repeat(${trackDays}, 1fr)` }}>
                        {Array.from({ length: trackDays - 1 }).map((_, idx) => (
                          <div key={idx} className="border-r border-white/40 h-full" />
                        ))}
                      </div>
                      <div className="absolute inset-0" style={{ width: slide ? `${percent}%` : '0%', backgroundColor: color, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div className="absolute -top-4 text-lg leading-none animate-bounce overflow-visible" style={{ left: slide ? `${percent}%` : '0%', transform: 'translateX(-50%)', transition: 'left 1.5s ease-out' }}>
                    🏃‍➡️
                  </div>
                </div>
                <span className="hidden sm:block sm:w-12 text-right text-sm">{p.completedDays}km</span>
                <div className="flex justify-between w-full mt-[-2px] sm:hidden">
                  <span className="w-full text-sm font-medium truncate">{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{p.username}</span>
                  <span className="text-sm">{p.completedDays}km</span>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between mt-6 text-sm">
            <div>
              Day {maxCompleted} of {trackDays}<br />Each day = 1km
            </div>
            <div className="text-right">
              Start Date: {formattedStartDate}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MarathonChart() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-white" />
      </div>
    }>
      <MarathonChartContent />
    </Suspense>
  );
}
 