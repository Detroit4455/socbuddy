import React from 'react';

export default function HabitStatsDetail({ habits, darkMode }) {
  if (!habits || habits.length === 0) {
    return (
      <div className={`text-center py-12 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} rounded-lg`}>
        <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-500'} mb-4`}>No habits found to display statistics.</p>
      </div>
    );
  }
  
  // Define achievement thresholds and colors
  const achievementConfig = {
    '7-Day Streak': { threshold: 7, color: '#4CAF50' },
    '15-Day Streak': { threshold: 15, color: '#2196F3' },
    '30-Day Warrior': { threshold: 30, color: '#9C27B0' },
    '100-Day Legend': { threshold: 100, color: '#FF9800' },
    'Comeback Kid': { threshold: 1, color: '#E91E63' }
  };
  
  // Calculate completion rates for each habit
  const habitStats = habits.map(habit => {
    const entries = habit.streakData || [];
    const totalEntries = entries.length;
    const completedEntries = entries.filter(entry => entry.completed).length;
    const completionRate = totalEntries > 0 
      ? Math.round((completedEntries / totalEntries) * 100) 
      : 0;
      
    // Calculate in-progress achievements
    const currentStreak = habit.currentStreak || 0;
    const inProgressAchievements = Object.entries(achievementConfig)
      .filter(([name, config]) => {
        // Skip if already achieved
        if (habit.achievements?.includes(name)) return false;
        // For Comeback Kid, check if there was a break of 3+ days
        if (name === 'Comeback Kid') {
          const lastBreak = entries.findIndex(entry => !entry.completed);
          if (lastBreak > 0) {
            const breakDate = new Date(entries[lastBreak].date);
            const streakStartDate = new Date(entries[0].date);
            const breakDuration = Math.ceil((breakDate - streakStartDate) / (1000 * 60 * 60 * 24));
            return breakDuration >= 3;
          }
          return false;
        }
        return currentStreak > 0 && currentStreak < config.threshold;
      })
      .map(([name, config]) => ({
        name,
        progress: Math.min(Math.round((currentStreak / config.threshold) * 100), 100),
        color: config.color
      }));
      
    return {
      id: habit._id,
      name: habit.name,
      color: habit.color,
      icon: habit.icon,
      completionRate,
      completedCount: completedEntries,
      totalCount: totalEntries,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      achievements: habit.achievements || [],
      inProgressAchievements
    };
  });
  
  // Sort by completion rate descending
  habitStats.sort((a, b) => b.completionRate - a.completionRate);
  
  // Get all unique achievements across habits
  const allAchievements = habits.reduce((acc, habit) => {
    if (habit.achievements && habit.achievements.length > 0) {
      habit.achievements.forEach(achievement => {
        if (!acc.includes(achievement)) {
          acc.push(achievement);
        }
      });
    }
    return acc;
  }, []);
  
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
            
            {/* Achievements Section */}
            {(stat.achievements.length > 0 || stat.inProgressAchievements.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs mb-2`}>Achievements</p>
                <div className="flex flex-wrap gap-2">
                  {/* Completed Achievements */}
                  {stat.achievements.map((achievement, index) => (
                    <span
                      key={`completed-${index}`}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-[#333]' : 'bg-gray-100'
                      }`}
                      style={{ 
                        backgroundColor: achievementConfig[achievement]?.color + '20',
                        color: achievementConfig[achievement]?.color,
                        border: `1px solid ${achievementConfig[achievement]?.color}`
                      }}
                    >
                      {achievement}
                    </span>
                  ))}
                  
                  {/* In-Progress Achievements */}
                  {stat.inProgressAchievements.map((achievement, index) => (
                    <div
                      key={`progress-${index}`}
                      className="flex flex-col gap-1"
                    >
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          darkMode ? 'bg-[#333] text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {achievement.name} ({achievement.progress}%)
                      </span>
                      <div className={`w-24 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>
                        <div
                          style={{
                            width: `${achievement.progress}%`,
                            backgroundColor: achievement.color,
                            height: '100%'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* All Achievements Section */}
      {allAchievements.length > 0 && (
        <div className={`mt-8 p-4 rounded-xl border ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Your Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAchievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  darkMode ? 'bg-[#333]' : 'bg-gray-50'
                }`}
                style={{
                  border: `1px solid ${achievementConfig[achievement]?.color}`,
                  backgroundColor: achievementConfig[achievement]?.color + '10'
                }}
              >
                <p 
                  className="font-medium"
                  style={{ color: achievementConfig[achievement]?.color }}
                >
                  {achievement}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 