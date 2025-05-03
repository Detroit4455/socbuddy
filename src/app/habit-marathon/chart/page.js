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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalUsers, setModalUsers] = useState([]);

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
    // Fetch latest invitations after progress loads
    fetch('/api/habits/marathon')
      .then(res => res.json())
      .then(data => setInvitations(data))
      .catch(console.error);
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

  const maxCompleted = Math.max(...progress.participants.map(p => p.completedDays), 0);
  const trackDays = Math.max(10, maxCompleted);
  const barColors = ['#A78BFA','#3B82F6','#EC4899','#34D399','#FACC15'];
  const formattedStartDate = progress.startDate
    ? new Date(progress.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  // Find the current invitation/session for this marathon
  const currentInvitation = invitations.find(inv => inv.marathonId === selectedMarathonId);
  let pendingCount = 0, acceptedCount = 0, rejectedCount = 0;
  let participantList = [];
  if (currentInvitation) {
    if (currentInvitation.marathonStats) {
      pendingCount = currentInvitation.marathonStats.pending || 0;
      acceptedCount = currentInvitation.marathonStats.accepted || 0;
      rejectedCount = currentInvitation.marathonStats.rejected || 0;
    } else {
      // Not owner: calculate from participants (from progress) or requested (from invitation)
      if (progress && progress.participants) {
        participantList = progress.participants;
        acceptedCount = participantList.filter(p => p.status === 'accepted').length;
        pendingCount = participantList.filter(p => p.status === 'pending').length;
        rejectedCount = participantList.filter(p => p.status === 'rejected').length;
      } else if (currentInvitation.participants) {
        participantList = currentInvitation.participants;
        acceptedCount = participantList.filter(p => p.status === 'accepted').length;
        pendingCount = participantList.filter(p => p.status === 'pending').length;
        rejectedCount = participantList.filter(p => p.status === 'rejected').length;
      }
    }
    // Always set participantList for modal
    if (!participantList.length && progress && progress.participants) {
      participantList = progress.participants;
    } else if (!participantList.length && currentInvitation.participants) {
      participantList = currentInvitation.participants;
    }
  }

  // Handler to open modal with users of a given status
  const handleShowStatusModal = (status) => {
    let users = participantList.filter(p => p.status === status);
    // If no users found and currentInvitation exists, try to get from requested array
    if (users.length === 0 && currentInvitation && currentInvitation.session && Array.isArray(currentInvitation.session.requested)) {
      users = currentInvitation.session.requested
        .filter(r => r.status === status)
        .map(r => ({
          userId: r.to?.toString?.() || r.to,
          username: r.username || (r.to?.username) || 'Unknown User',
          status: r.status
        }));
    }
    setModalUsers(users);
    setModalStatus(status);
    setShowStatusModal(true);
  };

  // Handler to close modal
  const handleCloseModal = () => {
    setShowStatusModal(false);
    setModalStatus('');
    setModalUsers([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 text-white py-8 px-4 sm:px-0">
      {/* Top navigation bar */}
      <nav className="w-full mb-4 sm:mb-6 flex items-center justify-between px-2 sm:px-6">
        <Link href="/habit-tracker" className="text-white hover:text-gray-300">
          <HomeIcon className="h-6 w-6 inline-block" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium">
            Hello, {session?.user?.username}
          </span>
          {/* Mobile Manage button */}
          <Link 
            href="/habit-marathon" 
            className="sm:hidden px-2 py-1 text-xs font-medium rounded-md bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
          >
            <span className="inline-block animate-bounce">🏃‍➡️</span>
            Manage
          </Link>
          {/* Desktop Manage button */}
          <Link 
            href="/habit-marathon" 
            className="hidden sm:block px-3 py-1 text-sm font-medium rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            Manage
          </Link>
        </div>
      </nav>
      <div className="max-w-full sm:max-w-4xl w-full mx-auto p-4 sm:p-6 bg-white/10 border border-white/20 rounded-lg"
        style={{ minHeight: '75vh' }}>
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
        <div className="mb-10" />
        <div className="flex flex-col justify-center items-center min-h-[300px]">
          <main className="space-y-6 w-full">
            {progress.participants.map((p, i) => {
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
                        <div className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" style={{ width: slide ? `${percent}%` : '0%', backgroundColor: color }} />
                      </div>
                    </div>
                    <span className="absolute -top-4 -translate-x-1/2 overflow-visible animate-bounce transition-all duration-1000 ease-out text-lg leading-none" style={{ left: slide ? `${percent}%` : '0%' }}>
                      🏃‍➡️
                    </span>
                  </div>
                  <span className="hidden sm:block sm:w-12 text-right text-sm">{p.completedDays}km</span>
                  <div className="flex justify-between w-full mt-[-2px] sm:hidden">
                    <span className="w-full text-sm font-medium truncate">{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{p.username}</span>
                    <span className="text-sm">{p.completedDays}km</span>
                  </div>
                </div>
              );
            })}
          </main>
        </div>
        <div className="flex justify-between mt-6 text-sm">
          <div>
            Day {maxCompleted} of {trackDays}<br />Each day = 1km
          </div>
          <div className="text-right">
            {/* Capsule for participant counts */}
            <div className="flex gap-2 justify-end mb-2">
              <button
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800 focus:outline-none"
                onClick={() => handleShowStatusModal('accepted')}
                type="button"
              >
                {acceptedCount} accepted
              </button>
              <button
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-800 focus:outline-none"
                onClick={() => handleShowStatusModal('pending')}
                type="button"
              >
                {pendingCount} pending
              </button>
              <button
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800 focus:outline-none"
                onClick={() => handleShowStatusModal('rejected')}
                type="button"
              >
                {rejectedCount} rejected
              </button>
            </div>
            Start Date: {formattedStartDate}
          </div>
        </div>
      </div>
      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white text-gray-900 rounded-lg shadow-lg p-6 min-w-[260px] max-w-xs w-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold capitalize">{modalStatus} Users</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
            </div>
            {modalUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No users</div>
            ) : (
              <ul className="space-y-2">
                {modalUsers.map(u => (
                  <li key={u.userId} className="px-3 py-1 rounded bg-gray-100 text-gray-800 text-sm">{u.username}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
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
 