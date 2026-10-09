const express = require('express');
const router = express.Router();
const {
  getTrendingPosts,
  getFollowingPosts,
  createPost,
  toggleLikePost,
  getComments,
  addComment,
} = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/trending', protect, getTrendingPosts);
router.get('/following', protect, getFollowingPosts);
router.post('/create', protect, createPost);
router.post('/:id/like', protect, toggleLikePost);
router.get('/:id/comments', protect, getComments);
router.post('/:id/comment', protect, addComment);

module.exports = router;
