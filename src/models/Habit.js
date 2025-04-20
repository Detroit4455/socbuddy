const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [50, 'Habit name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  owner: {
    type: String,
    required: [true, 'Owner is required'],
    default: 'Anonymous User'
  },
  color: {
    type: String,
    default: '#09cbb1' // Default teal color
  },
  icon: {
    type: String,
    default: '✓' // Default checkmark
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  targetDaysPerWeek: {
    type: Number,
    min: 1,
    max: 7,
    default: 7
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  streakData: [
    {
      date: {
        type: String, // YYYY-MM-DD format
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      notes: {
        type: String,
        maxlength: [200, 'Notes cannot be more than 200 characters']
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a pre-save middleware to ensure owner is set
habitSchema.pre('save', function(next) {
  // If owner is not set or is empty, use a default derived from userId
  if (!this.owner || this.owner.trim() === '') {
    this.owner = 'User_' + this._id.toString().substring(0, 8);
  }
  next();
});

// Index for faster queries
habitSchema.index({ userId: 1 });
habitSchema.index({ 'streakData.date': 1 });

const Habit = mongoose.models.Habit || mongoose.model('Habit', habitSchema);

module.exports = Habit; 