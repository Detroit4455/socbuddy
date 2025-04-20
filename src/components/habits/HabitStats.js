import React from 'react';

export default function HabitStats({ stats }) {
  if (!stats) return null;
  
  const { totalHabits, completionRate, longestStreak, currentStreaks, habitsByFrequency } = stats;
  
  // Get top streaks
  const topStreaks = Object.entries(currentStreaks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-[#2a2a2a] p-4 rounded-xl border border-[#444]">
        <h3 className="text-[rgba(9,203,177,0.823)] text-sm uppercase mb-2">Overall Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[#666] text-xs">Total Habits</p>
            <p className="text-2xl font-bold text-white">{totalHabits}</p>
          </div>
          <div>
            <p className="text-[#666] text-xs">Completion Rate</p>
            <p className="text-2xl font-bold text-white">{completionRate}%</p>
          </div>
          <div>
            <p className="text-[#666] text-xs">Longest Streak</p>
            <p className="text-2xl font-bold text-white">{longestStreak} days</p>
          </div>
          <div>
            <p className="text-[#666] text-xs">Habit Types</p>
            <div className="flex space-x-2 items-center mt-1">
              {habitsByFrequency.daily > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900 text-blue-200">
                  {habitsByFrequency.daily} Daily
                </span>
              )}
              {habitsByFrequency.weekly > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-900 text-purple-200">
                  {habitsByFrequency.weekly} Weekly
                </span>
              )}
              {habitsByFrequency.monthly > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-pink-900 text-pink-200">
                  {habitsByFrequency.monthly} Monthly
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#2a2a2a] p-4 rounded-xl border border-[#444]">
        <h3 className="text-[rgba(9,203,177,0.823)] text-sm uppercase mb-2">Current Streaks</h3>
        {topStreaks.length > 0 ? (
          <div className="space-y-3">
            {topStreaks.map(([habit, streak]) => (
              <div key={habit} className="flex justify-between items-center">
                <p className="text-white truncate pr-2">{habit}</p>
                <div className="flex items-center">
                  <span className="text-[rgba(9,203,177,0.823)] font-bold">{streak}</span>
                  <span className="text-[#666] text-sm ml-1">days</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#666] italic">No active streaks yet</p>
        )}
      </div>
      
      <div className="bg-[#2a2a2a] p-4 rounded-xl border border-[#444]">
        <h3 className="text-[rgba(9,203,177,0.823)] text-sm uppercase mb-2">Completion Rate</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-white">
                Last 30 Days
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-white">
                {completionRate}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded bg-[#333]">
            <div 
              style={{ width: `${completionRate}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[rgba(9,203,177,0.823)]"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 