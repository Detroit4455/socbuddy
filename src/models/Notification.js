const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required']
  },
  type: {
    type: String,
    enum: ['marathon-completion', 'invitation', 'system'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  marathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit.marathons'
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit'
  },
  habitName: {
    type: String
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification; 