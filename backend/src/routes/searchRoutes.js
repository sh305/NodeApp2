const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { optionalAuth } = require('../middlewares/authMiddleware');

router.get('/', optionalAuth, globalSearch);

module.exports = router;
