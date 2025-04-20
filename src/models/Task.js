const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  awaiting: {
    type: Boolean,
    default: false
  }
});

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Awaiting'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true
  },
  userProfile: {
    type: String,
    enum: ['work', 'personal'],
    default: 'work'
  },
  profile_used: {
    type: String,
    trim: true,
    default: function() {
      return `${this.userProfile || 'work'} profile`;
    }
  },
  detail: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  comments: [commentSchema],
  expanded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
taskSchema.index({ status: 1 });
taskSchema.index({ owner: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ startDate: 1 });
taskSchema.index({ userId: 1 });
taskSchema.index({ userProfile: 1 });
taskSchema.index({ profile_used: 1 });

// Create the model if it doesn't exist, otherwise use the existing one
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

module.exports = Task; 