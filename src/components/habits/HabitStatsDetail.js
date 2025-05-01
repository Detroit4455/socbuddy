import React from 'react';

export default function HabitStatsDetail({ habits, darkMode }) {
  if (!habits || habits.length === 0) {
    return (
      <div className={`text-center py-12 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} rounded-lg`}>
        <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-500'} mb-4`}>No habits found to display statistics.</p>
      </div>
    );
  }
  
  // Calculate completion rates for each habit
  const habitStats = habits.map(habit => {
    const entries = habit.streakData || [];
    const totalEntries = entries.length;
    const completedEntries = entries.filter(entry => entry.completed).length;
    const completionRate = totalEntries > 0 
      ? Math.round((completedEntries / totalEntries) * 100) 
      : 0;
      
    return {
      id: habit._id,
      name: habit.name,
      color: habit.color,
      icon: habit.icon,
      completionRate,
      completedCount: completedEntries,
      totalCount: totalEntries,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak
    };
  });
  
  // Sort by completion rate descending
  habitStats.sort((a, b) => b.completionRate - a.completionRate);
  
  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Habit Performance</h2>
      
      <div className="space-y-4">
        {habitStats.map(stat => (
          <div key={stat.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center mb-3">
              <span 
                className={`text-xl flex items-center justify-center w-8 h-8 rounded-full mr-3 ${darkMode ? '' : 'bg-gray-100'}`}
                style={{ background: stat.color + '30', color: stat.color }}
              >
                {stat.icon}
              </span>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stat.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs mb-1`}>Completion Rate</p>
                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between">
                    <div className="text-right">
                      <span className={`text-sm font-semibold inline-block ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {stat.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className={`overflow-hidden h-2 text-xs flex rounded ${darkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>
                    <div 
                      style={{ width: `${stat.completionRate}%`, backgroundColor: stat.color }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                    ></div>
                  </div>
                </div>
                <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs mt-1`}
                >
                  {stat.completedCount} of {stat.totalCount} days
                </p>
              </div>
              
              <div>
                <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs mb-1`}>Current Streak</p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.currentStreak}
                  <span className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-sm ml-1`}>days</span>
                </p>
              </div>
              
              <div>
                <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs mb-1`}>Longest Streak</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {stat.longestStreak}
                  <span className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-sm ml-1`}>days</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 