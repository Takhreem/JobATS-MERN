const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getJobs);
router.get('/my/listings', protect, authorize('recruiter'), getMyJobs);
router.get('/:id', getJobById);
router.post('/', protect, authorize('recruiter'), createJob);
router.put('/:id', protect, authorize('recruiter'), updateJob);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;
