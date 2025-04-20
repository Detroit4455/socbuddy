import React, { useState } from 'react';
import HabitCalendar from './HabitCalendar';
import { toast } from 'react-hot-toast';

export default function HabitStreakView({ habit, onTrack, onDelete }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [note, setNote] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if habit is completed for today
  const isTodayCompleted = (habit.streakData || []).some(
    entry => entry.date === today && entry.completed
  );
  
  // Get note for today if exists
  const todayNote = (habit.streakData || []).find(
    entry => entry.date === today
  )?.notes || '';
  
  // Generate last 7 days for the quick view
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const isCompleted = (habit.streakData || []).some(
      entry => entry.date === dateString && entry.completed
    );
    
    last7Days.push({
      date: dateString,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isCompleted
    });
  }

  // Function to check if date is today or yesterday
  const isDateTodayOrYesterday = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === today.getTime() || 
           checkDate.getTime() === yesterday.getTime();
  };
  
  const handleToggleToday = () => {
    onTrack(
      habit._id, 
      today, 
      !isTodayCompleted, 
      note || todayNote
    );
  };
  
  const handleToggleDate = (date) => {
    // Check if the date is today or yesterday
    if (!isDateTodayOrYesterday(date)) {
      toast.error("You can only track habits for today and yesterday");
      return;
    }
    
    const isCompleted = (habit.streakData || []).some(
      entry => entry.date === date && entry.completed
    );
    
    const existingNote = (habit.streakData || []).find(
      entry => entry.date === date
    )?.notes || '';
    
    onTrack(habit._id, date, !isCompleted, existingNote);
  };
  
  const handleSaveNote = () => {
    onTrack(habit._id, today, isTodayCompleted, note);
    setIsEditMode(false);
  };
  
  const handleDeleteConfirm = () => {
    onDelete(habit._id);
    setIsConfirmingDelete(false);
  };
  
  return (
    <div className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#444]">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div 
            className="w-10 h-10 flex items-center justify-center rounded-full mr-4 text-xl"
            style={{ backgroundColor: `${habit.color}30`, color: habit.color }}
          >
            {habit.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{habit.name}</h3>
            {habit.description && (
              <p className="text-[#bbb] text-sm">{habit.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center">
            <span className="text-[#666] text-xs">Current</span>
            <span className="text-2xl font-bold" style={{ color: habit.color }}>
              {habit.currentStreak || 0}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#666] text-xs">Longest</span>
            <span className="text-2xl font-bold text-white">
              {habit.longestStreak || 0}
            </span>
          </div>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="ml-4 p-2 rounded-lg bg-[#333] hover:bg-[#444] transition-colors text-white"
            title="View Calendar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setIsConfirmingDelete(!isConfirmingDelete)}
            className="p-2 rounded-lg bg-[#333] hover:bg-red-900 transition-colors text-white"
            title="Delete Habit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Confirmation dialog for deleting */}
      {isConfirmingDelete && (
        <div className="px-6 py-4 bg-red-900 bg-opacity-20 border-t border-red-800">
          <p className="text-white mb-3">Are you sure you want to delete this habit? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="px-3 py-1 rounded-lg bg-[#333] text-white hover:bg-[#444]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-1 rounded-lg bg-red-800 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Quick streak view - last 7 days */}
      <div className="px-6 py-3 bg-[#222] border-t border-[#444]">
        <div className="flex justify-between">
          {last7Days.map((day, index) => {
            const isTrackable = isDateTodayOrYesterday(day.date);
            return (
            <div 
              key={day.date}
              onClick={() => isTrackable ? handleToggleDate(day.date) : null}
              className={`flex flex-col items-center ${isTrackable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="text-xs text-[#666] mb-1">{day.day}</span>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  day.isCompleted 
                    ? 'bg-opacity-20 border-2' 
                    : 'bg-[#333] border border-[#555]'
                } ${!isTrackable ? 'opacity-70' : ''}`}
                style={{ 
                  backgroundColor: day.isCompleted ? `${habit.color}20` : '',
                  borderColor: day.isCompleted ? habit.color : ''
                }}
              >
                {day.isCompleted && (
                  <span style={{ color: habit.color }}>{habit.icon}</span>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
      
      {/* Today's tracking */}
      <div className="px-6 py-4 bg-[#1e1e1e] border-t border-[#444]">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[#bbb] font-medium">Today</h4>
            {!isEditMode ? (
              <p className="text-white mt-1">
                {todayNote || "No notes for today"}
              </p>
            ) : (
              <div className="mt-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add notes for today..."
                  className="w-full bg-[#2a2a2a] rounded border border-[#444] p-2 text-white"
                  rows="2"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1 rounded-lg bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]"
                  >
                    Save Note
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setNote(todayNote);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#333] text-white hover:bg-[#444]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {!isEditMode && (
              <button
                onClick={() => {
                  setIsEditMode(true);
                  setNote(todayNote);
                }}
                className="p-2 rounded-lg bg-[#333] hover:bg-[#444] transition-colors text-white"
                title="Add Note"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleToggleToday}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isTodayCompleted
                  ? 'bg-opacity-20 border text-white'
                  : 'bg-[#333] hover:bg-[#444] text-[#bbb]'
              }`}
              style={{ 
                backgroundColor: isTodayCompleted ? `${habit.color}20` : '',
                borderColor: isTodayCompleted ? habit.color : ''
              }}
            >
              <span>{isTodayCompleted ? 'Completed' : 'Mark Complete'}</span>
              {isTodayCompleted && (
                <span style={{ color: habit.color }}>{habit.icon}</span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar View */}
      {showCalendar && (
        <div className="border-t border-[#444]">
          <HabitCalendar 
            habit={habit} 
            onToggleDate={handleToggleDate} 
          />
        </div>
      )}
    </div>
  );
} 