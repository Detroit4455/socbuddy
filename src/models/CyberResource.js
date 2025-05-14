import mongoose from 'mongoose';

const CyberResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a resource name'],
    trim: true
  },
  details: {
    type: String,
    required: [true, 'Please provide resource details'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Please provide a URL'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please provide a resource type'],
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true
  },
  followCount: {
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

// Create a text index for search functionality
CyberResourceSchema.index({ 
  name: 'text', 
  details: 'text', 
  type: 'text', 
  category: 'text',
  tags: 'text'
});

export default mongoose.models.CyberResource || mongoose.model('CyberResource', CyberResourceSchema); 