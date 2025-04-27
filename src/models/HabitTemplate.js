const mongoose = require('mongoose');

const habitTemplateSchema = new mongoose.Schema({
  habit: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [50, 'Habit name cannot be more than 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [30, 'Category name cannot be more than 30 characters']
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    trim: true,
    default: '✓'
  },
  used_count: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
habitTemplateSchema.index({ habit: 1 });
habitTemplateSchema.index({ category: 1 });
habitTemplateSchema.index({ used_count: -1 });

const HabitTemplate = mongoose.models.HabitTemplate || mongoose.model('HabitTemplate', habitTemplateSchema);

module.exports = HabitTemplate; 