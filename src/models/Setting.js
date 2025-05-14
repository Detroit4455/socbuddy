const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Setting value is required']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index on key for faster lookups
settingSchema.index({ key: 1 }, { unique: true });
settingSchema.index({ category: 1 });

// Add a pre-save hook to normalize boolean values
settingSchema.pre('save', function(next) {
  // If the key indicates this is a boolean setting
  if (this.key === 'habit_notifications_enabled' || this.key.endsWith('_enabled')) {
    // Normalize to actual boolean values
    if (this.value === 'true' || this.value === 1) {
      this.value = true;
    } else if (this.value === 'false' || this.value === 0) {
      this.value = false;
    }
    // All other values remain as they are
  }
  next();
});

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

module.exports = Setting; 