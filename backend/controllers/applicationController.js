const Application = require('../models/Application');
const Job = require('../models/Job');
const Interview = require('../models/Interview');
const fs = require('fs');
const path = require('path');

// @desc    Apply for a job (candidate)
// @route   POST /api/applications/:jobId
// @access  Private/Candidate
const applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      // cleanup uploaded file if job doesn't exist
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Job not found' });
    }

    const existing = await Application.findOne({ userId: req.user._id, jobId });
    if (existing) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = await Application.create({
      userId: req.user._id,
      jobId,
      resume: req.file.filename,
      status: 'Applied',
    });

    res.status(201).json(application);
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
};

// @desc    Get applications of logged-in candidate
// @route   GET /api/applications/my
// @access  Private/Candidate
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('jobId', 'title company location')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for recruiter's jobs
// @route   GET /api/applications/recruiter
// @access  Private/Recruiter
const getRecruiterApplications = async (req, res, next) => {
  try {
    const myJobs = await Job.find({ createdBy: req.user._id }).select('_id');
    const jobIds = myJobs.map((j) => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('userId', 'name email')
      .populate('jobId', 'title company location')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Get applicants for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private/Recruiter
const getApplicantsForJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (recruiter)
// @route   PUT /api/applications/:id/status
// @access  Private/Recruiter
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Applied', 'Interview', 'Selected', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Verify recruiter owns the job
    if (application.jobId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Download resume
// @route   GET /api/applications/:id/resume
// @access  Private
const downloadResume = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Only candidate or the job's recruiter can access
    const isCandidate = application.userId.toString() === req.user._id.toString();
    const isRecruiter =
      req.user.role === 'recruiter' &&
      application.jobId.createdBy.toString() === req.user._id.toString();

    if (!isCandidate && !isRecruiter) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', application.resume);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};

// @desc    Schedule an interview
// @route   POST /api/applications/:id/interview
// @access  Private/Recruiter
const scheduleInterview = async (req, res, next) => {
  try {
    const { date, feedback } = req.body;
    if (!date) return res.status(400).json({ message: 'Interview date is required' });

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.jobId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const interview = await Interview.create({
      applicationId: application._id,
      date,
      feedback: feedback || '',
    });

    // Auto-update status to Interview if currently Applied
    if (application.status === 'Applied') {
      application.status = 'Interview';
      await application.save();
    }

    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

// @desc    Get interviews for an application
// @route   GET /api/applications/:id/interviews
// @access  Private
const getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ applicationId: req.params.id }).sort({ date: 1 });
    res.json(interviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Dashboard analytics
// @route   GET /api/applications/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    if (req.user.role === 'recruiter') {
      const myJobs = await Job.find({ createdBy: req.user._id }).select('_id');
      const jobIds = myJobs.map((j) => j._id);
      const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });

      const statusCounts = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const statusMap = { Applied: 0, Interview: 0, Selected: 0, Rejected: 0 };
      statusCounts.forEach((s) => (statusMap[s._id] = s.count));

      res.json({
        totalJobs: myJobs.length,
        totalApplications,
        statusBreakdown: statusMap,
      });
    } else {
      const totalApplications = await Application.countDocuments({ userId: req.user._id });
      const totalJobs = await Job.countDocuments();

      const statusCounts = await Application.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const statusMap = { Applied: 0, Interview: 0, Selected: 0, Rejected: 0 };
      statusCounts.forEach((s) => (statusMap[s._id] = s.count));

      res.json({
        totalJobs,
        totalApplications,
        statusBreakdown: statusMap,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getRecruiterApplications,
  getApplicantsForJob,
  updateApplicationStatus,
  downloadResume,
  scheduleInterview,
  getInterviews,
  getStats,
};
