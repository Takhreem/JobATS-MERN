const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getRecruiterApplications,
  getApplicantsForJob,
  updateApplicationStatus,
  downloadResume,
  scheduleInterview,
  getInterviews,
  getStats,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/stats', protect, getStats);
router.get('/my', protect, authorize('candidate'), getMyApplications);
router.get('/recruiter', protect, authorize('recruiter'), getRecruiterApplications);
router.get('/job/:jobId', protect, authorize('recruiter'), getApplicantsForJob);
router.get('/:id/resume', protect, downloadResume);
router.get('/:id/interviews', protect, getInterviews);
router.post('/:jobId', protect, authorize('candidate'), upload.single('resume'), applyForJob);
router.put('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);
router.post('/:id/interview', protect, authorize('recruiter'), scheduleInterview);

module.exports = router;
