const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all jobs (with search/filter)
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const { title, location } = req.query;
    const filter = {};

    if (title) filter.title = { $regex: title, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };

    const jobs = await Job.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private/Recruiter
const createJob = async (req, res, next) => {
  try {
    const { title, description, company, location, salary } = req.body;

    if (!title || !description || !company || !location) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const job = await Job.create({
      title,
      description,
      company,
      location,
      salary,
      createdBy: req.user._id,
    });

    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private/Recruiter
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private/Recruiter
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // Also remove related applications
    await Application.deleteMany({ jobId: job._id });
    await job.deleteOne();

    res.json({ message: 'Job removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get jobs created by logged-in recruiter
// @route   GET /api/jobs/my/listings
// @access  Private/Recruiter
const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
};
