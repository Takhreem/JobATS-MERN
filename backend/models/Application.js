const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resume: {
      type: String,
      required: [true, 'Resume is required'],
    },
    status: {
      type: String,
      enum: ['Applied', 'Interview', 'Selected', 'Rejected'],
      default: 'Applied',
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
