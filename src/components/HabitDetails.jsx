import React from 'react';

export default function HabitDetails({
  selectedHabit,
  darkMode,
  currentMonth,
  calendarData,
  handleTrackHabit,
  isDateTodayOrYesterday,
  prevMonth,
  nextMonth,
  formatMonthYear,
  formatMonthName,
  getCompletionRate
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column - Habit details and insights */}
      <div className="lg:col-span-8">
        <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 mb-6`}>
          <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>{selectedHabit.name}</h2>
          {selectedHabit.description && (
            <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-4`}>{selectedHabit.description}</p>
          )}

          {/* Progress Insights */}
          <div className="mt-4">
            <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : ''}`}>Progress Insights</h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
              {/* Current Streak */}
              <div className={`text-center py-1 px-2 md:py-2 md:px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Current Streak</p>
                <div className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{selectedHabit.currentStreak > 0 ? selectedHabit.currentStreak : 1}</div>
                <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>days</p>
              </div>
              {/* Completion Rate */}
              <div className={`text-center py-1 px-2 md:py-2 md:px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Completion Rate</p>
                <div className="flex justify-center">
                  <div className="relative h-10 w-10 md:h-16 md:w-16">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={darkMode ? "#555" : "#E5E7EB"}
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={darkMode ? "rgba(9,203,177,0.823)" : "#A78BFA"}
                        strokeWidth="3"
                        strokeDasharray={`${getCompletionRate(selectedHabit)}, 100`}
                      />
                    </svg>
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] md:text-sm font-semibold ${darkMode ? 'text-white' : ''}`}>{getCompletionRate(selectedHabit)}%</div>
                  </div>
                </div>
                <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>last 30 days</p>
              </div>
              {/* Best Streak */}
              <div className={`text-center py-1 px-2 md:py-2 md:px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Best Streak</p>
                <div className={`text-3xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{selectedHabit.longestStreak > 0 ? selectedHabit.longestStreak : 1}</div>
                <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>days</p>
              </div>
              {/* Total Completed */}
              <div className={`text-center py-1 px-2 md:py-2 md:px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Total Completed</p>
                <div className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{(selectedHabit.streakData || []).filter(entry => entry.completed).length}</div>
                <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>days</p>
              </div>
            </div>
          </div>
        </div>
        {/* Calendar Section */}
        <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mb-4`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{formatMonthYear(currentMonth)}</h3>
            <div className="flex space-x-2">
              <button onClick={prevMonth} className={`p-1 rounded-full ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}>&larr;</button>
              <button onClick={nextMonth} className={`p-1 rounded-full ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}>&rarr;</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Previous Month Calendar */}
            <div className={`hidden md:block transform transition-transform hover:scale-105 hover:shadow-md rounded-lg border ${darkMode ? 'border-[#444] bg-[#2a2a2a]' : 'border-gray-200 bg-white'} p-2 shadow-sm hover:shadow relative`}>
              <div className={`absolute inset-0 ${darkMode ? 'bg-[#333]' : 'bg-gray-100'} rounded-lg transform -z-10`} style={{ transform: 'translate(3px, 3px)' }}></div>
              <h4 className={`text-center font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-1 text-sm`}>{formatMonthName(new Date(calendarData.prevMonth.year, calendarData.prevMonth.month))}</h4>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S','M','T','W','T','F','S'].map((d,i)=>(<div key={i} className={`text-center py-1 font-medium ${darkMode?'text-[#666]':'text-gray-500'}`}>{d}</div>))}
                {calendarData.prevMonth?.days?.map((day,i)=>(
                  <div key={i} className={`text-center py-1 relative ${day.isCurrentMonth?(darkMode?'text-white':'text-gray-800'):(darkMode?'text-[#555]':'text-gray-400')}`} onClick={()=>isDateTodayOrYesterday(day.dateStr)&&handleTrackHabit(selectedHabit._id,day.dateStr)}>
                    <span className={`h-5 w-5 flex items-center justify-center mx-auto rounded-full text-xs ${(day.completed?(darkMode?'bg-[rgba(9,203,177,0.823)]':'bg-teal-500')+' text-white':(darkMode?'hover:bg-[#333]':'hover:bg-gray-100'))} ${isDateTodayOrYesterday(day.dateStr)?'cursor-pointer':'opacity-70'}`}>{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Current Month Calendar */}
            <div className={`transform transition-transform hover:scale-105 hover:shadow-md rounded-lg border ${darkMode ? 'border-[#444] bg-[#2a2a2a]' : 'border-gray-200 bg-white'} p-2 shadow-sm hover:shadow relative`}>
              <div className={`absolute inset-0 ${darkMode ? 'bg-[#333]' : 'bg-gray-100'} rounded-lg transform -z-10`} style={{ transform: 'translate(3px, 3px)' }}></div>
              <h4 className={`text-center font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-1 text-sm`}>{formatMonthName(new Date(calendarData.currentMonth.year, calendarData.currentMonth.month))}</h4>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S','M','T','W','T','F','S'].map((d,i)=>(<div key={i} className={`text-center py-1 font-medium ${darkMode?'text-[#666]':'text-gray-500'}`}>{d}</div>))}
                {calendarData.currentMonth?.days?.map((day,i)=>(
                  <div key={i} className={`text-center py-1 relative ${day.isCurrentMonth?(darkMode?'text-white':'text-gray-800'):(darkMode?'text-[#555]':'text-gray-400')} ${new Date(day.dateStr).toDateString()===new Date().toDateString()?'font-bold':''}`} onClick={()=>{const dt=new Date();dt.setHours(0,0,0,0);const d=new Date(day.dateStr);d.setHours(0,0,0,0); if(d.getTime()===dt.getTime()||d.getTime()===new Date(dt).setDate(dt.getDate()-1))handleTrackHabit(selectedHabit._id,day.dateStr)}}>
                    <span className={`h-5 w-5 flex items-center justify-center mx-auto rounded-full text-xs ${(day.completed?(darkMode?'bg-[rgba(9,203,177,0.823)]':'bg-teal-500')+' text-white':(darkMode?'hover:bg-[#333]':'hover:bg-gray-100'))} ${(new Date(day.dateStr).toDateString()===new Date().toDateString()&&!day.completed)?'border border-purple-500':''} ${isDateTodayOrYesterday(day.dateStr)?'cursor-pointer':'opacity-70'}`}>{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Next Month Calendar */}
            <div className={`hidden md:block transform transition-transform hover:scale-105 hover:shadow-md rounded-lg border ${darkMode ? 'border-[#444] bg-[#2a2a2a]' : 'border-gray-200 bg-white'} p-2 shadow-sm hover:shadow relative`}>
              <div className={`absolute inset-0 ${darkMode ? 'bg-[#333]' : 'bg-gray-100'} rounded-lg transform -z-10`} style={{ transform: 'translate(3px, 3px)' }}></div>
              <h4 className={`text-center font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-1 text-sm`}>{formatMonthName(new Date(calendarData.nextMonth.year, calendarData.nextMonth.month))}</h4>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S','M','T','W','T','F','S'].map((d,i)=>(<div key={i} className={`text-center py-1 font-medium ${darkMode?'text-[#666]':'text-gray-500'}`}>{d}</div>))}
                {calendarData.nextMonth?.days?.map((day,i)=>(
                  <div key={i} className={`text-center py-1 relative ${day.isCurrentMonth?(darkMode?'text-white':'text-gray-800'):(darkMode?'text-[#555]':'text-gray-400')}`}>
                    <span className="h-5 w-5 flex items-center justify-center mx-auto rounded-full text-xs opacity-70">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Task Completion History */}
        <div className={`col-span-3 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mb-4`}>
          <h3 className={`text-md font-medium mb-3 ${darkMode ? 'text-white' : ''}`}>Task Completion History</h3>
          <div className="h-32">
            {selectedHabit.streakData && selectedHabit.streakData.length > 0 ? (
              <div className="relative h-full">
                {/* X-axis */}
                <div className={`absolute bottom-0 left-0 right-0 h-px ${darkMode ? 'bg-[#444]' : 'bg-gray-200'}`}></div>
                {/* Y-axis */}
                <div className={`absolute top-0 bottom-0 left-0 w-px ${darkMode ? 'bg-[#444]' : 'bg-gray-200'}`}></div>
                {(() => {
                  const dates = [];
                  const today = new Date();
                  for (let i = 13; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    dates.push(date.toISOString().split('T')[0]);
                  }
                  const completionData = dates.map(date => ({
                    date,
                    completed: selectedHabit.streakData.find(e => e.date === date)?.completed ? 1 : 0,
                    displayDate: new Date(date).getDate()
                  }));
                  const graphHeight = 200;
                  return (
                    <>
                      {/* Line graph */}
                      <svg className="w-full h-full" viewBox={`0 0 ${completionData.length * 30} ${graphHeight}`} preserveAspectRatio="none">
                        <path
                          d={`M ${completionData.map((point, idx) => `${idx * 30 + 15},${graphHeight - (point.completed * (graphHeight - 20))}`).join(' L ')}`} 
                          fill="none"
                          stroke={darkMode ? 'rgba(9,203,177,0.823)' : '#8b5cf6'}
                          strokeWidth="2"
                        />
                        {completionData.map((point, idx) => (
                          <circle
                            key={idx}
                            cx={idx * 30 + 15}
                            cy={graphHeight - (point.completed * (graphHeight - 20))}
                            r="4"
                            fill={point.completed ? (darkMode ? 'rgba(9,203,177,0.823)' : '#8b5cf6') : '#fff'}
                            stroke={darkMode ? 'rgba(9,203,177,0.823)' : '#8b5cf6'}
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                      {/* X-axis labels */}
                      <div className="flex justify-between mt-2 px-2">
                        {completionData.map((point, idx) => (
                          <div key={idx} className={`text-xs ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>{point.displayDate}</div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className={`h-full flex items-center justify-center ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>No completion data available yet.</div>
            )}
          </div>
        </div>
      </div>
      {/* Right column - Achievements */}
      <div className="lg:col-span-4">
        <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 h-full`}>
          <h3 className={`text-lg font-medium mb-6 ${darkMode ? 'text-white' : ''}`}>Achievements</h3>
          <div className="space-y-4">
            {[
              { emoji: '🔥', label: '3 Day Streak', threshold: 3 },
              { emoji: '🏆', label: '7 Day Streak', threshold: 7 },
              { emoji: '⭐', label: 'Monthly Master', threshold: 30 }
            ].map(({ emoji, label, threshold }) => (
              <div key={label} className={`p-4 rounded-lg ${selectedHabit.longestStreak >= threshold ? (darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-yellow-50') : (darkMode ? 'bg-[#333]' : 'bg-gray-50')}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{emoji}</div>
                  <div>
                    <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>{label}</h4>
                    <p className={`text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>{selectedHabit.longestStreak >= threshold ? 'Completed' : 'In Progress'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 