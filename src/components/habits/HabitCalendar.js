import React, { useState } from 'react';

export default function HabitCalendar({ habit, onToggleDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Function to check if a date has a habit entry
  const isDateCompleted = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return (habit.streakData || []).some(
      entry => entry.date === dateStr && entry.completed
    );
  };
  
  // Function to check if a date has notes
  const dateHasNote = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = (habit.streakData || []).find(entry => entry.date === dateStr);
    return entry && entry.notes && entry.notes.trim() !== '';
  };

  // Function to check if date is today or yesterday
  const isDateTodayOrYesterday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === today.getTime() || 
           checkDate.getTime() === yesterday.getTime();
  };
  
  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get day of week the month starts on (0 = Sunday, 6 = Saturday)
  const getStartDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar data
  const generateCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getStartDayOfMonth(year, month);
    
    // Create weeks array
    let weeks = [];
    let week = Array(7).fill(null);
    
    // Fill in days before the start of the month
    for (let i = 0; i < startDay; i++) {
      const prevMonthDay = new Date(year, month, -i);
      week[startDay - i - 1] = prevMonthDay;
    }
    
    // Fill in days of the month
    let dayCounter = 1;
    for (let i = startDay; i < 7; i++) {
      if (dayCounter <= daysInMonth) {
        week[i] = new Date(year, month, dayCounter);
        dayCounter++;
      }
    }
    
    weeks.push(week);
    
    // Fill in the rest of the weeks
    while (dayCounter <= daysInMonth) {
      week = Array(7).fill(null);
      
      for (let i = 0; i < 7; i++) {
        if (dayCounter <= daysInMonth) {
          week[i] = new Date(year, month, dayCounter);
          dayCounter++;
        } else {
          // Fill in days after the end of the month
          const nextMonthDay = new Date(year, month + 1, i - (7 - (dayCounter - daysInMonth)) + 1);
          week[i] = nextMonthDay;
        }
      }
      
      weeks.push(week);
    }
    
    return weeks;
  };
  
  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Navigate to current month
  const goToToday = () => {
    setCurrentMonth(new Date());
  };
  
  // Get calendar data
  const calendarData = generateCalendarData();
  
  // Check if date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is yesterday
  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  };
  
  // Format month and year
  const monthYearString = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  
  // Handle date click
  const handleDateClick = (date) => {
    if (isCurrentMonth(date) && isDateTodayOrYesterday(date)) {
      onToggleDate(formatDate(date));
    } else if (isCurrentMonth(date)) {
      // Only show error or feedback if it's the current month but not today/yesterday
      alert("You can only track habits for today and yesterday");
    }
  };
  
  return (
    <div className="bg-[#1e1e1e] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{monthYearString}</h3>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg bg-[#333] hover:bg-[#444] transition-colors text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs rounded-lg bg-[#333] hover:bg-[#444] transition-colors text-white"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg bg-[#333] hover:bg-[#444] transition-colors text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="calendar">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="text-center text-[#666] text-xs py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid gap-1">
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((date, dateIndex) => {
                const isTrackable = isDateTodayOrYesterday(date);
                return (
                <div
                  key={dateIndex}
                  onClick={() => handleDateClick(date)}
                  className={`
                    relative h-10 flex items-center justify-center rounded-md ${isTrackable && isCurrentMonth(date) ? 'cursor-pointer' : 'cursor-default'}
                    ${isCurrentMonth(date) ? 'text-white' : 'text-[#555]'}
                    ${isToday(date) ? 'ring-1 ring-[rgba(9,203,177,0.823)]' : ''}
                    ${isCurrentMonth(date) && !isDateCompleted(date) && isTrackable ? 'hover:bg-[#333]' : ''}
                  `}
                  style={{ 
                    backgroundColor: isDateCompleted(date) && isCurrentMonth(date) ? `${habit.color}20` : '',
                  }}
                >
                  <div className="text-sm">
                    {date.getDate()}
                  </div>
                  
                  {/* Completion indicator */}
                  {isDateCompleted(date) && isCurrentMonth(date) && (
                    <div 
                      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs"
                      style={{ color: habit.color }}
                    >
                      {habit.icon}
                    </div>
                  )}
                  
                  {/* Note indicator */}
                  {dateHasNote(date) && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-yellow-500 m-1"></div>
                  )}
                </div>
              )})}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 